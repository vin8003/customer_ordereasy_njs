/** Review fixes for OE-152: pickup code/courier visibility and tel: sanitising. */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { isOrderOpenForFulfillment, telHref } from './fulfillmentVisibility.ts';

describe('isOrderOpenForFulfillment', () => {
    it('is false once the order is closed', () => {
        for (const status of ['delivered', 'cancelled', 'returned', 'Delivered']) {
            assert.equal(isOrderOpenForFulfillment(status), false, status);
        }
    });

    it('is true while the order is in progress or the status is missing', () => {
        for (const status of ['pending', 'packed', 'out_for_delivery', undefined]) {
            assert.equal(isOrderOpenForFulfillment(status), true, String(status));
        }
    });
});

describe('telHref', () => {
    it('keeps digits and a leading plus only', () => {
        assert.equal(telHref('+91 98765-43210'), 'tel:+919876543210');
        assert.equal(telHref('98765 43210;ext=1'), 'tel:987654321' + '01');
    });

    it('rejects values that are not phone numbers', () => {
        assert.equal(telHref('abc'), null);
        assert.equal(telHref('12'), null);
        assert.equal(telHref(null), null);
    });
});
