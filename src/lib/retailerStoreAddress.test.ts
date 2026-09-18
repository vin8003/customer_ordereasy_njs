/** Run with: npm test (node --test, TypeScript stripped at runtime). */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { visibleRetailerStoreAddress } from './retailerStoreAddress.ts';

describe('visibleRetailerStoreAddress — retailer home header', () => {
    it('returns a trimmed top-level store_address when it is non-empty', () => {
        assert.equal(
            visibleRetailerStoreAddress({ store_address: '  12 Station Road, Bharatpur  ' }),
            '12 Station Road, Bharatpur'
        );
        assert.equal(
            visibleRetailerStoreAddress({ store_address: "Vineet's Kirana, Ward 4" }),
            "Vineet's Kirana, Ward 4"
        );
    });

    it('renders nothing for null, blank, or absent store_address', () => {
        assert.equal(visibleRetailerStoreAddress({ store_address: null }), null);
        assert.equal(visibleRetailerStoreAddress({ store_address: '' }), null);
        assert.equal(visibleRetailerStoreAddress({ store_address: '   ' }), null);
        assert.equal(visibleRetailerStoreAddress({}), null);
        assert.equal(visibleRetailerStoreAddress(undefined), null);
        assert.equal(visibleRetailerStoreAddress(null), null);
    });

    it('does not invent an address from address_line1, city, or state', () => {
        assert.equal(
            visibleRetailerStoreAddress({
                address_line1: 'Hidden Line',
                city: 'Bharatpur',
                state: 'Rajasthan',
            } as { store_address?: string | null }),
            null
        );
        assert.equal(
            visibleRetailerStoreAddress({
                store_address: '   ',
                address_line1: 'Hidden Line',
                city: 'Bharatpur',
                state: 'Rajasthan',
            } as { store_address?: string | null }),
            null
        );
        assert.equal(
            visibleRetailerStoreAddress({
                store_address: 'Visible Address',
                address_line1: 'Other Line',
                city: 'Other City',
            } as { store_address?: string | null }),
            'Visible Address'
        );
    });

    it('does not invent an address from nested or non-string top-level values', () => {
        assert.equal(
            visibleRetailerStoreAddress({ store_address: 12 as unknown as string }),
            null
        );
        assert.equal(
            visibleRetailerStoreAddress({
                store_address: { line: 'Obj' } as unknown as string,
            }),
            null
        );
        assert.equal(
            visibleRetailerStoreAddress({
                address: { store_address: 'Nested' },
            } as { store_address?: string | null }),
            null
        );
    });
});
