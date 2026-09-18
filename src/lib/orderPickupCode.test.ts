/** Run with: npm test (node --test, TypeScript stripped at runtime). */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { getVisiblePickupCode } from './orderPickupCode.ts';

describe('getVisiblePickupCode', () => {
    it('returns the trimmed pickup_code when the API sent a non-empty string', () => {
        assert.equal(getVisiblePickupCode({ pickup_code: '4821' }), '4821');
        assert.equal(getVisiblePickupCode({ pickup_code: '  A1B2  ' }), 'A1B2');
    });

    it('returns null when pickup_code is omitted, null, blank, or not a string', () => {
        for (const order of [
            {},
            { pickup_code: undefined },
            { pickup_code: null },
            { pickup_code: '' },
            { pickup_code: '   ' },
            { pickup_code: 4821 as unknown as string },
            { pickup_code: true as unknown as string },
            { pickup_code: { code: 'nope' } as unknown as string },
        ]) {
            assert.equal(getVisiblePickupCode(order), null, JSON.stringify(order));
        }
    });

    it('does not invent a pickup code from order_number, pickup_ready_at, or delivery_info', () => {
        assert.equal(
            getVisiblePickupCode({
                order_number: 'OE-1001',
                pickup_ready_at: '2026-09-18T10:00:00Z',
                delivery_mode: 'pickup',
                delivery_info: { pickup_code: 'HIDDEN' },
                fulfillment_slot_start: '2026-09-18T10:00:00Z',
            }),
            null
        );
        assert.equal(
            getVisiblePickupCode({
                pickup_code: null,
                order_number: 'OE-1001',
                pickup_ready_at: '2026-09-18T10:00:00Z',
                delivery_info: { pickup_code: 'HIDDEN' },
            }),
            null
        );
        assert.equal(
            getVisiblePickupCode({
                pickup_code: '   ',
                order_number: 'OE-1001',
                delivery_mode: 'pickup',
            }),
            null
        );
        assert.equal(
            getVisiblePickupCode({
                pickup_code: '  7733  ',
                order_number: 'OE-1001',
                delivery_info: { pickup_code: 'HIDDEN' },
            }),
            '7733'
        );
    });
});
