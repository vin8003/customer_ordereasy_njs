/**
 * Optional top-level cart line `brand_name` (OE-329).
 * Treat as an optional key — BE OE-314 may land separately.
 * Never invent a label from a nested `brand` object.
 */

export function visibleCartLineBrandName(
    item: { brand_name?: string | null } | null | undefined
): string | null {
    if (!item || typeof item.brand_name !== 'string') return null;
    const trimmed = item.brand_name.trim();
    return trimmed === '' ? null : trimmed;
}
