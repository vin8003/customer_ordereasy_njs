/** Optional top-level nutrition_info on customer product detail. Display only. */

export type OptionalNutritionInfo = string | null | undefined;

/** Trimmed nutrition text for display, or null when the section must stay hidden. Never invents. */
export function formatVisibleNutritionInfo(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
}
