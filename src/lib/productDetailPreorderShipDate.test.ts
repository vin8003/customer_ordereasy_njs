/** Run with: npm test (node --test, TypeScript stripped at runtime). */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { formatVisiblePreorderShipDate } from './productDetailPreorderShipDate.ts';

describe('formatVisiblePreorderShipDate', () => {
    it('formats a trimmed ISO calendar date without inventing a timezone shift', () => {
        assert.equal(formatVisiblePreorderShipDate('2026-10-15'), '15 Oct 2026');
        assert.equal(formatVisiblePreorderShipDate('  2026-01-05  '), '5 Jan 2026');
        assert.equal(formatVisiblePreorderShipDate('2026-10-15T18:30:00+05:30'), '15 Oct 2026');
        assert.equal(formatVisiblePreorderShipDate('2026-10-15 00:00:00'), '15 Oct 2026');
    });

    it('returns null instead of inventing a ship date when missing, null, or blank', () => {
        for (const value of [undefined, null, '', '   ']) {
            assert.equal(formatVisiblePreorderShipDate(value), null, String(value));
        }
    });

    it('does not invent a date from nested objects, numbers, invalid days, or other junk', () => {
        for (const value of [
            { preorder_ship_date: '2026-10-15' },
            { date: '2026-10-15' },
            20261015,
            0,
            true,
            false,
            [],
            ['2026-10-15'],
            '15/10/2026',
            'soon',
            '2026-13-01',
            '2026-02-31',
            'not-a-date',
            '2026-10-15T',
            '2026-10-15Tnot-a-time',
            '2026-10-15 junk',
        ]) {
            assert.equal(formatVisiblePreorderShipDate(value), null, String(value));
        }
    });
});
