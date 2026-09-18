/** Run with: npm test (node --test, TypeScript stripped at runtime). */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { visibleCartLineBundleId } from './cartLineBundleId.ts';

describe('visibleCartLineBundleId — cart line bundle_id', () => {
    it('returns a trimmed top-level bundle_id when it is non-empty', () => {
        assert.equal(visibleCartLineBundleId({ bundle_id: '  bdl_42  ' }), 'bdl_42');
        assert.equal(visibleCartLineBundleId({ bundle_id: 'bundle-9' }), 'bundle-9');
        assert.equal(visibleCartLineBundleId({ bundle_id: 12 }), '12');
        assert.equal(visibleCartLineBundleId({ bundle_id: 0 }), '0');
    });

    it('renders nothing for null, blank, or absent bundle_id', () => {
        assert.equal(visibleCartLineBundleId({ bundle_id: null }), null);
        assert.equal(visibleCartLineBundleId({ bundle_id: '' }), null);
        assert.equal(visibleCartLineBundleId({ bundle_id: '   ' }), null);
        assert.equal(visibleCartLineBundleId({}), null);
        assert.equal(visibleCartLineBundleId(undefined), null);
        assert.equal(visibleCartLineBundleId(null), null);
    });

    it('does not invent a bundle id from nested bundle, camelCase, brand, or junk', () => {
        assert.equal(
            visibleCartLineBundleId({
                bundle: { id: 99 },
            } as { bundle_id?: string | number | null }),
            null
        );
        assert.equal(
            visibleCartLineBundleId({
                bundleId: 'hidden',
            } as { bundle_id?: string | number | null }),
            null
        );
        assert.equal(
            visibleCartLineBundleId({
                brand_name: 'Amul',
            } as { bundle_id?: string | number | null }),
            null
        );
        assert.equal(
            visibleCartLineBundleId({
                bundle_id: '   ',
                bundle: { id: 99 },
                brand_name: 'Amul',
            } as { bundle_id?: string | number | null }),
            null
        );
        assert.equal(
            visibleCartLineBundleId({
                bundle_id: 'bdl_7',
                bundle: { id: 99 },
                brand_name: 'Amul',
            } as { bundle_id?: string | number | null }),
            'bdl_7'
        );
        assert.equal(visibleCartLineBundleId({ bundle_id: Number.NaN }), null);
        assert.equal(visibleCartLineBundleId({ bundle_id: Number.POSITIVE_INFINITY }), null);
        assert.equal(
            visibleCartLineBundleId({ bundle_id: true as unknown as string }),
            null
        );
    });
});
