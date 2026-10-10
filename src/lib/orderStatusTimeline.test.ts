/** Run with: npm test (node --test, TypeScript stripped at runtime). */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { buildOrderStatusTimeline } from './orderStatusTimeline.ts';

describe('buildOrderStatusTimeline — delivery', () => {
    it('uses placed → packed → out_for_delivery → delivered', () => {
        const steps = buildOrderStatusTimeline({
            status: 'pending',
            delivery_mode: 'delivery',
        });
        assert.deepEqual(
            steps.map((s) => s.key),
            ['placed', 'packed', 'out_for_delivery', 'delivered']
        );
        assert.deepEqual(
            steps.map((s) => s.label),
            ['Placed', 'Packed', 'Out for delivery', 'Delivered']
        );
    });

    it('highlights placed and mutes later steps while the order is still being prepared', () => {
        for (const status of ['pending', 'confirmed', 'processing', 'waiting_for_customer_approval']) {
            const steps = buildOrderStatusTimeline({ status, delivery_mode: 'delivery' });
            assert.equal(steps[0].reached, true, status);
            assert.equal(steps[0].current, true, status);
            assert.deepEqual(
                steps.slice(1).map((s) => [s.reached, s.current]),
                [
                    [false, false],
                    [false, false],
                    [false, false],
                ],
                status
            );
        }
    });

    it('marks packed current and keeps later steps muted', () => {
        const steps = buildOrderStatusTimeline({ status: 'packed', delivery_mode: 'delivery' });
        assert.deepEqual(
            steps.map((s) => ({ key: s.key, reached: s.reached, current: s.current })),
            [
                { key: 'placed', reached: true, current: false },
                { key: 'packed', reached: true, current: true },
                { key: 'out_for_delivery', reached: false, current: false },
                { key: 'delivered', reached: false, current: false },
            ]
        );
    });

    it('marks out_for_delivery current after packed', () => {
        const steps = buildOrderStatusTimeline({
            status: 'out_for_delivery',
            delivery_mode: 'delivery',
        });
        assert.deepEqual(
            steps.map((s) => ({ key: s.key, reached: s.reached, current: s.current })),
            [
                { key: 'placed', reached: true, current: false },
                { key: 'packed', reached: true, current: false },
                { key: 'out_for_delivery', reached: true, current: true },
                { key: 'delivered', reached: false, current: false },
            ]
        );
    });

    it('marks every delivery step reached when delivered', () => {
        const steps = buildOrderStatusTimeline({ status: 'delivered', delivery_mode: 'delivery' });
        assert.ok(steps.every((s) => s.reached));
        assert.equal(steps.find((s) => s.key === 'delivered')?.current, true);
        assert.equal(steps.filter((s) => s.current).length, 1);
    });
});

describe('buildOrderStatusTimeline — pickup', () => {
    it('uses placed → packed/ready → collected and omits out_for_delivery', () => {
        const steps = buildOrderStatusTimeline({
            status: 'pending',
            delivery_mode: 'pickup',
        });
        assert.deepEqual(
            steps.map((s) => s.key),
            ['placed', 'packed', 'delivered']
        );
        assert.deepEqual(
            steps.map((s) => s.label),
            ['Placed', 'Ready for pickup', 'Collected']
        );
        assert.equal(
            steps.some((s) => s.key === 'out_for_delivery'),
            false
        );
    });

    it('highlights ready-for-pickup when packed', () => {
        const steps = buildOrderStatusTimeline({ status: 'packed', delivery_mode: 'pickup' });
        assert.equal(steps.find((s) => s.key === 'packed')?.current, true);
        assert.equal(steps.find((s) => s.key === 'packed')?.reached, true);
        assert.equal(steps.find((s) => s.key === 'delivered')?.reached, false);
    });

    it('treats a stray out_for_delivery status as packed, still without an OFD step', () => {
        const steps = buildOrderStatusTimeline({
            status: 'out_for_delivery',
            delivery_mode: 'pickup',
        });
        assert.equal(steps.some((s) => s.key === 'out_for_delivery'), false);
        assert.equal(steps.find((s) => s.key === 'packed')?.current, true);
        assert.equal(steps.find((s) => s.key === 'delivered')?.reached, false);
    });

    it('marks collected current when delivered', () => {
        const steps = buildOrderStatusTimeline({ status: 'Delivered', delivery_mode: 'pickup' });
        assert.ok(steps.every((s) => s.reached));
        assert.equal(steps.find((s) => s.key === 'delivered')?.current, true);
        assert.equal(steps.find((s) => s.key === 'delivered')?.label, 'Collected');
    });
});

describe('buildOrderStatusTimeline — timestamps and cancelled', () => {
    it('attaches existing payload timestamps only on reached steps', () => {
        const created = '2026-09-14T06:00:00Z';
        const packedAt = '2026-09-14T07:00:00Z';
        const ofdAt = '2026-09-14T08:00:00Z';
        const deliveredAt = '2026-09-14T09:00:00Z';

        const packed = buildOrderStatusTimeline({
            status: 'packed',
            delivery_mode: 'delivery',
            created_at: created,
            packed_at: packedAt,
            out_for_delivery_at: ofdAt,
            delivered_at: deliveredAt,
        });
        assert.equal(packed.find((s) => s.key === 'placed')?.at, created);
        assert.equal(packed.find((s) => s.key === 'packed')?.at, packedAt);
        assert.equal(packed.find((s) => s.key === 'out_for_delivery')?.at, null);
        assert.equal(packed.find((s) => s.key === 'delivered')?.at, null);

        const pickupPacked = buildOrderStatusTimeline({
            status: 'packed',
            delivery_mode: 'pickup',
            created_at: created,
            pickup_ready_at: packedAt,
        });
        assert.equal(pickupPacked.find((s) => s.key === 'packed')?.at, packedAt);

        const delivered = buildOrderStatusTimeline({
            status: 'delivered',
            delivery_mode: 'delivery',
            created_at: created,
            delivery_info: { actual_delivery_time: deliveredAt },
        });
        assert.equal(delivered.find((s) => s.key === 'delivered')?.at, deliveredAt);
    });

    it('uses status_logs timestamps when dedicated fields are absent', () => {
        const steps = buildOrderStatusTimeline({
            status: 'out_for_delivery',
            delivery_mode: 'delivery',
            created_at: '2026-09-14T06:00:00Z',
            status_logs: [
                { status: 'packed', created_at: '2026-09-14T07:10:00Z' },
                { to_status: 'out_for_delivery', timestamp: '2026-09-14T08:20:00Z' },
            ],
        });
        assert.equal(steps.find((s) => s.key === 'packed')?.at, '2026-09-14T07:10:00Z');
        assert.equal(steps.find((s) => s.key === 'out_for_delivery')?.at, '2026-09-14T08:20:00Z');
    });

    it('on cancelled, keeps only placed reached unless logs show later steps', () => {
        const cancelled = buildOrderStatusTimeline({
            status: 'cancelled',
            delivery_mode: 'delivery',
            created_at: '2026-09-14T06:00:00Z',
        });
        assert.equal(cancelled[0].reached, true);
        assert.equal(cancelled[0].current, false);
        assert.ok(cancelled.slice(1).every((s) => !s.reached && !s.current));

        const cancelledAfterPacked = buildOrderStatusTimeline({
            status: 'cancelled',
            delivery_mode: 'delivery',
            status_logs: [{ status: 'packed', created_at: '2026-09-14T07:00:00Z' }],
        });
        assert.equal(cancelledAfterPacked.find((s) => s.key === 'packed')?.reached, true);
        assert.equal(cancelledAfterPacked.find((s) => s.key === 'out_for_delivery')?.reached, false);
        assert.ok(cancelledAfterPacked.every((s) => !s.current));
    });
});
