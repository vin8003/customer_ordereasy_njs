/**
 * Optional top-level product list `unit` (OE-338).
 * Display only — never invent a placeholder such as "Unit".
 * Never invent a label from nested uom / unit_name fields.
 */

export function visibleProductListUnit(
    product: { unit?: string | null } | null | undefined
): string | null {
    if (!product || typeof product.unit !== 'string') return null;
    const trimmed = product.unit.trim();
    return trimmed === '' ? null : trimmed;
}
