/** Optional top-level hsn_code on customer product detail (OE-344). Display only. */

export type OptionalHsnCode = string | null | undefined;

/** Trimmed HSN for display, or null when the line must stay hidden. Never invents. */
export function formatVisibleHsnCode(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
}
