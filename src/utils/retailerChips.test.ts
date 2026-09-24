import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { formatChipCurrency, mergeRetailerChipFields, parseOptionalBoolean } from './retailerChips.ts';

describe('parseOptionalBoolean', () => {
    it('accepts boolean and common API encodings', () => {
        assert.equal(parseOptionalBoolean(true), true);
        assert.equal(parseOptionalBoolean(false), false);
        assert.equal(parseOptionalBoolean('true'), true);
        assert.equal(parseOptionalBoolean('0'), false);
        assert.equal(parseOptionalBoolean(undefined), undefined);
    });
});

describe('formatChipCurrency', () => {
    it('hides zero and invalid amounts', () => {
        assert.equal(formatChipCurrency(0), null);
        assert.equal(formatChipCurrency(undefined), null);
        assert.equal(formatChipCurrency(100), '₹100');
    });
});

describe('mergeRetailerChipFields', () => {
    it('prefers shop-detail fields and aliases', () => {
        const merged = mergeRetailerChipFields(
            { shop_name: 'A', offers_delivery: true },
            {
                is_open: true,
                min_order_amount: '50',
                delivery_fee: '10',
                free_delivery_threshold: '199',
            }
        );
        assert.equal(merged.is_currently_open, true);
        assert.equal(merged.minimum_order_amount, 50);
        assert.equal(merged.delivery_charge, 10);
        assert.equal(merged.free_delivery_threshold, 199);
    });
});
