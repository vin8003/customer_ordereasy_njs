/** Run with: npm test (node --test, TypeScript stripped at runtime). */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { visibleRetailerStoreHours } from './retailerStoreHours.ts';

describe('visibleRetailerStoreHours — retailer home header', () => {
    it('returns a trimmed top-level store_hours when it is non-empty', () => {
        assert.equal(
            visibleRetailerStoreHours({ store_hours: '  Mon–Sat 9:00 AM – 9:00 PM  ' }),
            'Mon–Sat 9:00 AM – 9:00 PM'
        );
        assert.equal(
            visibleRetailerStoreHours({ store_hours: "Daily 8am-10pm" }),
            'Daily 8am-10pm'
        );
    });

    it('renders nothing for null, blank, or absent store_hours', () => {
        assert.equal(visibleRetailerStoreHours({ store_hours: null }), null);
        assert.equal(visibleRetailerStoreHours({ store_hours: '' }), null);
        assert.equal(visibleRetailerStoreHours({ store_hours: '   ' }), null);
        assert.equal(visibleRetailerStoreHours({}), null);
        assert.equal(visibleRetailerStoreHours(undefined), null);
        assert.equal(visibleRetailerStoreHours(null), null);
    });

    it('does not invent hours from is_currently_open or next_open_time', () => {
        assert.equal(
            visibleRetailerStoreHours({
                is_currently_open: false,
                next_open_time: '8:00 AM',
            } as { store_hours?: string | null }),
            null
        );
        assert.equal(
            visibleRetailerStoreHours({
                store_hours: '   ',
                is_currently_open: true,
                next_open_time: 'Tomorrow 9:00 AM',
            } as { store_hours?: string | null }),
            null
        );
        assert.equal(
            visibleRetailerStoreHours({
                store_hours: 'Sun 10:00 AM – 6:00 PM',
                is_currently_open: false,
                next_open_time: 'Monday 9:00 AM',
            } as { store_hours?: string | null }),
            'Sun 10:00 AM – 6:00 PM'
        );
    });

    it('does not invent hours from nested or non-string top-level values', () => {
        assert.equal(
            visibleRetailerStoreHours({ store_hours: 9 as unknown as string }),
            null
        );
        assert.equal(
            visibleRetailerStoreHours({
                store_hours: { monday: '9-9' } as unknown as string,
            }),
            null
        );
        assert.equal(
            visibleRetailerStoreHours({
                hours: { store_hours: 'Nested' },
            } as { store_hours?: string | null }),
            null
        );
        assert.equal(
            visibleRetailerStoreHours({
                opening_hours: '9am-9pm',
                operating_hours: 'Mon-Sat',
            } as { store_hours?: string | null }),
            null
        );
    });
});
