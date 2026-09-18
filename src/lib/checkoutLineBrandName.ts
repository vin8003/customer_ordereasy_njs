/**
 * Optional top-level checkout line `brand_name`.
 * Cart owns OE-329 (`cartLineBrandName`) — this helper is checkout-only.
 * Never invent a label from a nested `brand` object.
 */

export type CheckoutLineItem = {
    id?: number;
    product?: number;
    product_name?: string;
    product_price?: number | string;
    quantity: number;
    /** Optional; BE OE-314 may land separately. Null/blank invents nothing. */
    brand_name?: string | null;
};

export function visibleCheckoutLineBrandName(
    item: { brand_name?: string | null } | null | undefined
): string | null {
    if (!item || typeof item.brand_name !== 'string') return null;
    const trimmed = item.brand_name.trim();
    return trimmed === '' ? null : trimmed;
}

/** Local dummy QA only. Never true for `*.ordereasy.win`. */
export function isLocalDummyCheckoutPreview(hostname: string, search: string): boolean {
    if (hostname !== '127.0.0.1' && hostname !== 'localhost') return false;
    const query = search.startsWith('?') ? search.slice(1) : search;
    return new URLSearchParams(query).get('dummyBrand') === '1';
}

/** Dummy checkout lines for 127.0.0.1 / localhost `?dummyBrand=1` only. */
export function localDummyCheckoutLines(): CheckoutLineItem[] {
    return [
        { id: 1, product_name: 'Toned Milk 1L', product_price: '60.00', quantity: 2, brand_name: '  Amul  ' },
        { id: 2, product_name: 'Brown Bread', product_price: '40.00', quantity: 1, brand_name: null },
        { id: 3, product_name: 'Yoga Bar', product_price: 80, quantity: 1, brand_name: '   ' },
    ];
}
