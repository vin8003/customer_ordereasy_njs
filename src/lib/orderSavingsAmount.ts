/** Optional savings_amount on customer order detail. Display only. Isolated from OE-311 fee lines. */

export type OptionalSavingsAmount = string | number | null | undefined;

export interface OrderDetailOptionalSavings {
    savings_amount?: OptionalSavingsAmount;
    /** Sibling money fields — never used to invent savings. */
    discount_amount?: OptionalSavingsAmount;
    discount_from_points?: OptionalSavingsAmount;
    delivery_fee?: OptionalSavingsAmount;
    total_savings?: OptionalSavingsAmount;
    savings?: OptionalSavingsAmount;
}

function asTrimmedString(value: unknown): string | null {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? String(value) : null;
    }
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
}

/** Finite number when the API sent a parseable amount; otherwise null (do not invent). */
export function parseOptionalSavingsAmount(value: unknown): number | null {
    const raw = asTrimmedString(value);
    if (raw == null) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
}

/** Trimmed API amount when present and numeric ≠ 0; otherwise null. Never invents. */
export function formatVisibleSavingsAmount(value: unknown): string | null {
    const n = parseOptionalSavingsAmount(value);
    if (n == null || n === 0) return null;
    return asTrimmedString(value);
}

/** Visible savings from top-level `savings_amount` only. */
export function getVisibleOrderSavingsAmount(
    order: OrderDetailOptionalSavings
): string | null {
    return formatVisibleSavingsAmount(order.savings_amount);
}
