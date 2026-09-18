/** Optional slot_start on customer order detail. Display only — never invents. */

export type OptionalSlotStart = string | null | undefined;

/** Trimmed top-level slot_start for display, or null when the line must stay hidden. */
export function formatVisibleSlotStart(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
}
