/** Optional top-level SKU on a customer wishlist row (OE-332). Display only. */

export type OptionalWishlistSku = string | number | null | undefined;

/**
 * Trimmed SKU when the top-level field is present and non-empty.
 * Null/blank/non-scalar → null (do not invent from nested product or ids).
 */
export function getVisibleWishlistSku(value: unknown): string | null {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? String(value) : null;
    }
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
}
