/** Optional notes on customer order detail (OE-335). Display only. */

export type OptionalNotes = string | null | undefined;

export interface OrderDetailOptionalNotes {
    notes?: OptionalNotes;
    /** Allowed on payloads / tests; never used to invent notes. */
    special_instructions?: OptionalNotes;
    order_number?: string | null;
    cancellation_reason?: string | null;
}

function optionalTrimmedText(raw: unknown): string | null {
    if (typeof raw !== 'string') return null;
    const trimmed = raw.trim();
    return trimmed ? trimmed : null;
}

/**
 * Notes text from top-level `notes` only.
 * Absent / undefined / null / blank / non-string → do not show.
 * Never derived from special_instructions or other fields.
 */
export function getVisibleOrderNotes(order: OrderDetailOptionalNotes): string | null {
    return optionalTrimmedText(order.notes);
}
