/** Optional delivery_instructions on customer checkout review (OE-354). Display only. */

export type OptionalDeliveryInstructions = string | null | undefined;

export interface CheckoutReviewOptionalFields {
    delivery_instructions?: OptionalDeliveryInstructions;
    /** Allowed on payloads / tests; never used to invent delivery_instructions. */
    special_instructions?: OptionalDeliveryInstructions;
    notes?: OptionalDeliveryInstructions;
    delivery_address_text?: string | null;
}

function optionalTrimmedText(raw: unknown): string | null {
    if (typeof raw !== 'string') return null;
    const trimmed = raw.trim();
    return trimmed ? trimmed : null;
}

/**
 * Delivery-instruction text from top-level `delivery_instructions` only.
 * Absent / undefined / null / blank / non-string → do not show.
 * Never derived from special_instructions, notes, or address.
 */
export function getVisibleDeliveryInstructions(
    review: CheckoutReviewOptionalFields
): string | null {
    return optionalTrimmedText(review.delivery_instructions);
}
