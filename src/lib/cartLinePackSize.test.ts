/** Run with: npm test (node --test, TypeScript stripped at runtime). */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { visibleCartLinePackSize } from './cartLinePackSize.ts';

describe('visibleCartLinePackSize — cart line pack_size (OE-342)', () => {
    it('returns a trimmed top-level pack_size when it is non-empty', () => {
        assert.equal(visibleCartLinePackSize({ pack_size: '  500 g  ' }), '500 g');
        assert.equal(visibleCartLinePackSize({ pack_size: '12x100ml' }), '12x100ml');
        assert.equal(visibleCartLinePackSize({ pack_size: 12 }), '12');
        assert.equal(visibleCartLinePackSize({ pack_size: 0.5 }), '0.5');
    });

    it('renders nothing for null, blank, or absent pack_size', () => {
        assert.equal(visibleCartLinePackSize({ pack_size: null }), null);
        assert.equal(visibleCartLinePackSize({ pack_size: '' }), null);
        assert.equal(visibleCartLinePackSize({ pack_size: '   ' }), null);
        assert.equal(visibleCartLinePackSize({}), null);
        assert.equal(visibleCartLinePackSize(undefined), null);
        assert.equal(visibleCartLinePackSize(null), null);
    });

    it('does not invent a pack size from unit, nested pack, camelCase, or junk', () => {
        assert.equal(
            visibleCartLinePackSize({
                unit: 'kg',
            } as { pack_size?: string | number | null }),
            null
        );
        assert.equal(
            visibleCartLinePackSize({
                pack: { size: 'Hidden' },
            } as { pack_size?: string | number | null }),
            null
        );
        assert.equal(
            visibleCartLinePackSize({
                packSize: '12 pcs',
            } as { pack_size?: string | number | null }),
            null
        );
        assert.equal(
            visibleCartLinePackSize({
                pack_size: '   ',
                unit: 'kg',
                pack: { size: 'Hidden' },
            } as { pack_size?: string | number | null }),
            null
        );
        assert.equal(
            visibleCartLinePackSize({
                pack_size: '1 L',
                unit: 'ml',
            } as { pack_size?: string | number | null }),
            '1 L'
        );
        assert.equal(visibleCartLinePackSize({ pack_size: Number.NaN }), null);
        assert.equal(visibleCartLinePackSize({ pack_size: Number.POSITIVE_INFINITY }), null);
        assert.equal(
            visibleCartLinePackSize({ pack_size: true as unknown as string }),
            null
        );
    });
});
