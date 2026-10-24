import test from 'node:test';
import assert from 'node:assert/strict';
import { buildRetailerDiscoveryParams, deliveryFeeChip } from './retailerDiscovery.ts';

test('city only without a pin', () => {
    assert.deepEqual(buildRetailerDiscoveryParams({ name: 'Jaipur', state: 'Rajasthan', pincode: '302001' }), {
        city: 'Jaipur',
        state: 'Rajasthan',
    });
});

test('GPS pin adds lat/lng and the pincode for unpinned-shop fallback', () => {
    assert.deepEqual(
        buildRetailerDiscoveryParams({ name: 'Jaipur', state: 'Rajasthan', pincode: '302001', lat: 26.9, lng: 75.8 }),
        { city: 'Jaipur', state: 'Rajasthan', lat: '26.9', lng: '75.8', user_pincode: '302001' },
    );
});

test('ignores 0,0 and malformed pins and pincodes', () => {
    assert.deepEqual(buildRetailerDiscoveryParams({ name: 'A', state: 'B', lat: 0, lng: 0 }), { city: 'A', state: 'B' });
    assert.deepEqual(
        buildRetailerDiscoveryParams({ name: 'A', state: 'B', lat: 26.9, lng: 75.8, pincode: '12' }),
        { city: 'A', state: 'B', lat: '26.9', lng: '75.8' },
    );
    assert.deepEqual(buildRetailerDiscoveryParams({ name: 'A', state: 'B', lat: NaN, lng: 1 }), { city: 'A', state: 'B' });
});

test('deliveryFeeChip prefers the distance estimate', () => {
    assert.equal(deliveryFeeChip({ delivery_fee_estimate: '35.00', delivery_fee_mode: 'distance' }), 'Delivery ₹35');
    assert.equal(deliveryFeeChip({ delivery_fee_estimate: '12.50' }), 'Delivery ₹12.50');
    assert.equal(deliveryFeeChip({ delivery_fee_estimate: '0.00' }), 'Free delivery');
    assert.equal(deliveryFeeChip({ delivery_fee_estimate: null, delivery_fee_mode: 'distance' }), 'Delivery fee by distance');
    assert.equal(deliveryFeeChip({ delivery_fee_estimate: null, delivery_fee_mode: 'flat' }), null);
});
