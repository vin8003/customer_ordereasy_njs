/** Run with: npm test (node --test, TypeScript stripped at runtime). */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { formatVisibleBarcode } from './productDetailBarcode.ts';

describe('formatVisibleBarcode', () => {
    it('returns the trimmed top-level barcode when it is a non-empty string', () => {
        assert.equal(formatVisibleBarcode('8901234567890'), '8901234567890');
        assert.equal(formatVisibleBarcode('  890123  '), '890123');
    });

    it('returns null instead of inventing a barcode when missing, null, or blank', () => {
        for (const value of [undefined, null, '', '   ']) {
            assert.equal(formatVisibleBarcode(value), null, String(value));
        }
    });

    it('does not invent a barcode from sku, nested objects, numbers, or other junk', () => {
        for (const value of [
            { barcode: '8901234567890' },
            { sku: 'SKU-1' },
            8901234567890,
            0,
            true,
            false,
            [],
            ['8901234567890'],
        ]) {
            assert.equal(formatVisibleBarcode(value), null, String(value));
        }
    });
});
