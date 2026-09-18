/** Run with: npm test (node --test, TypeScript stripped at runtime). */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { formatVisibleMinOrderQty } from './productMinOrderQty.ts';

describe('formatVisibleMinOrderQty', () => {
    it('returns the trimmed top-level min_order_qty when present and positive', () => {
        assert.equal(formatVisibleMinOrderQty(6), '6');
        assert.equal(formatVisibleMinOrderQty(1), '1');
        assert.equal(formatVisibleMinOrderQty('12'), '12');
        assert.equal(formatVisibleMinOrderQty('  3  '), '3');
        assert.equal(formatVisibleMinOrderQty('4.5'), '4.5');
    });

    it('hides missing, null, blank, zero, negative, and non-numeric values', () => {
        for (const value of [
            undefined,
            null,
            '',
            '   ',
            0,
            '0',
            '0.00',
            -1,
            '-2',
            NaN,
            Infinity,
            -Infinity,
            true,
            false,
            {},
            [],
            'six',
            '₹6',
        ]) {
            assert.equal(formatVisibleMinOrderQty(value), null, String(value));
        }
    });

    it('does not invent min_order_qty from nested objects or minimum_order_quantity', () => {
        assert.equal(formatVisibleMinOrderQty({ min_order_qty: 6 }), null);
        assert.equal(formatVisibleMinOrderQty({ minimum_order_quantity: 6 }), null);
    });
});
