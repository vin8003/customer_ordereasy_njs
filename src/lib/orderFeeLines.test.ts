/** Run with: npm test (node --test, TypeScript stripped at runtime). */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
    formatVisibleOptionalMoneyAmount,
    getVisibleOrderFeeLines,
    isVisibleOptionalMoneyAmount,
    parseOptionalMoneyAmount,
} from './orderFeeLines.ts';

describe('parseOptionalMoneyAmount', () => {
    it('parses numeric strings and finite numbers', () => {
        assert.equal(parseOptionalMoneyAmount('25'), 25);
        assert.equal(parseOptionalMoneyAmount('25.50'), 25.5);
        assert.equal(parseOptionalMoneyAmount(' 10.00 '), 10);
        assert.equal(parseOptionalMoneyAmount(12), 12);
        assert.equal(parseOptionalMoneyAmount(0), 0);
        assert.equal(parseOptionalMoneyAmount('0.00'), 0);
    });

    it('returns null for missing, blank, or non-numeric values', () => {
        for (const value of [
            undefined,
            null,
            '',
            '   ',
            'abc',
            '₹10',
            NaN,
            Infinity,
            -Infinity,
            true,
            false,
            {},
            [],
        ]) {
            assert.equal(parseOptionalMoneyAmount(value), null, String(value));
        }
    });
});

describe('isVisibleOptionalMoneyAmount', () => {
    it('shows only present numeric amounts that are not zero', () => {
        assert.equal(isVisibleOptionalMoneyAmount('25.00'), true);
        assert.equal(isVisibleOptionalMoneyAmount(7.5), true);
        assert.equal(isVisibleOptionalMoneyAmount('-3'), true);
    });

    it('hides missing, null, blank, non-numeric, and zero amounts', () => {
        for (const value of [undefined, null, '', '  ', '0', '0.00', 0, 0.0, 'abc', '₹5']) {
            assert.equal(isVisibleOptionalMoneyAmount(value), false, String(value));
        }
    });
});

describe('formatVisibleOptionalMoneyAmount', () => {
    it('returns the trimmed API amount when the line should show', () => {
        assert.equal(formatVisibleOptionalMoneyAmount('25.00'), '25.00');
        assert.equal(formatVisibleOptionalMoneyAmount(' 10 '), '10');
        assert.equal(formatVisibleOptionalMoneyAmount(12.5), '12.5');
    });

    it('returns null instead of inventing a placeholder', () => {
        for (const value of [undefined, null, '', '0', '0.00', 0, 'nope']) {
            assert.equal(formatVisibleOptionalMoneyAmount(value), null, String(value));
        }
    });
});

describe('getVisibleOrderFeeLines', () => {
    it('returns delivery fee then discount when both are present and non-zero', () => {
        assert.deepEqual(
            getVisibleOrderFeeLines({ delivery_fee: '30.00', discount_amount: 5 }),
            [
                { key: 'delivery_fee', label: 'Delivery Fee', amount: '30.00', isDiscount: false },
                { key: 'discount_amount', label: 'Discount', amount: '5', isDiscount: true },
            ]
        );
    });

    it('omits a field that is missing, null, or zero', () => {
        assert.deepEqual(getVisibleOrderFeeLines({}), []);
        assert.deepEqual(
            getVisibleOrderFeeLines({ delivery_fee: null, discount_amount: undefined }),
            []
        );
        assert.deepEqual(
            getVisibleOrderFeeLines({ delivery_fee: '0.00', discount_amount: 0 }),
            []
        );
        assert.deepEqual(getVisibleOrderFeeLines({ delivery_fee: '15.00' }), [
            { key: 'delivery_fee', label: 'Delivery Fee', amount: '15.00', isDiscount: false },
        ]);
        assert.deepEqual(getVisibleOrderFeeLines({ discount_amount: '8.50' }), [
            { key: 'discount_amount', label: 'Discount', amount: '8.50', isDiscount: true },
        ]);
    });

    it('does not invent a line from non-numeric API junk', () => {
        assert.deepEqual(
            getVisibleOrderFeeLines({ delivery_fee: 'free', discount_amount: '₹10' }),
            []
        );
    });
});
