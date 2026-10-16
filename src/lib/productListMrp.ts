/** Optional product-list MRP strikethrough (OE-353). Top-level `mrp` only. */

export type OptionalProductListMrp = string | number | null | undefined;

export interface ProductListMrpFields {
    mrp?: OptionalProductListMrp;
    /** Sibling field (OE-338) — never used as an MRP fallback. */
    unit?: unknown;
    original_price?: unknown;
    price?: unknown;
}

function asTrimmedString(value: unknown): string | null {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? String(value) : null;
    }
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
}

/**
 * Trimmed list-row MRP when the API sent a finite non-zero `mrp`.
 * Missing / blank / non-numeric / zero → null. Never invent from
 * `original_price`, `price`, or `unit`.
 */
export function visibleProductListMrp(
    product: ProductListMrpFields | null | undefined
): string | null {
    if (!product) return null;
    const raw = asTrimmedString(product.mrp);
    if (raw == null) return null;
    const n = Number(raw);
    if (!Number.isFinite(n) || n === 0) return null;
    return raw;
}
