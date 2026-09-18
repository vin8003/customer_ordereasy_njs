/**
 * Top-level product `badge_text` for ProductCard (OE-316 sibling, display-only).
 * Never invent a label from nested badge objects, `active_offer_text`, or `brand_name`.
 */

export function visibleProductBadgeText(
    product: { badge_text?: string | null } | null | undefined
): string | null {
    if (!product || typeof product.badge_text !== 'string') return null;
    const trimmed = product.badge_text.trim();
    return trimmed === '' ? null : trimmed;
}
