/** Optional subscription_id on customer order detail. Display only. */

export type OptionalSubscriptionId = string | number | null | undefined;

export interface OrderDetailOptionalSubscription {
    /** Top-level only; unknown so junk payloads stay typed without inventing. */
    subscription_id?: unknown;
    /** Allowed on payloads / tests; never used to invent a subscription id. */
    order_number?: string | null;
    plan_id?: string | number | null;
    subscription?: { id?: string | number | null; subscription_id?: string | number | null } | null;
}

/**
 * Subscription id from top-level `subscription_id` only.
 * Absent / undefined / null / blank / 0 / non-string-or-number → do not show.
 * Never derived from a nested `subscription` object, `plan_id`, or order number.
 */
export function getVisibleSubscriptionId(order: OrderDetailOptionalSubscription): string | null {
    const raw = order.subscription_id;
    if (typeof raw === 'number') {
        if (!Number.isFinite(raw) || raw === 0) return null;
        return String(raw);
    }
    if (typeof raw !== 'string') return null;
    const trimmed = raw.trim();
    return trimmed ? trimmed : null;
}
