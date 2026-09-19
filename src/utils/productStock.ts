/** True when inventory is tracked and quantity is zero. */
export function isOutOfStock(
    trackInventory: boolean | undefined,
    stockQuantity: number | undefined | null
): boolean {
    const tracks = trackInventory !== false;
    if (!tracks) return false;
    const qty = Number(stockQuantity ?? 0);
    return qty <= 0;
}

/** Guest cart: never invent stock when API omits quantity. */
export function resolveStockQuantity(
    stockQuantity: number | undefined | null,
    trackInventory: boolean | undefined
): number {
    if (isOutOfStock(trackInventory, stockQuantity)) return 0;
    const qty = Number(stockQuantity);
    if (!Number.isFinite(qty) || qty < 0) return 0;
    return qty;
}
