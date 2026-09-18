/** Optional top-level allergen_info on customer product detail. Display only. */

export type OptionalAllergenInfo = string | null | undefined;

/** Trimmed allergen text for display, or null when the line must stay hidden. Never invents. */
export function formatVisibleAllergenInfo(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
}
