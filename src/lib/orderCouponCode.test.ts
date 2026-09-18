/** Run with: npm test (node --test, TypeScript stripped at runtime). */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { visibleOrderCouponCode } from './orderCouponCode.ts';

describe('visibleOrderCouponCode — order-detail coupon line', () => {
    it('returns a trimmed top-level coupon_code when it is non-empty', () => {
        assert.equal(visibleOrderCouponCode({ coupon_code: '  SAVE10  ' }), 'SAVE10');
        assert.equal(visibleOrderCouponCode({ coupon_code: 'WELCOME' }), 'WELCOME');
    });

    it('renders nothing for null, blank, or absent coupon_code', () => {
        assert.equal(visibleOrderCouponCode({ coupon_code: null }), null);
        assert.equal(visibleOrderCouponCode({ coupon_code: '' }), null);
        assert.equal(visibleOrderCouponCode({ coupon_code: '   ' }), null);
        assert.equal(visibleOrderCouponCode({}), null);
        assert.equal(visibleOrderCouponCode(undefined), null);
        assert.equal(visibleOrderCouponCode(null), null);
    });

    it('does not invent a code from non-strings or nested coupon objects', () => {
        assert.equal(visibleOrderCouponCode({ coupon_code: 10 }), null);
        const nestedOnly = { coupon: { code: 'HIDDEN' } };
        assert.equal(visibleOrderCouponCode(nestedOnly), null);
        const blankWithNested = { coupon_code: '   ', coupon: { code: 'HIDDEN' } };
        assert.equal(visibleOrderCouponCode(blankWithNested), null);
        const visibleWithNested = { coupon_code: 'VISIBLE', coupon: { code: 'OTHER' } };
        assert.equal(visibleOrderCouponCode(visibleWithNested), 'VISIBLE');
    });
});
