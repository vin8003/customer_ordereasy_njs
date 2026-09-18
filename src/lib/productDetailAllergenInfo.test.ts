/** Run with: npm test (node --test, TypeScript stripped at runtime). */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { formatVisibleAllergenInfo } from './productDetailAllergenInfo.ts';

describe('formatVisibleAllergenInfo', () => {
    it('returns the trimmed top-level allergen text when it is a non-empty string', () => {
        assert.equal(formatVisibleAllergenInfo('Contains peanuts'), 'Contains peanuts');
        assert.equal(formatVisibleAllergenInfo('  Milk, soy  '), 'Milk, soy');
    });

    it('returns null instead of inventing allergen text when missing, null, or blank', () => {
        for (const value of [undefined, null, '', '   ']) {
            assert.equal(formatVisibleAllergenInfo(value), null, String(value));
        }
    });

    it('does not invent allergen text from nested objects, arrays, numbers, or other junk', () => {
        for (const value of [
            { allergen_info: 'Contains peanuts' },
            { allergens: ['peanuts'] },
            ['peanuts', 'milk'],
            0,
            true,
            false,
            [],
        ]) {
            assert.equal(formatVisibleAllergenInfo(value), null, String(value));
        }
    });
});
