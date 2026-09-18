/** Run with: npm test (node --test, TypeScript stripped at runtime). */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { formatVisibleCareInstructions } from './productCareInstructions.ts';

describe('formatVisibleCareInstructions', () => {
    it('returns the trimmed top-level care_instructions when it is a non-empty string', () => {
        assert.equal(
            formatVisibleCareInstructions('Machine wash cold. Tumble dry low.'),
            'Machine wash cold. Tumble dry low.'
        );
        assert.equal(
            formatVisibleCareInstructions('  Hand wash only.  '),
            'Hand wash only.'
        );
        assert.equal(
            formatVisibleCareInstructions('Line 1\nLine 2'),
            'Line 1\nLine 2'
        );
    });

    it('returns null instead of inventing care text when missing, null, or blank', () => {
        for (const value of [undefined, null, '', '   ']) {
            assert.equal(formatVisibleCareInstructions(value), null, String(value));
        }
    });

    it('does not invent care text from nested objects, description, numbers, or other junk', () => {
        for (const value of [
            { care_instructions: 'Hand wash only.' },
            { care: 'Dry clean' },
            { washing: 'Machine wash' },
            { description: 'A cotton shirt' },
            12,
            0,
            true,
            false,
            [],
            ['Hand wash only.'],
        ]) {
            assert.equal(formatVisibleCareInstructions(value), null, String(value));
        }
    });
});
