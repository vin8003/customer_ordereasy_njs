/**
 * Cache keys of the customer order history, one entry per page and filter set. Every change to an order
 * clears all of them, so the list never shows an order as it was before the change.
 */

import { ordersFilterParams, type OrdersFilters } from './ordersFilters.ts';

export const ORDERS_HISTORY_KEY_PREFIX = 'orders_history';

export function ordersHistoryKey(page: number, filters: Partial<OrdersFilters> = {}): string {
    const params = ordersFilterParams(filters);
    const filterPart = Object.keys(params).length ? `_${new URLSearchParams(params).toString()}` : '';
    return `${ORDERS_HISTORY_KEY_PREFIX}${filterPart}_p${page}`;
}

/** Removes every cached page of the order history from `cache`. */
export function clearOrdersHistory(cache: Record<string, unknown>): void {
    for (const key of Object.keys(cache)) {
        if (key.startsWith(ORDERS_HISTORY_KEY_PREFIX)) delete cache[key];
    }
}
