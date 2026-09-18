/** Run with: npm test (node --test, TypeScript stripped at runtime). */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { formatVisibleAgeRestriction } from './productDetailAgeRestriction.ts';

describe('formatVisibleAgeRestriction', () => {
    it('returns the trimmed top-level age_restriction when it is a non-empty string', () => {
        assert.equal(formatVisibleAgeRestriction('18+'), '18+');
        assert.equal(formatVisibleAgeRestriction('  21+  '), '21+');
        assert.equal(formatVisibleAgeRestriction('Age 18+'), 'Age 18+');
    });

    it('returns null instead of inventing a badge when missing, null, or blank', () => {
        for (const value of [undefined, null, '', '   ']) {
            assert.equal(formatVisibleAgeRestriction(value), null, String(value));
        }
    });

    it('does not invent a badge from nested objects, numbers, booleans, or other junk', () => {
        for (const value of [
            { age_restriction: '18+' },
            { min_age: 18 },
            18,
            21,
            0,
            true,
            false,
            [],
            ['18+'],
        ]) {
            assert.equal(formatVisibleAgeRestriction(value), null, String(value));
        }
    });
});
