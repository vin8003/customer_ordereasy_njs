/** Run with: npm test (node --test, TypeScript stripped at runtime). */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { formatVisibleIngredients } from './productIngredients.ts';

describe('formatVisibleIngredients', () => {
    it('returns the trimmed top-level ingredients blurb when it is a non-empty string', () => {
        assert.equal(
            formatVisibleIngredients('Wheat flour, sugar, cocoa'),
            'Wheat flour, sugar, cocoa'
        );
        assert.equal(
            formatVisibleIngredients('  Milk, cocoa butter  '),
            'Milk, cocoa butter'
        );
    });

    it('returns null instead of inventing a blurb when missing, null, or blank', () => {
        for (const value of [undefined, null, '', '   ']) {
            assert.equal(formatVisibleIngredients(value), null, String(value));
        }
    });

    it('does not invent a blurb from nested objects, lists, or other junk', () => {
        for (const value of [
            { text: 'Wheat flour' },
            { ingredients: 'Sugar, salt' },
            ['Wheat flour', 'sugar'],
            0,
            true,
            false,
            [],
        ]) {
            assert.equal(formatVisibleIngredients(value), null, String(value));
        }
    });
});
