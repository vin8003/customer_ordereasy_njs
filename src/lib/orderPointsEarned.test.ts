/** Run with: npm test (node --test, TypeScript stripped at runtime). */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { getVisiblePointsEarned, parseOptionalPointsEarned } from './orderPointsEarned.ts';

describe('parseOptionalPointsEarned', () => {
    it('parses numeric strings and finite numbers', () => {
        assert.equal(parseOptionalPointsEarned('25'), 25);
        assert.equal(parseOptionalPointsEarned('25.50'), 25.5);
        assert.equal(parseOptionalPointsEarned(' 10 '), 10);
        assert.equal(parseOptionalPointsEarned(12), 12);
        assert.equal(parseOptionalPointsEarned(0), 0);
        assert.equal(parseOptionalPointsEarned('0.00'), 0);
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
            assert.equal(parseOptionalPointsEarned(value), null, String(value));
        }
    });
});

describe('getVisiblePointsEarned', () => {
    it('returns the trimmed API value when points_earned is present and non-zero', () => {
        assert.equal(getVisiblePointsEarned({ points_earned: '40' }), '40');
        assert.equal(getVisiblePointsEarned({ points_earned: ' 12.5 ' }), '12.5');
        assert.equal(getVisiblePointsEarned({ points_earned: 8 }), '8');
    });

    it('hides missing, null, blank, zero, and non-numeric values', () => {
        for (const order of [
            {},
            { points_earned: undefined },
            { points_earned: null },
            { points_earned: '' },
            { points_earned: '   ' },
            { points_earned: '0' },
            { points_earned: '0.00' },
            { points_earned: 0 },
            { points_earned: 'abc' },
            { points_earned: '₹5' },
        ]) {
            assert.equal(getVisiblePointsEarned(order), null, JSON.stringify(order));
        }
    });

    it('does not invent points_earned from discount_from_points, loyalty_points, or potential_points', () => {
        assert.equal(
            getVisiblePointsEarned({
                discount_from_points: '15',
                loyalty_points: '20',
                potential_points: '30',
            }),
            null
        );
        assert.equal(
            getVisiblePointsEarned({
                points_earned: null,
                discount_from_points: '15',
                loyalty_points: 20,
                potential_points: '30',
            }),
            null
        );
        assert.equal(
            getVisiblePointsEarned({
                points_earned: '0',
                discount_from_points: '15',
                loyalty_points: '20',
                potential_points: '30',
            }),
            null
        );
    });
});
