/** Run with: npm test (node --test, TypeScript stripped at runtime). */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { visibleWishlistBrandName } from './wishlistBrandName.ts';

describe('visibleWishlistBrandName — wishlist row brand line (OE-332)', () => {
    it('returns a trimmed top-level brand_name when it is non-empty', () => {
        assert.equal(visibleWishlistBrandName({ brand_name: '  Amul  ' }), 'Amul');
        assert.equal(visibleWishlistBrandName({ brand_name: 'Nestlé' }), 'Nestlé');
    });

    it('renders nothing for null, blank, or absent brand_name', () => {
        assert.equal(visibleWishlistBrandName({ brand_name: null }), null);
        assert.equal(visibleWishlistBrandName({ brand_name: '' }), null);
        assert.equal(visibleWishlistBrandName({ brand_name: '   ' }), null);
        assert.equal(visibleWishlistBrandName({}), null);
        assert.equal(visibleWishlistBrandName(undefined), null);
        assert.equal(visibleWishlistBrandName(null), null);
    });

    it('does not invent a brand from nested brand objects', () => {
        assert.equal(
            visibleWishlistBrandName({
                brand: { name: 'Hidden Brand' },
            } as { brand_name?: string | null }),
            null
        );
        assert.equal(
            visibleWishlistBrandName({
                brand_name: '   ',
                brand: { name: 'Hidden Brand' },
            } as { brand_name?: string | null }),
            null
        );
        assert.equal(
            visibleWishlistBrandName({
                brand_name: 'Visible',
                brand: { name: 'Other' },
            } as { brand_name?: string | null }),
            'Visible'
        );
    });

    it('does not invent a brand from non-string top-level values', () => {
        assert.equal(visibleWishlistBrandName({ brand_name: 12 as unknown as string }), null);
        assert.equal(
            visibleWishlistBrandName({ brand_name: { name: 'Obj' } as unknown as string }),
            null
        );
    });
});
