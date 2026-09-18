/** Optional return_window_days on customer order detail (OE-360). Display only. */

export type OptionalReturnWindowDays = string | number | null | undefined;

export interface OrderDetailOptionalReturnWindow {
    return_window_days?: OptionalReturnWindowDays;
    /** Allowed on payloads / tests; never used to invent a return window. */
    refund_amount?: string | number | null;
    returned_quantity?: number | null;
    items?: Array<{ returned_quantity?: number | null }>;
}

function asTrimmedString(value: unknown): string | null {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? String(value) : null;
    }
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
}

/** Finite number when the API sent a parseable day count; otherwise null (do not invent). */
export function parseReturnWindowDays(value: unknown): number | null {
    const raw = asTrimmedString(value);
    if (raw == null) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
}

/**
 * Days from top-level `return_window_days` only.
 * Absent / undefined / null / blank / 0 / non-numeric → do not show.
 * Never derived from refund_amount, returned_quantity, or item-level return fields.
 */
export function getVisibleReturnWindowDays(
    order: OrderDetailOptionalReturnWindow
): number | null {
    const n = parseReturnWindowDays(order.return_window_days);
    if (n == null || n === 0) return null;
    return n;
}

/** Compact "1 day" / "N days" label, or null when the line must stay hidden. */
export function formatVisibleReturnWindowDays(
    order: OrderDetailOptionalReturnWindow
): string | null {
    const days = getVisibleReturnWindowDays(order);
    if (days == null) return null;
    return days === 1 ? '1 day' : `${days} days`;
}
