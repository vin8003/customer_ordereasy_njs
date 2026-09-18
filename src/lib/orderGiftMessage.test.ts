/** Run with: npm test (node --test, TypeScript stripped at runtime). */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { getVisibleGiftMessage } from './orderGiftMessage.ts';

describe('getVisibleGiftMessage', () => {
    it('returns the trimmed gift_message when the API sent a non-empty string', () => {
        assert.equal(
            getVisibleGiftMessage({ gift_message: 'Happy birthday, Asha!' }),
            'Happy birthday, Asha!'
        );
        assert.equal(
            getVisibleGiftMessage({ gift_message: '  Congratulations  ' }),
            'Congratulations'
        );
    });

    it('returns null when gift_message is omitted, null, blank, or not a string', () => {
        for (const order of [
            {},
            { gift_message: undefined },
            { gift_message: null },
            { gift_message: '' },
            { gift_message: '   ' },
            { gift_message: 12 as unknown as string },
            { gift_message: true as unknown as string },
            { gift_message: { text: 'nope' } as unknown as string },
        ]) {
            assert.equal(getVisibleGiftMessage(order), null, JSON.stringify(order));
        }
    });

    it('does not invent a gift message from notes, special_instructions, or other fields', () => {
        assert.equal(
            getVisibleGiftMessage({
                notes: 'Leave at the shop gate',
                special_instructions: 'Handle with care',
                order_number: 'OE-1001',
                cancellation_reason: 'Customer cancelled',
            }),
            null
        );
        assert.equal(
            getVisibleGiftMessage({
                gift_message: null,
                notes: 'Leave at the shop gate',
                special_instructions: 'Handle with care',
                order_number: 'OE-1001',
            }),
            null
        );
        assert.equal(
            getVisibleGiftMessage({
                gift_message: '   ',
                notes: 'Leave at the shop gate',
                special_instructions: 'Handle with care',
            }),
            null
        );
    });
});
