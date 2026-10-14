export interface RetailerChipFields {
    is_currently_open?: boolean | null;
    is_open?: boolean | null;
    currently_open?: boolean | null;
    minimum_order_amount?: number | string | null;
    min_order_amount?: number | string | null;
    delivery_charge?: number | string | null;
    delivery_fee?: number | string | null;
    free_delivery_threshold?: number | string | null;
}

export function parseOptionalBoolean(value: unknown): boolean | undefined {
    if (typeof value === 'boolean') return value;
    if (value === 'true' || value === 1 || value === '1') return true;
    if (value === 'false' || value === 0 || value === '0') return false;
    return undefined;
}

export function parseMoney(value: unknown): number | undefined {
    if (value === null || value === undefined || value === '') return undefined;
    const num = Number(value);
    return Number.isFinite(num) ? num : undefined;
}

export function mergeRetailerChipFields<T extends RetailerChipFields>(
    listItem: T,
    details?: RetailerChipFields | null
): T {
    const d = details || {};
    const isOpen = parseOptionalBoolean(
        d.is_currently_open ?? d.is_open ?? d.currently_open ??
        listItem.is_currently_open ?? listItem.is_open ?? listItem.currently_open
    );
    const minOrder = parseMoney(
        d.minimum_order_amount ?? d.min_order_amount ??
        listItem.minimum_order_amount ?? listItem.min_order_amount
    );
    const deliveryCharge = parseMoney(
        d.delivery_charge ?? d.delivery_fee ??
        listItem.delivery_charge ?? listItem.delivery_fee
    );
    const freeAbove = parseMoney(
        d.free_delivery_threshold ?? listItem.free_delivery_threshold
    );

    return {
        ...listItem,
        ...d,
        is_currently_open: isOpen,
        minimum_order_amount: minOrder,
        delivery_charge: deliveryCharge,
        free_delivery_threshold: freeAbove,
    };
}

export function formatChipCurrency(value?: number | string): string | null {
    const num = Number(value);
    if (!Number.isFinite(num) || num <= 0) return null;
    return `₹${num % 1 === 0 ? num : num.toFixed(2)}`;
}
