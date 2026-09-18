/** Optional top-level min_order_qty on customer product detail. Display only. */

export type OptionalMinOrderQty = string | number | null | undefined;

function asTrimmedNumericString(value: unknown): string | null {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? String(value) : null;
    }
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
}

/** Trimmed qty for display, or null when the line must stay hidden. Never invents. */
export function formatVisibleMinOrderQty(value: unknown): string | null {
    const raw = asTrimmedNumericString(value);
    if (raw == null) return null;
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 0) return null;
    return raw;
}
