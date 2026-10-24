/** Run with: npm test (node --test, TypeScript stripped at runtime). */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { clearOrdersHistory, ordersHistoryKey } from './ordersHistoryCache.ts';

describe('ordersHistoryKey', () => {
    it('has one key per page', () => {
        assert.notEqual(ordersHistoryKey(1), ordersHistoryKey(2));
        assert.equal(ordersHistoryKey(2), ordersHistoryKey(2));
    });
});

describe('clearOrdersHistory', () => {
    it('clears every cached page, so a cancelled order is not shown as pending', () => {
        const cache: Record<string, unknown> = {
            [ordersHistoryKey(1)]: 'page 1',
            [ordersHistoryKey(2)]: 'page 2',
            [ordersHistoryKey(12)]: 'page 12',
        };
        clearOrdersHistory(cache);
        assert.deepEqual(Object.keys(cache), []);
    });

    it('leaves other cached data alone', () => {
        const cache: Record<string, unknown> = {
            [ordersHistoryKey(1)]: 'page 1',
            orders_current: 'current',
            order_7: 'detail',
            cart_1: 'cart',
        };
        clearOrdersHistory(cache);
        assert.deepEqual(Object.keys(cache).sort(), ['cart_1', 'order_7', 'orders_current']);
    });

    it('does nothing for an empty cache', () => {
        const cache: Record<string, unknown> = {};
        clearOrdersHistory(cache);
        assert.deepEqual(cache, {});
    });
});
