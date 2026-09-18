/** Run with: npm test (node --test, TypeScript stripped at runtime). Dummy dates only — no network. */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
    formatFlashSaleRemaining,
    getFlashSaleCountdownLabel,
    getFlashSaleRemainingMs,
    parseFlashSaleEndsAt,
} from './flashSaleCountdown.ts';

/** Fixed instant so tests never depend on wall-clock or live APIs. */
const NOW_MS = Date.parse('2026-09-18T15:00:00.000Z');

describe('parseFlashSaleEndsAt', () => {
    it('parses ISO-8601 strings to epoch milliseconds', () => {
        assert.equal(
            parseFlashSaleEndsAt('2026-09-18T16:00:00.000Z'),
            Date.parse('2026-09-18T16:00:00.000Z')
        );
        assert.equal(
            parseFlashSaleEndsAt(' 2026-09-18T20:30:00+05:30 '),
            Date.parse('2026-09-18T20:30:00+05:30')
        );
    });

    it('returns null for missing, blank, or unparseable values', () => {
        for (const value of [
            undefined,
            null,
            '',
            '   ',
            'not-a-date',
            '₹10',
            0,
            NOW_MS,
            true,
            false,
            {},
            [],
        ]) {
            assert.equal(parseFlashSaleEndsAt(value), null, String(value));
        }
    });
});

describe('getFlashSaleRemainingMs', () => {
    it('returns remaining milliseconds when the sale is still open', () => {
        assert.equal(getFlashSaleRemainingMs(NOW_MS + 5_000, NOW_MS), 5_000);
        assert.equal(getFlashSaleRemainingMs(NOW_MS + 90_000, NOW_MS), 90_000);
    });

    it('returns null when the instant is missing, expired, or exactly now', () => {
        assert.equal(getFlashSaleRemainingMs(NOW_MS, NOW_MS), null);
        assert.equal(getFlashSaleRemainingMs(NOW_MS - 1, NOW_MS), null);
        assert.equal(getFlashSaleRemainingMs(Number.NaN, NOW_MS), null);
        assert.equal(getFlashSaleRemainingMs(NOW_MS + 1, Number.NaN), null);
    });
});

describe('formatFlashSaleRemaining', () => {
    it('omits larger units that are zero and pads smaller units', () => {
        assert.equal(formatFlashSaleRemaining(5_000), '5s');
        assert.equal(formatFlashSaleRemaining(90_000), '1m 30s');
        assert.equal(formatFlashSaleRemaining(3_661_000), '1h 01m 01s');
        assert.equal(formatFlashSaleRemaining(183_780_000), '2d 3h 03m');
    });
});

describe('getFlashSaleCountdownLabel', () => {
    it('returns a countdown label for a future dummy flash_sale_ends_at', () => {
        assert.equal(
            getFlashSaleCountdownLabel('2026-09-18T16:00:00.000Z', NOW_MS),
            'Flash sale ends in 1h 00m 00s'
        );
        assert.equal(
            getFlashSaleCountdownLabel('2026-09-18T15:00:12.000Z', NOW_MS),
            'Flash sale ends in 12s'
        );
    });

    it('hides missing, invalid, and expired timestamps instead of inventing a sale', () => {
        for (const value of [
            undefined,
            null,
            '',
            'nope',
            '2026-09-18T15:00:00.000Z',
            '2026-09-18T14:59:59.000Z',
        ]) {
            assert.equal(getFlashSaleCountdownLabel(value, NOW_MS), null, String(value));
        }
    });
});
