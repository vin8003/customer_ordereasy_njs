import test from 'node:test';
import assert from 'node:assert/strict';
import { flatDeliveryFee, formatDistanceKm, parseDeliveryQuote } from './deliveryQuote.ts';

test('parseDeliveryQuote reads the backend payload', () => {
    assert.deepEqual(
        parseDeliveryQuote({
            deliverable: true,
            delivery_fee: '43.00',
            distance_km: '6.00',
            reason: '',
            pricing: 'per_km',
        }),
        { deliverable: true, fee: 43, distanceKm: 6, reason: '', pricing: 'per_km' },
    );
});

test('parseDeliveryQuote keeps the refusal reason and unknown distance', () => {
    const quote = parseDeliveryQuote({
        deliverable: false,
        delivery_fee: '0.00',
        distance_km: null,
        reason: 'This address is 12 km away.',
    });
    assert.equal(quote?.deliverable, false);
    assert.equal(quote?.distanceKm, null);
    assert.equal(quote?.reason, 'This address is 12 km away.');
});

test('parseDeliveryQuote rejects payloads without a verdict or fee', () => {
    assert.equal(parseDeliveryQuote(null), null);
    assert.equal(parseDeliveryQuote({}), null);
    assert.equal(parseDeliveryQuote({ deliverable: true }), null);
    assert.equal(parseDeliveryQuote({ deliverable: true, delivery_fee: 'abc' }), null);
});

test('flatDeliveryFee applies the free-delivery threshold', () => {
    const settings = { deliveryCharge: 30, freeDeliveryThreshold: 500 };
    assert.equal(flatDeliveryFee(settings, 499), 30);
    assert.equal(flatDeliveryFee(settings, 500), 0);
    assert.equal(flatDeliveryFee({ deliveryCharge: 30, freeDeliveryThreshold: 0 }, 5000), 30);
});

test('formatDistanceKm', () => {
    assert.equal(formatDistanceKm(3.44), '3.4 km');
    assert.equal(formatDistanceKm(12.4), '12 km');
    assert.equal(formatDistanceKm(null), '');
    assert.equal(formatDistanceKm(NaN), '');
});
