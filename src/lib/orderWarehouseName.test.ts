/** Run with: npm test (node --test, TypeScript stripped at runtime). */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { getVisibleWarehouseName } from './orderWarehouseName.ts';

describe('getVisibleWarehouseName', () => {
    it('returns the trimmed warehouse_name when the API sent a non-empty string', () => {
        assert.equal(getVisibleWarehouseName({ warehouse_name: 'North Hub' }), 'North Hub');
        assert.equal(getVisibleWarehouseName({ warehouse_name: '  Andheri DC  ' }), 'Andheri DC');
    });

    it('returns null when warehouse_name is omitted, null, blank, or not a string', () => {
        for (const order of [
            {},
            { warehouse_name: undefined },
            { warehouse_name: null },
            { warehouse_name: '' },
            { warehouse_name: '   ' },
            { warehouse_name: 12 as unknown as string },
            { warehouse_name: true as unknown as string },
            { warehouse_name: { name: 'nope' } as unknown as string },
        ]) {
            assert.equal(getVisibleWarehouseName(order), null, JSON.stringify(order));
        }
    });

    it('does not invent a label from nested warehouse or retailer fields', () => {
        assert.equal(
            getVisibleWarehouseName({
                retailer_name: 'Fresh Mart',
                retailer_address: '12 Market Street',
                warehouse: { name: 'Hidden Warehouse' },
            }),
            null
        );
        assert.equal(
            getVisibleWarehouseName({
                warehouse_name: null,
                retailer_name: 'Fresh Mart',
                warehouse: { name: 'Hidden Warehouse' },
            }),
            null
        );
        assert.equal(
            getVisibleWarehouseName({
                warehouse_name: '   ',
                warehouse: { name: 'Hidden Warehouse' },
            }),
            null
        );
        assert.equal(
            getVisibleWarehouseName({
                warehouse_name: 'Visible DC',
                warehouse: { name: 'Other' },
                retailer_name: 'Fresh Mart',
            }),
            'Visible DC'
        );
    });
});
