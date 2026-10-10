/** Run with: npm test (node --test, TypeScript stripped at runtime). */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { getVisibleOrderTaxAmount } from './orderTaxAmount.ts';

describe('getVisibleOrderTaxAmount', () => {
    it('returns the trimmed tax when the API sent a present numeric amount other than 0', () => {
        assert.equal(getVisibleOrderTaxAmount({ tax_amount: '18.00' }), '18.00');
        assert.equal(getVisibleOrderTaxAmount({ tax_amount: ' 12.5 ' }), '12.5');
        assert.equal(getVisibleOrderTaxAmount({ tax_amount: 7 }), '7');
    });

    it('returns null when tax_amount is missing, null, blank, zero, or non-numeric', () => {
        for (const order of [
            {},
            { tax_amount: undefined },
            { tax_amount: null },
            { tax_amount: '' },
            { tax_amount: '   ' },
            { tax_amount: 0 },
            { tax_amount: '0' },
            { tax_amount: '0.00' },
            { tax_amount: 'abc' },
            { tax_amount: '₹18' },
            { tax_amount: true as unknown as string },
            { tax_amount: { amount: 18 } as unknown as string },
        ]) {
            assert.equal(getVisibleOrderTaxAmount(order), null, JSON.stringify(order));
        }
    });

    it('does not invent tax from delivery_fee or discount_amount', () => {
        assert.equal(
            getVisibleOrderTaxAmount({
                delivery_fee: '30.00',
                discount_amount: 5,
            }),
            null
        );
        assert.equal(
            getVisibleOrderTaxAmount({
                tax_amount: null,
                delivery_fee: '30.00',
                discount_amount: '8.50',
            }),
            null
        );
        assert.equal(
            getVisibleOrderTaxAmount({
                tax_amount: '0.00',
                delivery_fee: '15.00',
            }),
            null
        );
    });
});
