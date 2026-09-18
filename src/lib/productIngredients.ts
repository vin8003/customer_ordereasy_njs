/** Optional top-level ingredients blurb on customer product detail. Display only. */

export type OptionalIngredients = string | null | undefined;

/** Trimmed ingredients text for display, or null when the blurb must stay hidden. Never invents. */
export function formatVisibleIngredients(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
}
