/**
 * Optional top-level `compare_at_price` on the customer product list (ProductCard).
 * Display only — never invent from `mrp` / `original_price`.
 */

import {
    formatVisibleOptionalMoneyAmount,
    type OptionalMoneyAmount,
} from './orderFeeLines.ts';

export type ProductListCompareAtPriceFields = {
    compare_at_price?: OptionalMoneyAmount;
};

/**
 * Trimmed API amount when the field is present and a number other than 0.
 * Missing, null, blank, zero, and non-numeric values stay hidden.
 */
export function visibleProductCompareAtPrice(
    product: ProductListCompareAtPriceFields | null | undefined
): string | null {
    if (product == null || typeof product !== 'object') return null;
    return formatVisibleOptionalMoneyAmount(product.compare_at_price);
}
