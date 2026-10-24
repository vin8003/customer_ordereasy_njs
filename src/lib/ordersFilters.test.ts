/** Run with: npm test (node --test, TypeScript stripped at runtime). */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { clearOrdersHistory, ordersHistoryKey } from './ordersHistoryCache.ts';
import { EMPTY_ORDERS_FILTERS, hasOrdersFilters, ordersFilterParams } from './ordersFilters.ts';

describe('ordersFilterParams', () => {
    it('leaves out unset filters', () => {
        assert.deepEqual(ordersFilterParams(EMPTY_ORDERS_FILTERS), {});
    });

    it('maps filters to the backend query params', () => {
        assert.deepEqual(
            ordersFilterParams({ status: 'delivered', startDate: '2026-10-01', endDate: '2026-10-24', search: ' 123 ' }),
            { status: 'delivered', start_date: '2026-10-01', end_date: '2026-10-24', search: '123' },
        );
    });

    it('treats status "all" as no status filter', () => {
        assert.deepEqual(ordersFilterParams({ status: 'all' }), {});
    });
});

describe('hasOrdersFilters', () => {
    it('is false for blank filters and true when any is set', () => {
        assert.equal(hasOrdersFilters({ search: '  ' }), false);
        assert.equal(hasOrdersFilters({ endDate: '2026-10-24' }), true);
    });
});

describe('filtered order history cache', () => {
    it('keeps a page of each filter apart and clears them all together', () => {
        const a = ordersHistoryKey(1, { status: 'delivered' });
        const b = ordersHistoryKey(1, { status: 'cancelled' });
        assert.notEqual(a, b);
        assert.notEqual(a, ordersHistoryKey(1));
        assert.equal(ordersHistoryKey(2, { status: ' delivered ' }), ordersHistoryKey(2, { status: 'delivered' }));

        const cache: Record<string, unknown> = { [a]: 1, [b]: 2, [ordersHistoryKey(3)]: 3, orders_current: 4 };
        clearOrdersHistory(cache);
        assert.deepEqual(Object.keys(cache), ['orders_current']);
    });
});
