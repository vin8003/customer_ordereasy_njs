/** Run with: npm test (node --test, TypeScript stripped at runtime). */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { visibleProductBrandName } from './productBrandName.ts';

describe('visibleProductBrandName — ProductCard brand line (OE-316)', () => {
    it('returns a trimmed top-level brand_name when it is non-empty', () => {
        assert.equal(visibleProductBrandName({ brand_name: '  Amul  ' }), 'Amul');
        assert.equal(visibleProductBrandName({ brand_name: 'Nestlé' }), 'Nestlé');
    });

    it('renders nothing for null, blank, or absent brand_name', () => {
        assert.equal(visibleProductBrandName({ brand_name: null }), null);
        assert.equal(visibleProductBrandName({ brand_name: '' }), null);
        assert.equal(visibleProductBrandName({ brand_name: '   ' }), null);
        assert.equal(visibleProductBrandName({}), null);
        assert.equal(visibleProductBrandName(undefined), null);
        assert.equal(visibleProductBrandName(null), null);
    });

    it('does not invent a brand from nested brand objects', () => {
        assert.equal(
            visibleProductBrandName({
                brand: { name: 'Hidden Brand' },
            } as { brand_name?: string | null }),
            null
        );
        assert.equal(
            visibleProductBrandName({
                brand_name: '   ',
                brand: { name: 'Hidden Brand' },
            } as { brand_name?: string | null }),
            null
        );
        assert.equal(
            visibleProductBrandName({
                brand_name: 'Visible',
                brand: { name: 'Other' },
            } as { brand_name?: string | null }),
            'Visible'
        );
    });
});
