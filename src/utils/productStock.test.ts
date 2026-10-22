import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { filterInStockProducts, withVariantStock } from './productStock.ts';

describe('withVariantStock', () => {
    it('reads the API quantity that product-detail group variants carry', () => {
        const variant = withVariantStock({ id: 2, name: 'Toor Dal 1kg', track_inventory: true, quantity: 7 });
        assert.equal(variant.stock_quantity, 7);
        assert.equal(variant.track_inventory, true);
        assert.equal(variant.name, 'Toor Dal 1kg');
    });

    it('prefers stock_quantity when the row already has it', () => {
        assert.equal(withVariantStock({ stock_quantity: 3, quantity: 9 }).stock_quantity, 3);
    });

    it('treats missing stock as zero and missing tracking as tracked', () => {
        const variant = withVariantStock({});
        assert.equal(variant.stock_quantity, 0);
        assert.equal(variant.track_inventory, true);
    });
});

describe('filterInStockProducts on group variants', () => {
    it('keeps an in-stock variant and drops a tracked out-of-stock one', () => {
        const variants = [
            { id: 2, track_inventory: true, quantity: 7 },
            { id: 3, track_inventory: true, quantity: 0 },
            { id: 4, track_inventory: false, quantity: 0 },
        ].map(withVariantStock);
        assert.deepEqual(filterInStockProducts(variants).map((v) => v.id), [2, 4]);
    });
});
