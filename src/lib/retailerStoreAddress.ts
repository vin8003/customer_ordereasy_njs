/**
 * Top-level retailer `store_address` for the home header. Display only.
 * Never invent a line from address_line1, city, state, or nested address objects.
 */

export function visibleRetailerStoreAddress(
    retailer: { store_address?: string | null } | null | undefined
): string | null {
    if (!retailer || typeof retailer.store_address !== 'string') return null;
    const trimmed = retailer.store_address.trim();
    return trimmed === '' ? null : trimmed;
}
