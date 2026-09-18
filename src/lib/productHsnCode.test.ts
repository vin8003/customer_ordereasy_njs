/** Run with: npm test (node --test, TypeScript stripped at runtime). */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { formatVisibleHsnCode } from './productHsnCode.ts';

describe('formatVisibleHsnCode', () => {
    it('returns the trimmed top-level HSN when it is a non-empty string', () => {
        assert.equal(formatVisibleHsnCode('1905'), '1905');
        assert.equal(formatVisibleHsnCode('  19053100  '), '19053100');
    });

    it('returns null instead of inventing an HSN when missing, null, or blank', () => {
        for (const value of [undefined, null, '', '   ']) {
            assert.equal(formatVisibleHsnCode(value), null, String(value));
        }
    });

    it('does not invent an HSN from nested objects, numbers, or other junk', () => {
        for (const value of [
            { code: '1905' },
            { hsn_code: '19053100' },
            1905,
            0,
            true,
            false,
            [],
            ['1905'],
        ]) {
            assert.equal(formatVisibleHsnCode(value), null, String(value));
        }
    });
});
