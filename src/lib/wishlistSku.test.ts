/** Run with: npm test (node --test, TypeScript stripped at runtime). */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { getVisibleWishlistSku } from './wishlistSku.ts';

describe('getVisibleWishlistSku', () => {
    it('returns a trimmed SKU when the top-level field is present and non-empty', () => {
        assert.equal(getVisibleWishlistSku('ATT-5KG'), 'ATT-5KG');
        assert.equal(getVisibleWishlistSku('  SKU-01  '), 'SKU-01');
        assert.equal(getVisibleWishlistSku(1001), '1001');
    });

    it('returns null instead of inventing a SKU when the field is missing, null, or blank', () => {
        for (const value of [undefined, null, '', '   ']) {
            assert.equal(getVisibleWishlistSku(value), null, String(value));
        }
    });

    it('does not invent a SKU from nested objects, product ids, or other junk', () => {
        for (const value of [
            { sku: 'NESTED' },
            { product: { sku: 'NESTED' } },
            true,
            false,
            [],
            NaN,
            Infinity,
            -Infinity,
        ]) {
            assert.equal(getVisibleWishlistSku(value), null, String(value));
        }
    });
});
