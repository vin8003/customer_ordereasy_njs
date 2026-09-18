/**
 * Top-level wishlist row `sku`.
 * Never invent a label from a nested `product` or `sku` object.
 */

export function visibleWishlistSku(
    item: { sku?: string | null } | null | undefined
): string | null {
    if (!item || typeof item.sku !== 'string') return null;
    const trimmed = item.sku.trim();
    return trimmed === '' ? null : trimmed;
}
