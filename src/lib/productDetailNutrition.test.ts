/** Run with: npm test (node --test, TypeScript stripped at runtime). */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { formatVisibleNutritionInfo } from './productDetailNutrition.ts';

describe('formatVisibleNutritionInfo', () => {
    it('returns the trimmed top-level nutrition text when it is a non-empty string', () => {
        assert.equal(
            formatVisibleNutritionInfo('Energy 210 kcal per 100g'),
            'Energy 210 kcal per 100g'
        );
        assert.equal(
            formatVisibleNutritionInfo('  Protein 5g  '),
            'Protein 5g'
        );
    });

    it('returns null instead of inventing nutrition when missing, null, or blank', () => {
        for (const value of [undefined, null, '', '   ']) {
            assert.equal(formatVisibleNutritionInfo(value), null, String(value));
        }
    });

    it('does not invent nutrition from nested objects, numbers, or other junk', () => {
        for (const value of [
            { nutrition_info: 'Energy 210 kcal' },
            { calories: '210' },
            { text: 'Protein 5g' },
            210,
            0,
            true,
            false,
            [],
            ['Energy 210 kcal'],
        ]) {
            assert.equal(formatVisibleNutritionInfo(value), null, String(value));
        }
    });
});
