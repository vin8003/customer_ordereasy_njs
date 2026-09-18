/** Run with: npm test (node --test, TypeScript stripped at runtime). */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { getVisibleCategoryName } from './productCategoryName.ts';

describe('getVisibleCategoryName', () => {
    it('returns the trimmed top-level category_name when present', () => {
        assert.equal(getVisibleCategoryName('Dairy'), 'Dairy');
        assert.equal(getVisibleCategoryName('  Snacks  '), 'Snacks');
    });

    it('hides missing, null, blank, and non-string values', () => {
        for (const value of [undefined, null, '', '   ', 0, 12, true, false, {}, [], { name: 'Dairy' }]) {
            assert.equal(getVisibleCategoryName(value), null, String(value));
        }
    });

    it('does not invent Uncategorized from a nested category object', () => {
        assert.equal(getVisibleCategoryName({ name: 'Dairy' }), null);
        assert.equal(getVisibleCategoryName({ category_name: 'Dairy' }), null);
    });
});
