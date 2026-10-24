/**
 * Optional top-level search-result `brand_name` (OE-316 / OE-328 search-page slice).
 * Never invent a label from a nested `brand` object.
 */

export function visibleSearchProductBrandName(
    product: { brand_name?: string | null } | null | undefined
): string | null {
    if (!product || typeof product.brand_name !== 'string') return null;
    const trimmed = product.brand_name.trim();
    return trimmed === '' ? null : trimmed;
}
