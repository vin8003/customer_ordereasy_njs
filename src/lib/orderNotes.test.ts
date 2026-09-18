/** Run with: npm test (node --test, TypeScript stripped at runtime). */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { getVisibleOrderNotes } from './orderNotes.ts';

describe('getVisibleOrderNotes', () => {
    it('returns the trimmed notes when the API sent a non-empty string', () => {
        assert.equal(getVisibleOrderNotes({ notes: 'Leave at the shop gate' }), 'Leave at the shop gate');
        assert.equal(getVisibleOrderNotes({ notes: '  Ring the bell  ' }), 'Ring the bell');
    });

    it('returns null when notes is omitted, null, blank, or not a string', () => {
        for (const order of [
            {},
            { notes: undefined },
            { notes: null },
            { notes: '' },
            { notes: '   ' },
            { notes: 12 as unknown as string },
            { notes: true as unknown as string },
            { notes: { text: 'nope' } as unknown as string },
        ]) {
            assert.equal(getVisibleOrderNotes(order), null, JSON.stringify(order));
        }
    });

    it('does not invent notes from special_instructions, order_number, or cancellation_reason', () => {
        assert.equal(
            getVisibleOrderNotes({
                special_instructions: 'Handle with care',
                order_number: 'OE-1001',
                cancellation_reason: 'Customer cancelled',
            }),
            null
        );
        assert.equal(
            getVisibleOrderNotes({
                notes: null,
                special_instructions: 'Handle with care',
                order_number: 'OE-1001',
            }),
            null
        );
        assert.equal(
            getVisibleOrderNotes({
                notes: '   ',
                special_instructions: 'Handle with care',
            }),
            null
        );
    });
});
