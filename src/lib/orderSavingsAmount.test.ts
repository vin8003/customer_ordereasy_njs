/** Run with: npm test (node --test, TypeScript stripped at runtime). Dummy fixtures only. */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
    formatVisibleSavingsAmount,
    getVisibleOrderSavingsAmount,
    parseOptionalSavingsAmount,
} from './orderSavingsAmount.ts';

describe('parseOptionalSavingsAmount', () => {
    it('parses numeric strings and finite numbers', () => {
        assert.equal(parseOptionalSavingsAmount('25'), 25);
        assert.equal(parseOptionalSavingsAmount('25.50'), 25.5);
        assert.equal(parseOptionalSavingsAmount(' 10.00 '), 10);
        assert.equal(parseOptionalSavingsAmount(12), 12);
        assert.equal(parseOptionalSavingsAmount(0), 0);
        assert.equal(parseOptionalSavingsAmount('0.00'), 0);
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
            assert.equal(parseOptionalSavingsAmount(value), null, String(value));
        }
    });
});

describe('formatVisibleSavingsAmount', () => {
    it('returns the trimmed API amount when present and numeric ≠ 0', () => {
        assert.equal(formatVisibleSavingsAmount('25.00'), '25.00');
        assert.equal(formatVisibleSavingsAmount(' 10 '), '10');
        assert.equal(formatVisibleSavingsAmount(12.5), '12.5');
        assert.equal(formatVisibleSavingsAmount('-3'), '-3');
    });

    it('returns null instead of inventing a placeholder', () => {
        for (const value of [undefined, null, '', '  ', '0', '0.00', 0, 'nope', '₹5']) {
            assert.equal(formatVisibleSavingsAmount(value), null, String(value));
        }
    });
});

describe('getVisibleOrderSavingsAmount', () => {
    it('returns the trimmed savings_amount when present and numeric ≠ 0', () => {
        assert.equal(getVisibleOrderSavingsAmount({ savings_amount: '18.00' }), '18.00');
        assert.equal(getVisibleOrderSavingsAmount({ savings_amount: 7.5 }), '7.5');
    });

    it('omits missing, null, blank, zero, and non-numeric savings_amount', () => {
        for (const order of [
            {},
            { savings_amount: undefined },
            { savings_amount: null },
            { savings_amount: '' },
            { savings_amount: '   ' },
            { savings_amount: 0 },
            { savings_amount: '0.00' },
            { savings_amount: 'abc' },
            { savings_amount: '₹12' },
        ]) {
            assert.equal(getVisibleOrderSavingsAmount(order), null, JSON.stringify(order));
        }
    });

    it('does not invent savings from sibling money fields', () => {
        assert.equal(
            getVisibleOrderSavingsAmount({
                discount_amount: '20.00',
                discount_from_points: '5',
                delivery_fee: '30.00',
                total_savings: '15',
                savings: 9,
            }),
            null
        );
        assert.equal(
            getVisibleOrderSavingsAmount({
                savings_amount: null,
                discount_amount: '20.00',
                total_savings: '15',
            }),
            null
        );
        assert.equal(
            getVisibleOrderSavingsAmount({
                savings_amount: '0',
                savings: 9,
                total_savings: '15',
            }),
            null
        );
    });
});
