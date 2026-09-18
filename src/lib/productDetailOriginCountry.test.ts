/** Run with: npm test (node --test, TypeScript stripped at runtime). */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { formatVisibleOriginCountry } from './productDetailOriginCountry.ts';

describe('formatVisibleOriginCountry', () => {
    it('returns the trimmed top-level origin_country when it is a non-empty string', () => {
        assert.equal(formatVisibleOriginCountry('India'), 'India');
        assert.equal(formatVisibleOriginCountry('  Italy  '), 'Italy');
    });

    it('returns null instead of inventing a country when missing, null, or blank', () => {
        for (const value of [undefined, null, '', '   ']) {
            assert.equal(formatVisibleOriginCountry(value), null, String(value));
        }
    });

    it('does not invent a country from nested objects, numbers, or other junk', () => {
        for (const value of [
            { origin_country: 'India' },
            { country: 'India' },
            { country_of_origin: 'India' },
            91,
            0,
            true,
            false,
            [],
            ['India'],
        ]) {
            assert.equal(formatVisibleOriginCountry(value), null, String(value));
        }
    });
});
