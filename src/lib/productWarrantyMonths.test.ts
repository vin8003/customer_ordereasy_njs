/** Run with: npm test (node --test, TypeScript stripped at runtime). */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
    formatVisibleWarrantyMonths,
    parseVisibleWarrantyMonths,
} from './productWarrantyMonths.ts';

describe('parseVisibleWarrantyMonths', () => {
    it('parses finite positive numbers and numeric strings', () => {
        assert.equal(parseVisibleWarrantyMonths(12), 12);
        assert.equal(parseVisibleWarrantyMonths(1), 1);
        assert.equal(parseVisibleWarrantyMonths(12.5), 12.5);
        assert.equal(parseVisibleWarrantyMonths('24'), 24);
        assert.equal(parseVisibleWarrantyMonths('  6  '), 6);
        assert.equal(parseVisibleWarrantyMonths('12.0'), 12);
    });

    it('returns null for missing, blank, zero, or non-numeric values', () => {
        for (const value of [
            undefined,
            null,
            '',
            '   ',
            0,
            '0',
            '0.00',
            -3,
            '-1',
            'abc',
            '12 months',
            '₹12',
            NaN,
            Infinity,
            -Infinity,
            true,
            false,
            {},
            [],
            ['12'],
        ]) {
            assert.equal(parseVisibleWarrantyMonths(value), null, String(value));
        }
    });
});

describe('formatVisibleWarrantyMonths', () => {
    it('returns a trimmed warranty line when months are present and positive', () => {
        assert.equal(formatVisibleWarrantyMonths(12), '12 months warranty');
        assert.equal(formatVisibleWarrantyMonths('  24  '), '24 months warranty');
        assert.equal(formatVisibleWarrantyMonths(1), '1 month warranty');
        assert.equal(formatVisibleWarrantyMonths('1'), '1 month warranty');
        assert.equal(formatVisibleWarrantyMonths(12.5), '12.5 months warranty');
    });

    it('returns null instead of inventing a warranty when missing, null, blank, or zero', () => {
        for (const value of [undefined, null, '', '   ', 0, '0', '0.00']) {
            assert.equal(formatVisibleWarrantyMonths(value), null, String(value));
        }
    });

    it('does not invent warranty from nested objects, camelCase, or other junk', () => {
        for (const value of [
            { months: 12 },
            { warranty_months: 12 },
            { warrantyMonths: 12 },
            '12 months',
        ]) {
            assert.equal(formatVisibleWarrantyMonths(value), null, String(value));
        }
    });
});
