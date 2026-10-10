/**
 * Failed-delivery detection for customer order views (OE-281 AC4).
 *
 * The retailer shop close-out has no dedicated order status: the backend order
 * status choices stop at `cancelled`, so a failed delivery arrives as
 * `cancelled` plus a failure signal. Every field read here is already on the
 * customer order payload — `cancellation_reason` and `cancelled_by` on the
 * order, and `delivery_info.delivery_status`, which already has a `failed`
 * choice. Explicit failed statuses are tolerated so the customer view keeps
 * working if the close-out write path later adds one.
 */

export interface DeliveryFailureFields {
    status: string;
    delivery_mode?: string | null;
    cancelled_by?: string | null;
    cancellation_reason?: string | null;
    delivery_info?: { delivery_status?: string | null } | null;
}

export const DELIVERY_FAILED_LABEL = 'Delivery failed';

const FAILED_ORDER_STATUSES = new Set([
    'delivery_failed',
    'delivery_failure',
    'failed_delivery',
    'mark_failed',
    'failed',
]);

/** Close-out phrases the retailer writes into the free-text `cancellation_reason`. */
const FAILURE_REASON_MARKERS = [
    'delivery failed',
    'failed delivery',
    'delivery failure',
    'mark failed',
    'undelivered',
];

function normalize(value?: string | null): string {
    return (value || '').trim().toLowerCase();
}

/** Collapse separators so `delivery_failed` and "Delivery-Failed" both match a marker. */
function normalizeReason(reason?: string | null): string {
    return normalize(reason)
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
}

export function isDeliveryFailureStatus(status?: string | null): boolean {
    return FAILED_ORDER_STATUSES.has(normalize(status));
}

export function hasDeliveryFailureReason(reason?: string | null): boolean {
    const normalized = normalizeReason(reason);
    if (!normalized) return false;
    return FAILURE_REASON_MARKERS.some((marker) => normalized.includes(marker));
}

/**
 * Whether a terminal order should read as "Delivery failed" rather than a
 * generic "Cancelled". Pickup orders are never treated as failed deliveries.
 */
export function isDeliveryFailure(order: DeliveryFailureFields): boolean {
    if (normalize(order.delivery_mode) === 'pickup') return false;
    if (isDeliveryFailureStatus(order.status)) return true;

    // Beyond an explicit status, only a terminal close-out can be a failed delivery.
    if (normalize(order.status) !== 'cancelled') return false;
    // A cancellation the customer asked for stays a plain "Cancelled".
    if (normalize(order.cancelled_by) === 'customer') return false;

    if (normalize(order.delivery_info?.delivery_status) === 'failed') return true;
    return hasDeliveryFailureReason(order.cancellation_reason);
}
