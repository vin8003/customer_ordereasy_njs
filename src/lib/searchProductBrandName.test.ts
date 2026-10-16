/** Run with: npm test (node --test, TypeScript stripped at runtime). */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { visibleSearchProductBrandName } from './searchProductBrandName.ts';

describe('visibleSearchProductBrandName — search results brand (OE-316 / OE-328)', () => {
    it('returns a trimmed top-level brand_name when it is non-empty', () => {
        assert.equal(visibleSearchProductBrandName({ brand_name: '  Amul  ' }), 'Amul');
        assert.equal(visibleSearchProductBrandName({ brand_name: 'Nestlé' }), 'Nestlé');
    });

    it('renders nothing for null, blank, or absent brand_name', () => {
        assert.equal(visibleSearchProductBrandName({ brand_name: null }), null);
        assert.equal(visibleSearchProductBrandName({ brand_name: '' }), null);
        assert.equal(visibleSearchProductBrandName({ brand_name: '   ' }), null);
        assert.equal(visibleSearchProductBrandName({}), null);
        assert.equal(visibleSearchProductBrandName(undefined), null);
        assert.equal(visibleSearchProductBrandName(null), null);
    });

    it('does not invent a brand from nested brand objects or non-strings', () => {
        assert.equal(
            visibleSearchProductBrandName({
                brand: { name: 'Hidden Brand' },
            } as { brand_name?: string | null }),
            null
        );
        assert.equal(
            visibleSearchProductBrandName({
                brand_name: '   ',
                brand: { name: 'Hidden Brand' },
            } as { brand_name?: string | null }),
            null
        );
        assert.equal(
            visibleSearchProductBrandName({
                brand_name: 'Visible',
                brand: { name: 'Other' },
            } as { brand_name?: string | null }),
            'Visible'
        );
        assert.equal(
            visibleSearchProductBrandName({ brand_name: 12 as unknown as string }),
            null
        );
    });
});
