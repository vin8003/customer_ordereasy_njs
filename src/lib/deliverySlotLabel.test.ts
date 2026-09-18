/** Run with: npm test (node --test, TypeScript stripped at runtime). */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { formatVisibleDeliverySlotLabel } from './deliverySlotLabel.ts';

describe('formatVisibleDeliverySlotLabel', () => {
    it('returns the trimmed API label when it is a non-empty string', () => {
        assert.equal(formatVisibleDeliverySlotLabel('Morning 8–10 AM'), 'Morning 8–10 AM');
        assert.equal(formatVisibleDeliverySlotLabel('  Evening slot  '), 'Evening slot');
    });

    it('returns null instead of inventing a slot label when missing, null, or blank', () => {
        for (const value of [undefined, null, '', '   ']) {
            assert.equal(formatVisibleDeliverySlotLabel(value), null, String(value));
        }
    });

    it('does not invent a label from numbers, objects, or other junk', () => {
        for (const value of [
            12,
            0,
            true,
            false,
            { label: 'Morning 8–10 AM' },
            ['Morning 8–10 AM'],
            { delivery_slot_label: 'Evening' },
        ]) {
            assert.equal(formatVisibleDeliverySlotLabel(value), null, String(value));
        }
    });
});
