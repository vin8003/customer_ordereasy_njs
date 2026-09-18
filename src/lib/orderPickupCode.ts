/** Optional pickup_code on customer order detail. Display only. */

export type OptionalPickupCode = string | null | undefined;

export interface OrderDetailOptionalPickupCode {
    pickup_code?: OptionalPickupCode;
    /** Allowed on payloads / tests; never used to invent a pickup code. */
    order_number?: string | null;
    pickup_ready_at?: string | null;
    delivery_mode?: string | null;
    delivery_info?: unknown;
    fulfillment_slot_start?: string | null;
}

function optionalTrimmedText(raw: unknown): string | null {
    if (typeof raw !== 'string') return null;
    const trimmed = raw.trim();
    return trimmed ? trimmed : null;
}

/**
 * Pickup code from top-level `pickup_code` only.
 * Absent / undefined / null / blank / non-string → do not show.
 * Never derived from order_number, pickup_ready_at, or delivery_info.
 */
export function getVisiblePickupCode(order: OrderDetailOptionalPickupCode): string | null {
    return optionalTrimmedText(order.pickup_code);
}
