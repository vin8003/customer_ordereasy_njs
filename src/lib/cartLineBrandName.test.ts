/** Run with: npm test (node --test, TypeScript stripped at runtime). */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { visibleCartLineBrandName } from './cartLineBrandName.ts';

describe('visibleCartLineBrandName — cart line brand (OE-329)', () => {
    it('returns a trimmed top-level brand_name when it is non-empty', () => {
        assert.equal(visibleCartLineBrandName({ brand_name: '  Amul  ' }), 'Amul');
        assert.equal(visibleCartLineBrandName({ brand_name: 'Nestlé' }), 'Nestlé');
    });

    it('renders nothing for null, blank, or absent brand_name', () => {
        assert.equal(visibleCartLineBrandName({ brand_name: null }), null);
        assert.equal(visibleCartLineBrandName({ brand_name: '' }), null);
        assert.equal(visibleCartLineBrandName({ brand_name: '   ' }), null);
        assert.equal(visibleCartLineBrandName({}), null);
        assert.equal(visibleCartLineBrandName(undefined), null);
        assert.equal(visibleCartLineBrandName(null), null);
    });

    it('does not invent a brand from nested brand objects or non-strings', () => {
        assert.equal(
            visibleCartLineBrandName({
                brand: { name: 'Hidden Brand' },
            } as { brand_name?: string | null }),
            null
        );
        assert.equal(
            visibleCartLineBrandName({
                brand_name: '   ',
                brand: { name: 'Hidden Brand' },
            } as { brand_name?: string | null }),
            null
        );
        assert.equal(
            visibleCartLineBrandName({
                brand_name: 'Visible',
                brand: { name: 'Other' },
            } as { brand_name?: string | null }),
            'Visible'
        );
        assert.equal(
            visibleCartLineBrandName({ brand_name: 12 as unknown as string }),
            null
        );
    });
});
