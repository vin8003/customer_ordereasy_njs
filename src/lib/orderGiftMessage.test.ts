/** Run with: npm test (node --test, TypeScript stripped at runtime). */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { getVisibleGiftMessage } from './orderGiftMessage.ts';

describe('getVisibleGiftMessage', () => {
    it('returns the trimmed top-level gift_message when it is a non-empty string', () => {
        assert.equal(getVisibleGiftMessage({ gift_message: 'Happy birthday!' }), 'Happy birthday!');
        assert.equal(getVisibleGiftMessage({ gift_message: '  Please hide the receipt  ' }), 'Please hide the receipt');
    });

    it('hides missing, null, blank, and non-string values', () => {
        for (const order of [
            undefined,
            null,
            'a raw string is not the order',
            {},
            { gift_message: undefined },
            { gift_message: null },
            { gift_message: '' },
            { gift_message: '   ' },
            { gift_message: 12 },
            { gift_message: true },
            { gift_message: { text: 'nested object is not the field' } },
            { gift_message: ['array is not the field'] },
        ]) {
            assert.equal(getVisibleGiftMessage(order), null, JSON.stringify(order));
        }
    });

    it('never invents a message from notes, special_instructions, remark, or a nested gift object', () => {
        const lookalikes = {
            notes: 'From notes — do not show as gift message',
            special_instructions: 'From special_instructions — do not show as gift message',
            remark: 'From remark — do not show as gift message',
            gift: { message: 'From nested gift.message — do not show' },
            giftMessage: 'From camelCase — do not invent',
        };

        assert.equal(getVisibleGiftMessage(lookalikes), null);
        assert.equal(getVisibleGiftMessage({ ...lookalikes, gift_message: null }), null);
        assert.equal(getVisibleGiftMessage({ ...lookalikes, gift_message: '   ' }), null);
    });

    it('still shows a real top-level gift_message when lookalike fields are also present', () => {
        assert.equal(
            getVisibleGiftMessage({
                gift_message: 'For the birthday cake',
                notes: 'Leave at the door',
                special_instructions: 'Call on arrival',
                remark: 'VIP',
                gift: { message: 'nested must be ignored' },
            }),
            'For the birthday cake'
        );
    });
});
