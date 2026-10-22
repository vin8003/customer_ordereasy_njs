import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isCouponRefusal } from './placeOrder.ts';

describe('isCouponRefusal', () => {
    it('spots the API refusing the coupon while the order is placed', () => {
        const error = { response: { data: { coupon_code: ['This coupon usage limit has been reached'] } } };
        assert.equal(isCouponRefusal(error), true);
    });

    it('ignores other failures', () => {
        assert.equal(isCouponRefusal({ response: { data: { fulfillment_slot_start: 'Fully booked' } } }), false);
        assert.equal(isCouponRefusal({ response: { data: { error: 'Out of stock' } } }), false);
        assert.equal(isCouponRefusal(new Error('Network Error')), false);
        assert.equal(isCouponRefusal(null), false);
    });
});
