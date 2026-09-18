/** Run with: npm test (node --test, TypeScript stripped at runtime). */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { getVisibleOrderCashbackAmount } from './orderCashbackAmount.ts';

describe('getVisibleOrderCashbackAmount', () => {
    it('returns the trimmed cashback when the API sent a present numeric amount other than 0', () => {
        assert.equal(getVisibleOrderCashbackAmount({ cashback_amount: '25.00' }), '25.00');
        assert.equal(getVisibleOrderCashbackAmount({ cashback_amount: ' 12.5 ' }), '12.5');
        assert.equal(getVisibleOrderCashbackAmount({ cashback_amount: 7 }), '7');
    });

    it('returns null when cashback_amount is missing, null, blank, zero, or non-numeric', () => {
        for (const order of [
            {},
            { cashback_amount: undefined },
            { cashback_amount: null },
            { cashback_amount: '' },
            { cashback_amount: '   ' },
            { cashback_amount: 0 },
            { cashback_amount: '0' },
            { cashback_amount: '0.00' },
            { cashback_amount: 'abc' },
            { cashback_amount: '₹25' },
            { cashback_amount: true as unknown as string },
            { cashback_amount: { amount: 25 } as unknown as string },
        ]) {
            assert.equal(getVisibleOrderCashbackAmount(order), null, JSON.stringify(order));
        }
    });

    it('does not invent cashback from delivery_fee, discount_amount, or refund_amount', () => {
        assert.equal(
            getVisibleOrderCashbackAmount({
                delivery_fee: '30.00',
                discount_amount: 5,
                refund_amount: '10.00',
            }),
            null
        );
        assert.equal(
            getVisibleOrderCashbackAmount({
                cashback_amount: null,
                delivery_fee: '30.00',
                discount_amount: '8.50',
            }),
            null
        );
        assert.equal(
            getVisibleOrderCashbackAmount({
                cashback_amount: '0.00',
                refund_amount: '15.00',
            }),
            null
        );
    });
});
