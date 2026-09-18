/** Optional top-level barcode on customer product detail (OE-340). Display only. */

export type OptionalBarcode = string | null | undefined;

/** Trimmed barcode for display, or null when the line must stay hidden. Never invents. */
export function formatVisibleBarcode(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
}
