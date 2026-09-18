/** Optional top-level pack_qty on customer product detail. Display only. */

export type OptionalPackQty = string | number | null | undefined;

/** Trimmed pack qty for display, or null when the line must stay hidden. Never invents. */
export function formatVisiblePackQty(value: unknown): string | null {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? String(value) : null;
    }
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
}
