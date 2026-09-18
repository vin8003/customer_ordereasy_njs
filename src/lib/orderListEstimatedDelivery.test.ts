/** Run with: npm test (node --test, TypeScript stripped at runtime). */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
    formatVisibleEstimatedDelivery,
    getVisibleEstimatedDeliveryDate,
} from './orderListEstimatedDelivery.ts';

describe('formatVisibleEstimatedDelivery', () => {
    it('formats a present calendar date as a date label', () => {
        assert.equal(formatVisibleEstimatedDelivery('2026-09-20'), '20 Sep 2026');
        assert.equal(formatVisibleEstimatedDelivery(' 2026-09-20 '), '20 Sep 2026');
        assert.equal(formatVisibleEstimatedDelivery('2026-09-20T12:00:00Z'), '20 Sep 2026');
    });

    it('hides missing, blank, non-string, and unparseable values', () => {
        for (const value of [
            undefined,
            null,
            '',
            '   ',
            'not-a-date',
            '2026-02-31',
            '2026-13-01',
            0,
            20260920,
            true,
            false,
            {},
            [],
            { estimated_delivery: '2026-09-20' },
        ]) {
            assert.equal(formatVisibleEstimatedDelivery(value), null, String(value));
        }
    });
});

describe('getVisibleEstimatedDeliveryDate', () => {
    it('shows only top-level estimated_delivery', () => {
        assert.equal(
            getVisibleEstimatedDeliveryDate({ estimated_delivery: '2026-09-20' }),
            '20 Sep 2026'
        );
    });

    it('does not invent a date from courier ETA, slots, or created_at', () => {
        assert.equal(
            getVisibleEstimatedDeliveryDate({
                estimated_delivery_time: '2026-09-21T10:00:00Z',
                fulfillment_slot_start: '2026-09-22T08:00:00Z',
                fulfillment_slot_end: '2026-09-22T10:00:00Z',
                created_at: '2026-09-18T10:00:00Z',
                delivery_info: { estimated_delivery_time: '2026-09-21T18:00:00Z' },
            }),
            null
        );
        assert.equal(
            getVisibleEstimatedDeliveryDate({
                estimated_delivery: null,
                estimated_delivery_time: '2026-09-21T10:00:00Z',
            }),
            null
        );
        assert.equal(getVisibleEstimatedDeliveryDate({}), null);
    });

    it('ignores sibling fields when estimated_delivery is present', () => {
        assert.equal(
            getVisibleEstimatedDeliveryDate({
                estimated_delivery: '2026-09-20',
                estimated_delivery_time: '2026-09-21T10:00:00Z',
                fulfillment_slot_end: '2026-09-22T10:00:00Z',
                created_at: '2026-09-18T10:00:00Z',
            }),
            '20 Sep 2026'
        );
    });
});
