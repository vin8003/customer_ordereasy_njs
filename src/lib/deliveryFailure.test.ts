/** Run with: npm test (node --test, TypeScript stripped at runtime). */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
    hasDeliveryFailureReason,
    isDeliveryFailure,
    isDeliveryFailureStatus,
} from './deliveryFailure.ts';

describe('isDeliveryFailureStatus', () => {
    it('accepts the failed statuses a close-out write path could use', () => {
        for (const status of [
            'delivery_failed',
            'DELIVERY_FAILED',
            'delivery_failure',
            'failed_delivery',
            'mark_failed',
            'failed',
        ]) {
            assert.equal(isDeliveryFailureStatus(status), true, status);
        }
    });

    it('leaves the normal lifecycle statuses alone', () => {
        for (const status of [
            'pending',
            'confirmed',
            'processing',
            'packed',
            'out_for_delivery',
            'delivered',
            'cancelled',
            'returned',
            '',
            null,
            undefined,
        ]) {
            assert.equal(isDeliveryFailureStatus(status), false, String(status));
        }
    });
});

describe('hasDeliveryFailureReason', () => {
    it('matches close-out reasons however they are punctuated', () => {
        for (const reason of [
            'delivery_failed',
            'Delivery-Failed: customer not reachable',
            'Failed delivery — address not found',
            'mark_failed',
            'Order undelivered, returning to shop',
            'DELIVERY FAILURE',
        ]) {
            assert.equal(hasDeliveryFailureReason(reason), true, reason);
        }
    });

    it('does not match ordinary cancellation reasons', () => {
        for (const reason of [
            'Out of stock',
            'Customer changed their mind',
            'Payment failed',
            'Shop closed early',
            '',
            null,
            undefined,
        ]) {
            assert.equal(hasDeliveryFailureReason(reason), false, String(reason));
        }
    });
});

describe('isDeliveryFailure', () => {
    it('flags a cancelled delivery whose courier record failed', () => {
        assert.equal(
            isDeliveryFailure({
                status: 'cancelled',
                delivery_mode: 'delivery',
                delivery_info: { delivery_status: 'failed' },
            }),
            true
        );
    });

    it('flags a cancelled delivery closed out with a failure reason', () => {
        assert.equal(
            isDeliveryFailure({
                status: 'cancelled',
                delivery_mode: 'delivery',
                cancelled_by: 'retailer',
                cancellation_reason: 'Delivery failed — nobody at the address',
            }),
            true
        );
    });

    it('flags an explicit failed status even without a reason', () => {
        assert.equal(
            isDeliveryFailure({ status: 'delivery_failed', delivery_mode: 'delivery' }),
            true
        );
    });

    it('keeps a generic cancellation generic', () => {
        assert.equal(
            isDeliveryFailure({
                status: 'cancelled',
                delivery_mode: 'delivery',
                cancelled_by: 'retailer',
                cancellation_reason: 'Out of stock',
            }),
            false
        );
        assert.equal(
            isDeliveryFailure({ status: 'cancelled', delivery_mode: 'delivery' }),
            false
        );
    });

    it('keeps a customer-initiated cancellation generic even if a courier record failed', () => {
        assert.equal(
            isDeliveryFailure({
                status: 'cancelled',
                delivery_mode: 'delivery',
                cancelled_by: 'customer',
                cancellation_reason: 'Delivery failed',
                delivery_info: { delivery_status: 'failed' },
            }),
            false
        );
    });

    it('never treats a pickup order as a failed delivery', () => {
        for (const status of ['cancelled', 'delivery_failed']) {
            assert.equal(
                isDeliveryFailure({
                    status,
                    delivery_mode: 'pickup',
                    cancellation_reason: 'delivery_failed',
                    delivery_info: { delivery_status: 'failed' },
                }),
                false,
                status
            );
        }
    });

    it('does not flag an order that is still in flight', () => {
        for (const status of ['out_for_delivery', 'packed', 'delivered']) {
            assert.equal(
                isDeliveryFailure({
                    status,
                    delivery_mode: 'delivery',
                    delivery_info: { delivery_status: 'failed' },
                }),
                false,
                status
            );
        }
    });
});
