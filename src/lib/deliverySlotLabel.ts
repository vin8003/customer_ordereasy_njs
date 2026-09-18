/** Optional delivery_slot_label on customer order detail (OE-346). Display only. */

export type OptionalDeliverySlotLabel = string | null | undefined;

/** Trimmed slot label for display, or null when the line must stay hidden. Never invents. */
export function formatVisibleDeliverySlotLabel(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
}
