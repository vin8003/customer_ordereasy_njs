/** Run with: npm test (node --test, TypeScript stripped at runtime). */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { formatVisibleProductRating } from './productDetailRating.ts';

describe('formatVisibleProductRating', () => {
    it('returns the trimmed top-level rating when it is a present non-zero number', () => {
        assert.equal(formatVisibleProductRating(4.5), '4.5');
        assert.equal(formatVisibleProductRating(5), '5');
        assert.equal(formatVisibleProductRating('4.5'), '4.5');
        assert.equal(formatVisibleProductRating('  4.50  '), '4.50');
    });

    it('returns null instead of inventing a rating when missing, null, blank, or zero', () => {
        for (const value of [undefined, null, '', '   ', 0, '0', '0.00', 0.0]) {
            assert.equal(formatVisibleProductRating(value), null, String(value));
        }
    });

    it('does not invent a rating from average_rating objects, nested junk, or non-numeric values', () => {
        for (const value of [
            { rating: 4.5 },
            { average_rating: 4.8 },
            '★ 4.5',
            'n/a',
            NaN,
            Infinity,
            -Infinity,
            true,
            false,
            [],
            [4.5],
        ]) {
            assert.equal(formatVisibleProductRating(value), null, String(value));
        }
    });
});
