/** Optional category_name on customer product detail (OE-341). Display only. */

/** Trimmed top-level category_name, or null when the line must stay hidden. */
export function getVisibleCategoryName(categoryName: unknown): string | null {
    if (typeof categoryName !== 'string') return null;
    const trimmed = categoryName.trim();
    return trimmed ? trimmed : null;
}
