/** Optional top-level origin_country on customer product detail. Display only. */

export type OptionalOriginCountry = string | null | undefined;

/** Trimmed origin country for display, or null when the line must stay hidden. Never invents. */
export function formatVisibleOriginCountry(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
}
