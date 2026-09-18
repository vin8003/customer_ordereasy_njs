/** Run with: npm test (node --test, TypeScript stripped at runtime). */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { formatVisibleBrandName } from './productBrandName.ts';

describe('formatVisibleBrandName', () => {
    it('returns the trimmed top-level brand when it is a non-empty string', () => {
        assert.equal(formatVisibleBrandName('Amul'), 'Amul');
        assert.equal(formatVisibleBrandName('  Nestle  '), 'Nestle');
    });

    it('returns null instead of inventing a brand when missing, null, or blank', () => {
        for (const value of [undefined, null, '', '   ']) {
            assert.equal(formatVisibleBrandName(value), null, String(value));
        }
    });

    it('does not invent a brand from nested objects, numbers, or other junk', () => {
        for (const value of [
            { name: 'Amul' },
            { brand: { name: 'Nestle' } },
            12,
            0,
            true,
            false,
            [],
            ['Amul'],
        ]) {
            assert.equal(formatVisibleBrandName(value), null, String(value));
        }
    });
});
