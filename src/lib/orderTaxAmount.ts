/** Optional tax line on customer order detail totals. Display only. */

export type OptionalTaxAmount = string | number | null | undefined;

export interface OrderDetailOptionalTax {
    tax_amount?: OptionalTaxAmount;
    /** Allowed on payloads / tests; never used to invent tax. */
    delivery_fee?: OptionalTaxAmount;
    discount_amount?: OptionalTaxAmount;
}

function asTrimmedString(value: unknown): string | null {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? String(value) : null;
    }
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
}

/**
 * Tax amount from top-level `tax_amount` only.
 * Present + numeric ≠ 0 → trimmed API amount.
 * Missing / null / blank / non-numeric / 0 → hide; never invent from fee/discount.
 */
export function getVisibleOrderTaxAmount(order: OrderDetailOptionalTax): string | null {
    const raw = asTrimmedString(order.tax_amount);
    if (raw == null) return null;
    const n = Number(raw);
    if (!Number.isFinite(n) || n === 0) return null;
    return raw;
}
