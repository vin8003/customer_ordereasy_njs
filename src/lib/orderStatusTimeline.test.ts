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

    it('keeps a generic cancellation on the delivered step, with nothing failed', () => {
        const steps = buildOrderStatusTimeline({
            status: 'cancelled',
            delivery_mode: 'delivery',
            cancelled_by: 'retailer',
            cancellation_reason: 'Out of stock',
        });
        assert.deepEqual(
            steps.map((s) => s.key),
            ['placed', 'packed', 'out_for_delivery', 'delivered']
        );
        assert.ok(steps.every((s) => !s.failed));
    });
});

describe('buildOrderStatusTimeline — failed delivery (OE-281)', () => {
    const failedOrder = {
        status: 'cancelled',
        delivery_mode: 'delivery',
        cancelled_by: 'retailer',
        cancellation_reason: 'Delivery failed — customer not reachable',
    };

    it('swaps only the terminal step and keeps placed → packed → OFD intact', () => {
        const steps = buildOrderStatusTimeline(failedOrder);
        assert.deepEqual(
            steps.map((s) => s.key),
            ['placed', 'packed', 'out_for_delivery', 'delivery_failed']
        );
        assert.deepEqual(
            steps.map((s) => s.label),
            ['Placed', 'Packed', 'Out for delivery', 'Delivery failed']
        );
    });

    it('marks the failed step as the terminal one, with no current step', () => {
        const steps = buildOrderStatusTimeline(failedOrder);
        assert.ok(steps.every((s) => s.reached));
        assert.ok(steps.every((s) => !s.current));
        assert.deepEqual(
            steps.map((s) => s.failed),
            [false, false, false, true]
        );
    });

    it('also triggers on a failed courier record or an explicit failed status', () => {
        for (const order of [
            {
                status: 'cancelled',
                delivery_mode: 'delivery',
                delivery_info: { delivery_status: 'failed' },
            },
            { status: 'delivery_failed', delivery_mode: 'delivery' },
        ]) {
            const steps = buildOrderStatusTimeline(order);
            assert.equal(steps[steps.length - 1].key, 'delivery_failed', order.status);
            assert.equal(steps[steps.length - 1].failed, true, order.status);
        }
    });

    it('timestamps the failed step from cancelled_at, falling back to status_logs', () => {
        const fromField = buildOrderStatusTimeline({
            ...failedOrder,
            cancelled_at: '2026-09-14T10:00:00Z',
        });
        assert.equal(
            fromField.find((s) => s.key === 'delivery_failed')?.at,
            '2026-09-14T10:00:00Z'
        );

        const fromLogs = buildOrderStatusTimeline({
            ...failedOrder,
            status_logs: [
                { status: 'out_for_delivery', created_at: '2026-09-14T08:00:00Z' },
                { status: 'cancelled', created_at: '2026-09-14T10:30:00Z' },
            ],
        });
        assert.equal(
            fromLogs.find((s) => s.key === 'out_for_delivery')?.at,
            '2026-09-14T08:00:00Z'
        );
        assert.equal(
            fromLogs.find((s) => s.key === 'delivery_failed')?.at,
            '2026-09-14T10:30:00Z'
        );
    });

    it('leaves the pickup path untouched', () => {
        const steps = buildOrderStatusTimeline({
            status: 'cancelled',
            delivery_mode: 'pickup',
            cancellation_reason: 'Delivery failed',
            delivery_info: { delivery_status: 'failed' },
        });
        assert.deepEqual(
            steps.map((s) => s.key),
            ['placed', 'packed', 'delivered']
        );
        assert.ok(steps.every((s) => !s.failed));
    });
});
