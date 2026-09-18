/** Optional cashback line on customer order detail totals. Display only. */

export type OptionalCashbackAmount = string | number | null | undefined;

export interface OrderDetailOptionalCashback {
    cashback_amount?: OptionalCashbackAmount;
    /** Allowed on payloads / tests; never used to invent cashback. */
    delivery_fee?: OptionalCashbackAmount;
    discount_amount?: OptionalCashbackAmount;
    refund_amount?: OptionalCashbackAmount;
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
 * Cashback amount from top-level `cashback_amount` only.
 * Present + numeric ≠ 0 → trimmed API amount.
 * Missing / null / blank / non-numeric / 0 → hide; never invent from fee/discount/refund.
 */
export function getVisibleOrderCashbackAmount(order: OrderDetailOptionalCashback): string | null {
    const raw = asTrimmedString(order.cashback_amount);
    if (raw == null) return null;
    const n = Number(raw);
    if (!Number.isFinite(n) || n === 0) return null;
    return raw;
}
