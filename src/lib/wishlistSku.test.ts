/** Run with: npm test (node --test, TypeScript stripped at runtime). */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { visibleWishlistSku } from './wishlistSku.ts';

describe('visibleWishlistSku — wishlist row sku line', () => {
    it('returns a trimmed top-level sku when it is non-empty', () => {
        assert.equal(visibleWishlistSku({ sku: '  SKU-1001  ' }), 'SKU-1001');
        assert.equal(visibleWishlistSku({ sku: 'ABC-22' }), 'ABC-22');
    });

    it('renders nothing for null, blank, or absent sku', () => {
        assert.equal(visibleWishlistSku({ sku: null }), null);
        assert.equal(visibleWishlistSku({ sku: '' }), null);
        assert.equal(visibleWishlistSku({ sku: '   ' }), null);
        assert.equal(visibleWishlistSku({}), null);
        assert.equal(visibleWishlistSku(undefined), null);
        assert.equal(visibleWishlistSku(null), null);
    });

    it('does not invent a sku from nested product or sku objects', () => {
        assert.equal(
            visibleWishlistSku({
                product: { sku: 'NESTED-1' },
            } as { sku?: string | null }),
            null
        );
        assert.equal(
            visibleWishlistSku({
                sku: '   ',
                product: { sku: 'NESTED-1' },
            } as { sku?: string | null }),
            null
        );
        assert.equal(
            visibleWishlistSku({
                sku: 'VISIBLE-9',
                product: { sku: 'OTHER' },
            } as { sku?: string | null }),
            'VISIBLE-9'
        );
    });

    it('does not invent a sku from non-string top-level values', () => {
        assert.equal(visibleWishlistSku({ sku: 12 as unknown as string }), null);
        assert.equal(
            visibleWishlistSku({ sku: { code: 'Obj' } as unknown as string }),
            null
        );
    });
});
