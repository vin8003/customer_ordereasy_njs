/** Optional points_earned on customer order detail. Display only. Isolated from OE-311 fee lines. */

export type OptionalPointsEarned = string | number | null | undefined;

export interface OrderDetailOptionalPointsEarned {
    points_earned?: OptionalPointsEarned;
    /** Sibling fields — never used to invent points_earned. */
    discount_from_points?: OptionalPointsEarned;
    loyalty_points?: OptionalPointsEarned;
    potential_points?: OptionalPointsEarned;
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
export function parseOptionalPointsEarned(value: unknown): number | null {
    const raw = asTrimmedString(value);
    if (raw == null) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
}

/**
 * Trimmed top-level `points_earned` for display, or null when the line must stay hidden.
 * Absent / undefined / null / blank / 0 / non-numeric → do not show.
 * Never derived from discount_from_points, loyalty_points, or potential_points.
 */
export function getVisiblePointsEarned(order: OrderDetailOptionalPointsEarned): string | null {
    const n = parseOptionalPointsEarned(order.points_earned);
    if (n == null || n === 0) return null;
    return asTrimmedString(order.points_earned);
}
