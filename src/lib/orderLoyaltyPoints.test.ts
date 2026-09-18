/** Run with: npm test (node --test, TypeScript stripped at runtime). */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { getVisibleLoyaltyPoints, parseOptionalLoyaltyPoints } from './orderLoyaltyPoints.ts';

describe('parseOptionalLoyaltyPoints', () => {
    it('parses numeric strings and finite numbers', () => {
        assert.equal(parseOptionalLoyaltyPoints('25'), 25);
        assert.equal(parseOptionalLoyaltyPoints('25.50'), 25.5);
        assert.equal(parseOptionalLoyaltyPoints(' 10 '), 10);
        assert.equal(parseOptionalLoyaltyPoints(12), 12);
        assert.equal(parseOptionalLoyaltyPoints(0), 0);
        assert.equal(parseOptionalLoyaltyPoints('0.00'), 0);
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
            assert.equal(parseOptionalLoyaltyPoints(value), null, String(value));
        }
    });
});

describe('getVisibleLoyaltyPoints', () => {
    it('returns the trimmed API value when loyalty_points is present and non-zero', () => {
        assert.equal(getVisibleLoyaltyPoints({ loyalty_points: '40' }), '40');
        assert.equal(getVisibleLoyaltyPoints({ loyalty_points: ' 12.5 ' }), '12.5');
        assert.equal(getVisibleLoyaltyPoints({ loyalty_points: 8 }), '8');
    });

    it('hides missing, null, blank, zero, and non-numeric values', () => {
        for (const order of [
            {},
            { loyalty_points: undefined },
            { loyalty_points: null },
            { loyalty_points: '' },
            { loyalty_points: '   ' },
            { loyalty_points: '0' },
            { loyalty_points: '0.00' },
            { loyalty_points: 0 },
            { loyalty_points: 'abc' },
            { loyalty_points: '₹5' },
        ]) {
            assert.equal(getVisibleLoyaltyPoints(order), null, JSON.stringify(order));
        }
    });

    it('does not invent loyalty_points from discount_from_points or points_earned', () => {
        assert.equal(
            getVisibleLoyaltyPoints({
                discount_from_points: '15',
                points_earned: '20',
            }),
            null
        );
        assert.equal(
            getVisibleLoyaltyPoints({
                loyalty_points: null,
                discount_from_points: '15',
                points_earned: 20,
            }),
            null
        );
        assert.equal(
            getVisibleLoyaltyPoints({
                loyalty_points: '0',
                discount_from_points: '15',
                points_earned: '20',
            }),
            null
        );
    });
});
