/**
 * Top-level wishlist row `brand_name` (OE-332).
 * Never invent a label from a nested `brand` object.
 */

export function visibleWishlistBrandName(
    item: { brand_name?: string | null } | null | undefined
): string | null {
    if (!item || typeof item.brand_name !== 'string') return null;
    const trimmed = item.brand_name.trim();
    return trimmed === '' ? null : trimmed;
}
