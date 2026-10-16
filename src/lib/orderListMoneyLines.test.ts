/** Run with: npm test (node --test, TypeScript stripped at runtime). */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
    getOrderListMoneyLines,
    isPresentNonZeroAmount,
} from './orderListMoneyLines.ts';

describe('isPresentNonZeroAmount — OE-322 omit rules', () => {
    it('omits missing, null, and blank values', () => {
        assert.equal(isPresentNonZeroAmount(undefined), false);
        assert.equal(isPresentNonZeroAmount(null), false);
        assert.equal(isPresentNonZeroAmount(''), false);
        assert.equal(isPresentNonZeroAmount('   '), false);
    });

    it('omits numeric zero in number and string form', () => {
        assert.equal(isPresentNonZeroAmount(0), false);
        assert.equal(isPresentNonZeroAmount(-0), false);
        assert.equal(isPresentNonZeroAmount('0'), false);
        assert.equal(isPresentNonZeroAmount('0.0'), false);
        assert.equal(isPresentNonZeroAmount('0.00'), false);
        assert.equal(isPresentNonZeroAmount('+0'), false);
        assert.equal(isPresentNonZeroAmount('-0.00'), false);
    });

    it('omits non-numeric payloads instead of inventing an amount', () => {
        assert.equal(isPresentNonZeroAmount('abc'), false);
        assert.equal(isPresentNonZeroAmount('₹25'), false);
        assert.equal(isPresentNonZeroAmount('10kg'), false);
        assert.equal(isPresentNonZeroAmount('25.00.1'), false);
        assert.equal(isPresentNonZeroAmount(Number.NaN), false);
        assert.equal(isPresentNonZeroAmount(Number.POSITIVE_INFINITY), false);
        assert.equal(isPresentNonZeroAmount({} as never), false);
    });

    it('accepts a finite numeric amount that is not zero', () => {
        assert.equal(isPresentNonZeroAmount(25), true);
        assert.equal(isPresentNonZeroAmount('25.00'), true);
        assert.equal(isPresentNonZeroAmount(' 40 '), true);
        assert.equal(isPresentNonZeroAmount('-10.50'), true);
        assert.equal(isPresentNonZeroAmount('.5'), true);
    });
});

describe('getOrderListMoneyLines — OE-322 list display', () => {
    it('returns no lines when both optional fields are absent', () => {
        assert.deepEqual(getOrderListMoneyLines({}), []);
        assert.deepEqual(getOrderListMoneyLines({ total_amount: '199.00' }), []);
    });

    it('returns no lines when both fields are null or zero', () => {
        assert.deepEqual(
            getOrderListMoneyLines({ delivery_fee: null, discount_amount: '0.00' }),
            []
        );
        assert.deepEqual(
            getOrderListMoneyLines({ delivery_fee: 0, discount_amount: null }),
            []
        );
    });

    it('shows a compact delivery fee line for a present non-zero BE amount', () => {
        assert.deepEqual(getOrderListMoneyLines({ delivery_fee: '40.00' }), [
            { key: 'delivery_fee', label: 'Delivery Fee', amountDisplay: '₹40.00' },
        ]);
        assert.deepEqual(getOrderListMoneyLines({ delivery_fee: 25 }), [
            { key: 'delivery_fee', label: 'Delivery Fee', amountDisplay: '₹25' },
        ]);
    });

    it('shows a compact discount line without inventing a different number', () => {
        assert.deepEqual(getOrderListMoneyLines({ discount_amount: '10.00' }), [
            { key: 'discount_amount', label: 'Discount', amountDisplay: '-₹10.00' },
        ]);
    });

    it('does not double-minus a discount the BE already sent as negative', () => {
        assert.deepEqual(getOrderListMoneyLines({ discount_amount: '-12.50' }), [
            { key: 'discount_amount', label: 'Discount', amountDisplay: '-₹12.50' },
        ]);
    });

    it('shows both lines when both amounts are present and non-zero', () => {
        assert.deepEqual(
            getOrderListMoneyLines({ delivery_fee: '30.00', discount_amount: '5.00' }),
            [
                { key: 'delivery_fee', label: 'Delivery Fee', amountDisplay: '₹30.00' },
                { key: 'discount_amount', label: 'Discount', amountDisplay: '-₹5.00' },
            ]
        );
    });

    it('omits a garbage field while still showing the valid sibling field', () => {
        assert.deepEqual(
            getOrderListMoneyLines({ delivery_fee: 'not-a-fee', discount_amount: '8' }),
            [{ key: 'discount_amount', label: 'Discount', amountDisplay: '-₹8' }]
        );
    });
});
