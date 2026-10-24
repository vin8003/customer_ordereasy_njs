/**
 * Filters of the customer order history. The backend (`orders/history/`) takes `status`,
 * `start_date`, `end_date` (YYYY-MM-DD) and `search` (order number) next to `page`.
 */

export interface OrdersFilters {
    status: string;
    startDate: string;
    endDate: string;
    search: string;
}

export const EMPTY_ORDERS_FILTERS: OrdersFilters = { status: '', startDate: '', endDate: '', search: '' };

export const ORDER_STATUS_FILTERS: { value: string; label: string }[] = [
    { value: '', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'out_for_delivery', label: 'Out for delivery' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'returned', label: 'Returned' },
];

export function normalizeOrdersFilters(filters: Partial<OrdersFilters> = {}): OrdersFilters {
    return {
        status: filters.status?.trim() === 'all' ? '' : filters.status?.trim() ?? '',
        startDate: filters.startDate?.trim() ?? '',
        endDate: filters.endDate?.trim() ?? '',
        search: filters.search?.trim() ?? '',
    };
}

export function hasOrdersFilters(filters: Partial<OrdersFilters>): boolean {
    const f = normalizeOrdersFilters(filters);
    return Boolean(f.status || f.startDate || f.endDate || f.search);
}

/** Query params for the request; unset filters are left out. */
export function ordersFilterParams(filters: Partial<OrdersFilters>): Record<string, string> {
    const f = normalizeOrdersFilters(filters);
    const params: Record<string, string> = {};
    if (f.status) params.status = f.status;
    if (f.startDate) params.start_date = f.startDate;
    if (f.endDate) params.end_date = f.endDate;
    if (f.search) params.search = f.search;
    return params;
}
