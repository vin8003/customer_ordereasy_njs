/** Optional loyalty_points on customer order detail (OE-350). Display only. */

export type OptionalLoyaltyPoints = string | number | null | undefined;

export interface OrderDetailOptionalLoyaltyPoints {
    loyalty_points?: OptionalLoyaltyPoints;
    /** Allowed on payloads / tests; never used to invent loyalty_points. */
    discount_from_points?: OptionalLoyaltyPoints;
    points_earned?: OptionalLoyaltyPoints;
}

function asTrimmedString(value: unknown): string | null {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? String(value) : null;
    }
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
}

/** Finite number when the API sent a parseable points value; otherwise null (do not invent). */
export function parseOptionalLoyaltyPoints(value: unknown): number | null {
    const raw = asTrimmedString(value);
    if (raw == null) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
}

/**
 * Trimmed top-level `loyalty_points` for display, or null when the line must stay hidden.
 * Absent / undefined / null / blank / 0 / non-numeric → do not show.
 * Never derived from discount_from_points or points_earned.
 */
export function getVisibleLoyaltyPoints(order: OrderDetailOptionalLoyaltyPoints): string | null {
    const n = parseOptionalLoyaltyPoints(order.loyalty_points);
    if (n == null || n === 0) return null;
    return asTrimmedString(order.loyalty_points);
}
