/** Run with: npm test (node --test, TypeScript stripped at runtime). */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { getVisibleDeliveryInstructions } from './checkoutDeliveryInstructions.ts';

describe('getVisibleDeliveryInstructions', () => {
    it('returns the trimmed delivery_instructions when the API sent a non-empty string', () => {
        assert.equal(
            getVisibleDeliveryInstructions({ delivery_instructions: 'Leave at the shop gate' }),
            'Leave at the shop gate'
        );
        assert.equal(
            getVisibleDeliveryInstructions({ delivery_instructions: '  Ring the bell twice  ' }),
            'Ring the bell twice'
        );
    });

    it('returns null when delivery_instructions is omitted, null, blank, or not a string', () => {
        for (const review of [
            {},
            { delivery_instructions: undefined },
            { delivery_instructions: null },
            { delivery_instructions: '' },
            { delivery_instructions: '   ' },
            { delivery_instructions: 12 as unknown as string },
            { delivery_instructions: true as unknown as string },
            { delivery_instructions: { text: 'nope' } as unknown as string },
        ]) {
            assert.equal(getVisibleDeliveryInstructions(review), null, JSON.stringify(review));
        }
    });

    it('does not invent delivery_instructions from special_instructions, notes, or address', () => {
        assert.equal(
            getVisibleDeliveryInstructions({
                special_instructions: 'Handle with care',
                notes: 'Call on arrival',
                delivery_address_text: '12 Market Street',
            }),
            null
        );
        assert.equal(
            getVisibleDeliveryInstructions({
                delivery_instructions: null,
                special_instructions: 'Handle with care',
                notes: 'Call on arrival',
            }),
            null
        );
        assert.equal(
            getVisibleDeliveryInstructions({
                delivery_instructions: '   ',
                special_instructions: 'Handle with care',
                delivery_address_text: '12 Market Street',
            }),
            null
        );
    });
});
