/** Run with: npm test (node --test, TypeScript stripped at runtime). */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { visibleOrderListStoreName } from './orderListStoreName.ts';

describe('visibleOrderListStoreName — order list row store line', () => {
    it('returns a trimmed top-level store_name when it is non-empty', () => {
        assert.equal(visibleOrderListStoreName({ store_name: '  Kirana Mart  ' }), 'Kirana Mart');
        assert.equal(visibleOrderListStoreName({ store_name: "Vineet's Store" }), "Vineet's Store");
    });

    it('renders nothing for null, blank, or absent store_name', () => {
        assert.equal(visibleOrderListStoreName({ store_name: null }), null);
        assert.equal(visibleOrderListStoreName({ store_name: '' }), null);
        assert.equal(visibleOrderListStoreName({ store_name: '   ' }), null);
        assert.equal(visibleOrderListStoreName({}), null);
        assert.equal(visibleOrderListStoreName(undefined), null);
        assert.equal(visibleOrderListStoreName(null), null);
    });

    it('does not invent a store name from retailer_name or nested shop fields', () => {
        assert.equal(
            visibleOrderListStoreName({
                retailer_name: 'Hidden Retailer',
            } as { store_name?: string | null }),
            null
        );
        assert.equal(
            visibleOrderListStoreName({
                store_name: '   ',
                retailer_name: 'Hidden Retailer',
                shop_name: 'Hidden Shop',
            } as { store_name?: string | null }),
            null
        );
        assert.equal(
            visibleOrderListStoreName({
                shop: { shop_name: 'Hidden Shop' },
            } as { store_name?: string | null }),
            null
        );
        assert.equal(
            visibleOrderListStoreName({
                store_name: 'Visible Store',
                retailer_name: 'Other Retailer',
            } as { store_name?: string | null }),
            'Visible Store'
        );
    });

    it('does not invent a store name from non-string top-level values', () => {
        assert.equal(visibleOrderListStoreName({ store_name: 12 as unknown as string }), null);
        assert.equal(
            visibleOrderListStoreName({ store_name: { name: 'Obj' } as unknown as string }),
            null
        );
    });
});
