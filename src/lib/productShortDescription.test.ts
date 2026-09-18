/** Run with: npm test (node --test, TypeScript stripped at runtime). */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { formatVisibleShortDescription } from './productShortDescription.ts';

describe('formatVisibleShortDescription', () => {
    it('returns the trimmed top-level short_description when it is a non-empty string', () => {
        assert.equal(
            formatVisibleShortDescription('Fresh whole milk, 1L'),
            'Fresh whole milk, 1L'
        );
        assert.equal(
            formatVisibleShortDescription('  Daily staple  '),
            'Daily staple'
        );
    });

    it('returns null instead of inventing a short description when missing, null, or blank', () => {
        for (const value of [undefined, null, '', '   ']) {
            assert.equal(formatVisibleShortDescription(value), null, String(value));
        }
    });

    it('does not invent a short description from description, nested objects, numbers, or other junk', () => {
        for (const value of [
            { short_description: 'Fresh whole milk, 1L' },
            { description: 'A long product write-up that must not be copied' },
            12,
            0,
            true,
            false,
            [],
            ['Fresh whole milk, 1L'],
        ]) {
            assert.equal(formatVisibleShortDescription(value), null, String(value));
        }
    });
});
