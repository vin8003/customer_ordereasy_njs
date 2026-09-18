/** Optional warehouse_name on customer order detail (OE-347). Display only. */

export type OptionalWarehouseName = string | null | undefined;

export interface OrderDetailOptionalWarehouse {
    warehouse_name?: OptionalWarehouseName;
    /** Allowed on payloads / tests; never used to invent a warehouse label. */
    retailer_name?: string | null;
    retailer_address?: string | null;
    warehouse?: { name?: string | null } | null;
}

function optionalTrimmedText(raw: unknown): string | null {
    if (typeof raw !== 'string') return null;
    const trimmed = raw.trim();
    return trimmed ? trimmed : null;
}

/**
 * Warehouse label from top-level `warehouse_name` only.
 * Absent / undefined / null / blank / non-string → do not show.
 * Never derived from a nested `warehouse` object or retailer fields.
 */
export function getVisibleWarehouseName(order: OrderDetailOptionalWarehouse): string | null {
    return optionalTrimmedText(order.warehouse_name);
}
