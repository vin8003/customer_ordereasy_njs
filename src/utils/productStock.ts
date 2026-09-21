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

export interface StockAwareProduct {
    track_inventory?: boolean;
    stock_quantity?: number | null;
    quantity?: number | null;
}

export function getProductStockQuantity(product: StockAwareProduct): number {
    const raw = product.stock_quantity ?? product.quantity;
    const qty = Number(raw);
    return Number.isFinite(qty) ? qty : 0;
}

/** Hide out-of-stock catalog items (same rule for guests and logged-in users). */
export function filterInStockProducts<T extends StockAwareProduct>(products: T[]): T[] {
    return products.filter(
        (product) => !isOutOfStock(product.track_inventory, getProductStockQuantity(product))
    );
}

export function mapRetailerProduct<T extends Record<string, unknown>>(product: T) {
    const p = product as T & {
        discounted_price?: number | string;
        price?: number | string;
        original_price?: number | string;
        image?: string;
        image_url?: string;
        quantity?: number;
        track_inventory?: boolean;
        unit?: string;
        minimum_order_quantity?: number;
        maximum_order_quantity?: number | null;
    };

    return {
        ...p,
        price: p.discounted_price || p.price,
        mrp: p.original_price || p.price,
        image: p.image || p.image_url || '',
        stock_quantity: p.quantity || 0,
        track_inventory: p.track_inventory ?? true,
        unit: p.unit || 'Unit',
        minimum_order_quantity: p.minimum_order_quantity || 1,
        maximum_order_quantity: p.maximum_order_quantity,
    };
}

export function processRetailerProductList(data: unknown) {
    const list = Array.isArray(data) ? data : (data as { results?: unknown[] })?.results || [];
    return filterInStockProducts(list.map((item) => mapRetailerProduct(item as Record<string, unknown>)));
}
