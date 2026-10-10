/**
 * Top-level product `brand_name` for ProductCard (OE-316).
 * Never invent a label from a nested `brand` object.
 */

export function visibleProductBrandName(
    product: { brand_name?: string | null } | null | undefined
): string | null {
    if (!product || typeof product.brand_name !== 'string') return null;
    const trimmed = product.brand_name.trim();
    return trimmed === '' ? null : trimmed;
}
