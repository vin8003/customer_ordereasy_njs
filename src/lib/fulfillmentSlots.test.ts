import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isSlotBookingError, isSlotChoiceMissing, type FulfillmentSlot } from './fulfillmentSlots.ts';

const slot = { slot_start: '2026-10-23T04:30:00Z' } as FulfillmentSlot;

describe('isSlotChoiceMissing', () => {
    it('blocks checkout without a slot when the shop has open slots', () => {
        assert.equal(isSlotChoiceMissing(null, 3), true);
    });

    it('does not block once a slot is chosen', () => {
        assert.equal(isSlotChoiceMissing(slot, 3), false);
    });

    it('does not block when the shop has no open slots or the picker has not loaded', () => {
        assert.equal(isSlotChoiceMissing(null, 0), false);
        assert.equal(isSlotChoiceMissing(null, null), false);
    });
});

describe('isSlotBookingError', () => {
    it('spots a refusal of the chosen slot', () => {
        const error = { response: { data: { fulfillment_slot_start: 'Fulfillment slot is fully booked' } } };
        assert.equal(isSlotBookingError(error), true);
    });

    it('ignores other failures', () => {
        assert.equal(isSlotBookingError({ response: { data: { error: 'Out of stock' } } }), false);
        assert.equal(isSlotBookingError(new Error('Network Error')), false);
        assert.equal(isSlotBookingError(null), false);
    });
});
