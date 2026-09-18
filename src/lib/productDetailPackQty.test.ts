/** Run with: npm test (node --test, TypeScript stripped at runtime). */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { formatVisiblePackQty } from './productDetailPackQty.ts';

describe('formatVisiblePackQty', () => {
    it('returns the trimmed top-level pack_qty when it is a non-empty string or finite number', () => {
        assert.equal(formatVisiblePackQty('12'), '12');
        assert.equal(formatVisiblePackQty('  6  '), '6');
        assert.equal(formatVisiblePackQty(12), '12');
        assert.equal(formatVisiblePackQty(0.5), '0.5');
        assert.equal(formatVisiblePackQty(0), '0');
    });

    it('returns null instead of inventing a pack qty when missing, null, or blank', () => {
        for (const value of [undefined, null, '', '   ']) {
            assert.equal(formatVisiblePackQty(value), null, String(value));
        }
    });

    it('does not invent a pack qty from pack_size, unit, nested objects, or junk', () => {
        for (const value of [
            { pack_qty: 12 },
            { pack_size: '500 g' },
            { pack: { qty: 12 } },
            { unit: 'pcs' },
            Number.NaN,
            Number.POSITIVE_INFINITY,
            Number.NEGATIVE_INFINITY,
            true,
            false,
            [],
            [12],
        ]) {
            assert.equal(formatVisiblePackQty(value), null, String(value));
        }
    });
});
