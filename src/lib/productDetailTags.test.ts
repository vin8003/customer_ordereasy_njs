/** Run with: npm test (node --test, TypeScript stripped at runtime). */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { getVisibleProductTags } from './productDetailTags.ts';

describe('getVisibleProductTags', () => {
    it('returns trimmed non-empty strings from a top-level array', () => {
        assert.deepEqual(getVisibleProductTags(['Organic', 'Bestseller']), [
            'Organic',
            'Bestseller',
        ]);
        assert.deepEqual(getVisibleProductTags(['  Fresh  ', 'Local']), [
            'Fresh',
            'Local',
        ]);
    });

    it('returns an empty list when missing, null, blank, or not an array', () => {
        for (const value of [undefined, null, '', '   ', 'Organic', 0, true, false, {}]) {
            assert.deepEqual(getVisibleProductTags(value), [], String(value));
        }
    });

    it('does not invent chips from empty arrays, nested objects, or non-string items', () => {
        assert.deepEqual(getVisibleProductTags([]), []);
        assert.deepEqual(getVisibleProductTags(['', '   ']), []);
        assert.deepEqual(
            getVisibleProductTags([{ name: 'Organic' }, { label: 'Fresh' }]),
            []
        );
        assert.deepEqual(
            getVisibleProductTags(['Organic', { name: 'Invented' }, 12, true, null, '  Local  ']),
            ['Organic', 'Local']
        );
        assert.deepEqual(getVisibleProductTags({ tags: ['Organic'] }), []);
    });
});
