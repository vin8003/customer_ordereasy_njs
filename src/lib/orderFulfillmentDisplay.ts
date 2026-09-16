/** Customer-facing labels and copy for pickup / delivery fulfillment (OE-152, RCP #82). */

import type { OrderDeliveryInfo } from '@/lib/fulfillmentSlots';
// Relative .ts specifier so the node test runner resolves this the same way Next does.
import { DELIVERY_FAILED_LABEL, isDeliveryFailureStatus } from './deliveryFailure.ts';

export interface OrderFulfillmentHighlightFields {
    delivery_mode?: string;
    status: string;
    pickup_code?: string | null;
    pickup_ready_at?: string | null;
    delivery_info?: OrderDeliveryInfo | null;
}

export interface OrderStatusDisplay {
    label: string;
    badgeClass: string;
    bannerClass: string;
}

const TERMINAL_STATUSES = new Set(['delivered', 'cancelled']);

/** Whether list cards should fetch detail for pickup_code / delivery_info. */
export function needsFulfillmentDetailEnrichment(order: {
    delivery_mode?: string;
    status: string;
}): boolean {
    const status = order.status.toLowerCase();
    if (TERMINAL_STATUSES.has(status) || isDeliveryFailureStatus(status)) return false;
    if (order.delivery_mode === 'pickup') return true;
    if (order.delivery_mode === 'delivery') {
        return status === 'packed' || status === 'out_for_delivery';
    }
    return false;
}

/**
 * `deliveryFailed` marks a close-out the backend reports as `cancelled`; callers
 * that have the failure fields resolve it with `isDeliveryFailure` (OE-281).
 */
export function formatOrderStatusLabel(
    status: string,
    deliveryMode?: string,
    deliveryFailed = false
): string {
    const s = status.toLowerCase();
    if (deliveryFailed || isDeliveryFailureStatus(s)) return DELIVERY_FAILED_LABEL;
    switch (s) {
        case 'packed':
            return deliveryMode === 'pickup' ? 'Ready for pickup' : 'Packed — preparing handoff';
        case 'out_for_delivery':
            return 'Out for delivery';
        case 'processing':
            return 'Being prepared';
        case 'confirmed':
            return 'Confirmed';
        case 'waiting_for_customer_approval':
            return 'Needs your approval';
        case 'pending':
            return 'Pending';
        case 'delivered':
            return 'Delivered';
        case 'cancelled':
            return 'Cancelled';
        default:
            return status.replace(/_/g, ' ');
    }
}

export function getOrderStatusDisplay(
    status: string,
    deliveryMode?: string,
    deliveryFailed = false
): OrderStatusDisplay {
    const s = status.toLowerCase();
    const label = formatOrderStatusLabel(status, deliveryMode, deliveryFailed);

    if (deliveryFailed || isDeliveryFailureStatus(s)) {
        return {
            label,
            badgeClass: 'text-rose-700 bg-rose-50 border-rose-200',
            bannerClass: 'bg-rose-100 text-rose-700',
        };
    }
    if (s === 'packed') {
        return deliveryMode === 'pickup'
            ? {
                  label,
                  badgeClass: 'text-emerald-700 bg-emerald-50 border-emerald-200',
                  bannerClass: 'bg-emerald-100 text-emerald-800',
              }
            : {
                  label,
                  badgeClass: 'text-violet-700 bg-violet-50 border-violet-200',
                  bannerClass: 'bg-violet-100 text-violet-800',
              };
    }
    if (s === 'out_for_delivery') {
        return {
            label,
            badgeClass: 'text-sky-700 bg-sky-50 border-sky-200',
            bannerClass: 'bg-sky-100 text-sky-800',
        };
    }
    if (s === 'delivered') {
        return {
            label,
            badgeClass: 'text-green-700 bg-green-50 border-green-200',
            bannerClass: 'bg-green-100 text-green-700',
        };
    }
    if (s === 'cancelled') {
        return {
            label,
            badgeClass: 'text-red-700 bg-red-50 border-red-200',
            bannerClass: 'bg-red-100 text-red-700',
        };
    }
    if (s === 'pending' || s === 'waiting_for_customer_approval') {
        return {
            label,
            badgeClass: 'text-amber-700 bg-amber-50 border-amber-200',
            bannerClass: 'bg-amber-100 text-amber-800',
        };
    }
    return {
        label,
        badgeClass: 'text-blue-700 bg-blue-50 border-blue-200',
        bannerClass: 'bg-blue-100 text-blue-700',
    };
}

export function formatPickupReadyMessage(
    status: string,
    pickupReadyAt?: string | null
): string | null {
    const s = status.toLowerCase();
    if (s !== 'packed') return null;
    if (pickupReadyAt) {
        const when = new Date(pickupReadyAt).toLocaleString([], {
            dateStyle: 'medium',
            timeStyle: 'short',
        });
        return `Ready for pickup since ${when}. Show your code at the counter.`;
    }
    return 'Your order is packed and ready for pickup. Show your code at the counter.';
}

export function formatDeliveryStatusLabel(deliveryStatus?: string | null): string | null {
    if (!deliveryStatus) return null;
    const map: Record<string, string> = {
        assigned: 'Courier assigned',
        picked_up: 'Picked up from store',
        in_transit: 'On the way',
        out_for_delivery: 'Out for delivery',
        delivered: 'Delivered',
    };
    return map[deliveryStatus.toLowerCase()] ?? deliveryStatus.replace(/_/g, ' ');
}

export function formatDeliveryEta(iso?: string | null): string | null {
    if (!iso) return null;
    return new Date(iso).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
}

export function hasPickupCodeHighlight(order: OrderFulfillmentHighlightFields): boolean {
    return order.delivery_mode === 'pickup' && Boolean(order.pickup_code);
}

export function hasDeliveryCourierHighlight(order: OrderFulfillmentHighlightFields): boolean {
    if (order.delivery_mode !== 'delivery' || !order.delivery_info) return false;
    const info = order.delivery_info;
    return Boolean(info.delivery_person_name || info.delivery_person_phone || info.estimated_delivery_time);
}
