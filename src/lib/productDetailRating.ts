/** Optional top-level rating on customer product detail. Display only. */

export type OptionalRating = string | number | null | undefined;

function asTrimmedString(value: unknown): string | null {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? String(value) : null;
    }
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
}

/** Finite number when the API sent a parseable rating; otherwise null (do not invent). */
function parseOptionalRating(value: unknown): number | null {
    const raw = asTrimmedString(value);
    if (raw == null) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
}

/** Trimmed rating for display, or null when the line must stay hidden. Never invents. */
export function formatVisibleProductRating(value: unknown): string | null {
    const n = parseOptionalRating(value);
    if (n == null || n === 0) return null;
    return asTrimmedString(value);
}
