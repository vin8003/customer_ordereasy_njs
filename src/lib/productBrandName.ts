/** Optional top-level brand_name on customer product detail (OE-328). Display only. */

export type OptionalBrandName = string | null | undefined;

/** Trimmed brand for display, or null when the line must stay hidden. Never invents. */
export function formatVisibleBrandName(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
}
