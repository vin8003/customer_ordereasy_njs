/**
 * Top-level retailer `store_hours` for the home header. Display only.
 * Never invent a line from is_currently_open, next_open_time, or nested hours objects.
 */

export function visibleRetailerStoreHours(
    retailer: { store_hours?: string | null } | null | undefined
): string | null {
    if (!retailer || typeof retailer.store_hours !== 'string') return null;
    const trimmed = retailer.store_hours.trim();
    return trimmed === '' ? null : trimmed;
}
