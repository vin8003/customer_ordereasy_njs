/** Run with: npm test (node --test, TypeScript stripped at runtime). */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
    formatDeliveryStatusLabel,
    formatOrderStatusLabel,
    getOrderStatusDisplay,
    needsFulfillmentDetailEnrichment,
} from './orderFulfillmentDisplay.ts';

describe('formatOrderStatusLabel — failed delivery (OE-281)', () => {
    it('reads "Delivery failed" when the caller resolved a failed close-out', () => {
        assert.equal(formatOrderStatusLabel('cancelled', 'delivery', true), 'Delivery failed');
    });

    it('reads "Delivery failed" for an explicit failed status', () => {
        assert.equal(formatOrderStatusLabel('delivery_failed', 'delivery'), 'Delivery failed');
    });

    it('still reads "Cancelled" for a generic cancellation', () => {
        assert.equal(formatOrderStatusLabel('cancelled', 'delivery'), 'Cancelled');
        assert.equal(formatOrderStatusLabel('cancelled', 'delivery', false), 'Cancelled');
        assert.equal(formatOrderStatusLabel('cancelled', 'pickup'), 'Cancelled');
    });

    it('leaves the rest of the lifecycle copy alone', () => {
        assert.equal(formatOrderStatusLabel('packed', 'pickup'), 'Ready for pickup');
        assert.equal(formatOrderStatusLabel('packed', 'delivery'), 'Packed — preparing handoff');
        assert.equal(formatOrderStatusLabel('out_for_delivery', 'delivery'), 'Out for delivery');
        assert.equal(formatOrderStatusLabel('delivered', 'delivery'), 'Delivered');
    });
});

describe('getOrderStatusDisplay — failed delivery (OE-281)', () => {
    it('uses rose styling for a failed delivery', () => {
        const display = getOrderStatusDisplay('cancelled', 'delivery', true);
        assert.equal(display.label, 'Delivery failed');
        assert.match(display.badgeClass, /rose/);
        assert.match(display.bannerClass, /rose/);
    });

    it('keeps the red cancelled styling for a generic cancellation', () => {
        const display = getOrderStatusDisplay('cancelled', 'delivery');
        assert.equal(display.label, 'Cancelled');
        assert.match(display.badgeClass, /red/);
        assert.doesNotMatch(display.badgeClass, /rose/);
    });

    it('leaves delivered and out_for_delivery styling untouched', () => {
        assert.match(getOrderStatusDisplay('delivered', 'delivery').badgeClass, /green/);
        assert.match(getOrderStatusDisplay('out_for_delivery', 'delivery').badgeClass, /sky/);
    });
});

describe('formatDeliveryStatusLabel', () => {
    it('gives the failed courier record real copy instead of the raw enum', () => {
        assert.equal(formatDeliveryStatusLabel('failed'), 'Delivery failed');
    });

    it('leaves the other courier states alone', () => {
        assert.equal(formatDeliveryStatusLabel('assigned'), 'Courier assigned');
        assert.equal(formatDeliveryStatusLabel('in_transit'), 'On the way');
        assert.equal(formatDeliveryStatusLabel('delivered'), 'Delivered');
        assert.equal(formatDeliveryStatusLabel(null), null);
    });
});

describe('needsFulfillmentDetailEnrichment', () => {
    it('treats an explicit failed status as terminal', () => {
        assert.equal(
            needsFulfillmentDetailEnrichment({ status: 'delivery_failed', delivery_mode: 'delivery' }),
            false
        );
        assert.equal(
            needsFulfillmentDetailEnrichment({ status: 'delivery_failed', delivery_mode: 'pickup' }),
            false
        );
    });

    it('still enriches in-flight orders', () => {
        assert.equal(
            needsFulfillmentDetailEnrichment({ status: 'out_for_delivery', delivery_mode: 'delivery' }),
            true
        );
        assert.equal(
            needsFulfillmentDetailEnrichment({ status: 'pending', delivery_mode: 'pickup' }),
            true
        );
        assert.equal(
            needsFulfillmentDetailEnrichment({ status: 'cancelled', delivery_mode: 'delivery' }),
            false
        );
    });
});
