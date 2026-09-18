/**
 * Top-level product `promo_label` for product-list ProductCard.
 * Never invent a label from offer text or a nested promo object.
 */

export function visibleProductPromoLabel(
    product: { promo_label?: string | null } | null | undefined
): string | null {
    if (!product || typeof product.promo_label !== 'string') return null;
    const trimmed = product.promo_label.trim();
    return trimmed === '' ? null : trimmed;
}
