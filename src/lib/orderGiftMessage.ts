/** Optional top-level gift_message on customer order detail. Display only. */

export type OptionalGiftMessage = string | null | undefined;

/**
 * Trimmed top-level `gift_message` when it is a non-empty string.
 * Missing, null, blank, and non-strings stay hidden.
 * Never reads notes, special_instructions, remark, or nested gift objects.
 */
export function getVisibleGiftMessage(order: unknown): string | null {
    if (order == null || typeof order !== 'object') return null;
    const value = (order as { gift_message?: unknown }).gift_message;
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
}
