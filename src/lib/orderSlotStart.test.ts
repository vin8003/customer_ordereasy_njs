/** Run with: npm test (node --test, TypeScript stripped at runtime). Dummy only. */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { formatVisibleSlotStart } from './orderSlotStart.ts';

describe('formatVisibleSlotStart', () => {
    it('returns the trimmed API slot_start when it is a non-empty string', () => {
        assert.equal(formatVisibleSlotStart('2026-09-18T10:00:00+05:30'), '2026-09-18T10:00:00+05:30');
        assert.equal(formatVisibleSlotStart('  2026-09-18T08:00:00Z  '), '2026-09-18T08:00:00Z');
    });

    it('returns null instead of inventing a slot_start when missing, null, or blank', () => {
        for (const value of [undefined, null, '', '   ']) {
            assert.equal(formatVisibleSlotStart(value), null, String(value));
        }
    });

    it('does not invent slot_start from numbers, objects, or sibling fulfillment fields', () => {
        for (const value of [
            12,
            0,
            true,
            false,
            { slot_start: '2026-09-18T10:00:00Z' },
            ['2026-09-18T10:00:00Z'],
            { fulfillment_slot_start: '2026-09-18T10:00:00Z' },
            { slot_start_local: '2026-09-18T10:00:00' },
        ]) {
            assert.equal(formatVisibleSlotStart(value), null, String(value));
        }
    });
});
