/**
 * Top-level store/header `seller_phone`. Display only.
 * Never invent a number from retailer_phone, phone, phone_number, or nested fields.
 */

export function visibleSellerPhone(
    store: { seller_phone?: string | null } | null | undefined
): string | null {
    if (!store || typeof store.seller_phone !== 'string') return null;
    const trimmed = store.seller_phone.trim();
    return trimmed === '' ? null : trimmed;
}
