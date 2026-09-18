/** Optional top-level backorder_qty on customer product detail. Display only. */

export type OptionalBackorderQty = string | number | null | undefined;

export interface ProductDetailOptionalBackorderQty {
    backorder_qty?: OptionalBackorderQty;
    /** Allowed on payloads / tests; never used to invent backorder_qty. */
    stock_quantity?: OptionalBackorderQty;
    quantity?: OptionalBackorderQty;
    minimum_order_quantity?: OptionalBackorderQty;
}

function asTrimmedString(value: unknown): string | null {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? String(value) : null;
    }
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
}

/** Finite number when the API sent a parseable qty; otherwise null (do not invent). */
export function parseOptionalBackorderQty(value: unknown): number | null {
    const raw = asTrimmedString(value);
    if (raw == null) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
}

/**
 * Trimmed top-level `backorder_qty` for display, or null when the line must stay hidden.
 * Absent / undefined / null / blank / 0 / non-numeric → do not show.
 * Never derived from stock_quantity, quantity, or minimum_order_quantity.
 */
export function formatVisibleBackorderQty(
    product: ProductDetailOptionalBackorderQty | null | undefined
): string | null {
    if (!product) return null;
    const n = parseOptionalBackorderQty(product.backorder_qty);
    if (n == null || n === 0) return null;
    return asTrimmedString(product.backorder_qty);
}
