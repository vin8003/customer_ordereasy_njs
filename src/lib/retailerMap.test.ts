import test from 'node:test';
import assert from 'node:assert/strict';
import {
    addressToLocation,
    filterRetailers,
    locationSummary,
    offsetCenter,
    pickSnap,
    resolveStartLocation,
    retailerPin,
    sortRetailers,
    splitByPin,
    toLatLng,
    type ChosenLocation,
    type MapRetailer,
    type SavedAddress,
} from './retailerMap.ts';

const shop = (over: Partial<MapRetailer>): MapRetailer => ({ id: 1, shop_name: 'Shop', ...over });

test('toLatLng accepts API decimals and rejects empty, 0,0 and out-of-range pins', () => {
    assert.deepEqual(toLatLng('27.21670000', '77.48950000'), { lat: 27.2167, lng: 77.4895 });
    assert.equal(toLatLng(null, null), null);
    assert.equal(toLatLng('', ''), null);
    assert.equal(toLatLng(0, 0), null);
    assert.equal(toLatLng('0.00000000', '0.00000000'), null);
    assert.equal(toLatLng(91, 10), null);
    assert.equal(toLatLng('abc', 10), null);
});

test('shops without a pin go to the fallback list', () => {
    const a = shop({ id: 1, latitude: '27.2', longitude: '77.4' });
    const b = shop({ id: 2, latitude: null, longitude: null });
    const c = shop({ id: 3, latitude: '0', longitude: '0' });
    const { pinned, unpinned } = splitByPin([a, b, c]);
    assert.deepEqual(pinned.map((r) => r.id), [1]);
    assert.deepEqual(unpinned.map((r) => r.id), [2, 3]);
    assert.deepEqual(retailerPin(a), { lat: 27.2, lng: 77.4 });
});

test('search matches every word across name, categories and type', () => {
    const list = [
        shop({ id: 1, shop_name: 'Gupta Kirana Store', categories: [{ name: 'Grocery' }] }),
        shop({ id: 2, shop_name: 'Sharma Sweets', business_type: 'Mithai' }),
    ];
    assert.deepEqual(filterRetailers(list, 'gupta groc').map((r) => r.id), [1]);
    assert.deepEqual(filterRetailers(list, 'MITHAI').map((r) => r.id), [2]);
    assert.deepEqual(filterRetailers(list, '  ').map((r) => r.id), [1, 2]);
    assert.deepEqual(filterRetailers(list, 'pizza'), []);
});

test('filters combine', () => {
    const list = [
        shop({ id: 1, is_currently_open: true, offers_delivery: true, delivery_charge: 0, average_rating: '4.5' }),
        shop({ id: 2, is_currently_open: false, offers_delivery: true, delivery_charge: 20 }),
        shop({ id: 3, is_currently_open: true, offers_pickup: true, average_rating: 3.9 }),
        shop({ id: 4, is_currently_open: true, offers_delivery: true, delivery_fee_mode: 'distance', delivery_charge: 0, delivery_fee_estimate: '15.00' }),
        shop({ id: 5, is_currently_open: true, offers_delivery: true, delivery_fee_mode: 'distance', delivery_fee_estimate: '0.00' }),
    ];
    assert.deepEqual(filterRetailers(list, '', ['open']).map((r) => r.id), [1, 3, 4, 5]);
    assert.deepEqual(filterRetailers(list, '', ['open', 'delivery']).map((r) => r.id), [1, 4, 5]);
    assert.deepEqual(filterRetailers(list, '', ['pickup']).map((r) => r.id), [3]);
    assert.deepEqual(filterRetailers(list, '', ['free_delivery']).map((r) => r.id), [1, 5]);
    assert.deepEqual(filterRetailers(list, '', ['top_rated']).map((r) => r.id), [1]);
});

test('nearest first, shops without a distance keep server order after them', () => {
    const list = [
        shop({ id: 1, distance: null }),
        shop({ id: 2, distance: 3.2 }),
        shop({ id: 3 }),
        shop({ id: 4, distance: 0.8 }),
    ];
    assert.deepEqual(sortRetailers(list).map((r) => r.id), [4, 2, 1, 3]);
});

const city: ChosenLocation = { id: 'bharatpur_rajasthan', name: 'Bharatpur', state: 'Rajasthan', source: 'manual' };
const home: SavedAddress = {
    id: 7, title: 'Home', address_line1: '12 Station Road', city: 'Bharatpur', state: 'Rajasthan',
    pincode: '321001', latitude: '27.21700000', longitude: '77.49000000', is_default: true,
};
const office: SavedAddress = {
    id: 8, title: '', address_type: 'office', address_line1: 'MI Road', city: 'Jaipur', state: 'Rajasthan',
    pincode: '302001', latitude: '26.91', longitude: '75.78', is_default: false,
};

test('the default address with a pin becomes the map centre', () => {
    const loc = resolveStartLocation(city, [office, home]);
    assert.equal(loc.addressId, 7);
    assert.equal(loc.source, 'address');
    assert.equal(loc.label, 'Home');
    assert.equal(loc.lat, 27.217);
    assert.equal(loc.pincode, '321001');
    assert.equal(loc.explicit, false);
});

test('without a default, the first address that has a pin is used', () => {
    const loc = resolveStartLocation({ ...city, name: 'Jaipur', id: 'jaipur_rajasthan' }, [
        { ...home, is_default: false, latitude: null, longitude: null },
        office,
    ]);
    assert.equal(loc.addressId, 8);
    assert.equal(loc.label, 'Office');
});

test('an address without a pin never replaces the stored location', () => {
    const loc = resolveStartLocation(city, [{ ...home, latitude: null, longitude: null }]);
    assert.deepEqual(loc, city);
});

test('a hand-picked city is kept when the default address is in another city', () => {
    const jaipur: ChosenLocation = { id: 'jaipur_rajasthan', name: 'Jaipur', state: 'Rajasthan', source: 'manual' };
    assert.deepEqual(resolveStartLocation(jaipur, [home]), jaipur);
});

test('welcome-screen GPS gives way to the default address', () => {
    const gps: ChosenLocation = { ...city, name: 'Jaipur', id: 'jaipur_rajasthan', lat: 26.9, lng: 75.8, source: 'gps' };
    assert.equal(resolveStartLocation(gps, [home]).addressId, 7);
    assert.deepEqual(resolveStartLocation(gps, []), gps);
});

test('a choice made in the location sheet is never replaced', () => {
    const pinned: ChosenLocation = { ...city, lat: 27.2, lng: 77.5, source: 'pin', explicit: true };
    assert.deepEqual(resolveStartLocation(pinned, [home]), pinned);
    const gps: ChosenLocation = { ...city, lat: 27.2, lng: 77.5, source: 'gps', explicit: true };
    assert.deepEqual(resolveStartLocation(gps, [home]), gps);
});

test('a picked address is refreshed from the address book and dropped once deleted', () => {
    const picked = addressToLocation(office, true);
    const moved = { ...office, latitude: '26.95', address_line1: 'C Scheme' };
    const refreshed = resolveStartLocation(picked, [home, moved]);
    assert.equal(refreshed.lat, 26.95);
    assert.equal(refreshed.explicit, true);
    assert.match(refreshed.address || '', /C Scheme/);

    // Deleted: Jaipur stays the city, and the Bharatpur default does not take over.
    const afterDelete = resolveStartLocation(picked, [home]);
    assert.equal(afterDelete.name, 'Jaipur');
    assert.equal(afterDelete.addressId, undefined);
    assert.equal(afterDelete.lat, undefined);

    // Signed out (no address book loaded): keep what was picked.
    assert.deepEqual(resolveStartLocation(picked, []), picked);
});

test('location bar text', () => {
    assert.deepEqual(locationSummary(null), { title: 'Select location', detail: '' });
    assert.deepEqual(locationSummary(city), { title: 'Bharatpur', detail: 'Rajasthan' });
    assert.deepEqual(locationSummary(addressToLocation(home, false)), { title: 'Home', detail: '12 Station Road, Bharatpur' });
    assert.deepEqual(
        locationSummary({ ...city, lat: 27.2, lng: 77.5, source: 'gps', pincode: '321001' }),
        { title: 'Current location', detail: 'Bharatpur 321001' }
    );
});

test('offsetCenter moves the centre so the target sits off-centre by the given pixels', () => {
    const target = { lat: 27.2, lng: 77.5 };
    const same = offsetCenter(target, 0, 0, 14);
    assert.ok(Math.abs(same.lat - 27.2) < 1e-9 && Math.abs(same.lng - 77.5) < 1e-9);
    // Target should appear 100px above the centre: the centre is south of it.
    const c = offsetCenter(target, 0, -100, 14);
    assert.ok(c.lat < target.lat);
    assert.ok(Math.abs(c.lng - target.lng) < 1e-9);
    // Round trip.
    const back = offsetCenter(c, 0, 100, 14);
    assert.ok(Math.abs(back.lat - target.lat) < 1e-9);
});

test('sheet snapping: flicks move one step, slow drags settle on the nearest height', () => {
    const heights = { peek: 120, mid: 320, full: 600 };
    assert.equal(pickSnap(300, 0, heights, 'mid'), 'mid');
    assert.equal(pickSnap(500, 0.1, heights, 'mid'), 'full');
    assert.equal(pickSnap(180, 0, heights, 'mid'), 'peek');
    assert.equal(pickSnap(330, -0.9, heights, 'mid'), 'full');
    assert.equal(pickSnap(310, 0.9, heights, 'mid'), 'peek');
    assert.equal(pickSnap(130, 0.9, heights, 'peek'), 'peek');
});
