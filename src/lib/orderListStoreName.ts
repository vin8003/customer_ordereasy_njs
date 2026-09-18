/**
 * Top-level order list row `store_name`. Display only.
 * Never invent a label from retailer_name or nested shop fields.
 * Isolated from OE-322 / OE-311 fee helpers.
 */

export function visibleOrderListStoreName(
    order: { store_name?: string | null } | null | undefined
): string | null {
    if (!order || typeof order.store_name !== 'string') return null;
    const trimmed = order.store_name.trim();
    return trimmed === '' ? null : trimmed;
}
