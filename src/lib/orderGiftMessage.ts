/** Optional gift_message on customer order detail. Display only. */

export type OptionalGiftMessage = string | null | undefined;

export interface OrderDetailOptionalGiftMessage {
    gift_message?: OptionalGiftMessage;
    /** Allowed on payloads / tests; never used to invent a gift message. */
    notes?: OptionalGiftMessage;
    special_instructions?: OptionalGiftMessage;
    order_number?: string | null;
    cancellation_reason?: string | null;
}

function optionalTrimmedText(raw: unknown): string | null {
    if (typeof raw !== 'string') return null;
    const trimmed = raw.trim();
    return trimmed ? trimmed : null;
}

/**
 * Gift message from top-level `gift_message` only.
 * Absent / undefined / null / blank / non-string → do not show.
 * Never derived from notes, special_instructions, or other fields.
 */
export function getVisibleGiftMessage(order: OrderDetailOptionalGiftMessage): string | null {
    return optionalTrimmedText(order.gift_message);
}
