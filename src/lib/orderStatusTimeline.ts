/** Customer order-detail status timeline (OE-280). Uses fields already on the detail payload. */

export type OrderTimelineStepKey = 'placed' | 'packed' | 'out_for_delivery' | 'delivered';

export interface OrderTimelineStep {
    key: OrderTimelineStepKey;
    label: string;
    reached: boolean;
    current: boolean;
    at: string | null;
}

export interface OrderStatusLogEntry {
    status?: string | null;
    to_status?: string | null;
    new_status?: string | null;
    created_at?: string | null;
    timestamp?: string | null;
    changed_at?: string | null;
}

export interface OrderStatusTimelineInput {
    status: string;
    delivery_mode?: string | null;
    created_at?: string | null;
    pickup_ready_at?: string | null;
    packed_at?: string | null;
    out_for_delivery_at?: string | null;
    delivered_at?: string | null;
    delivery_info?: { actual_delivery_time?: string | null } | null;
    status_logs?: OrderStatusLogEntry[] | null;
}

const DELIVERY_STEPS: { key: OrderTimelineStepKey; label: string }[] = [
    { key: 'placed', label: 'Placed' },
    { key: 'packed', label: 'Packed' },
    { key: 'out_for_delivery', label: 'Out for delivery' },
    { key: 'delivered', label: 'Delivered' },
];

const PICKUP_STEPS: { key: OrderTimelineStepKey; label: string }[] = [
    { key: 'placed', label: 'Placed' },
    { key: 'packed', label: 'Ready for pickup' },
    { key: 'delivered', label: 'Collected' },
];

function isPickup(deliveryMode?: string | null): boolean {
    return (deliveryMode || '').toLowerCase() === 'pickup';
}

function normalizeStatus(status?: string | null): string {
    return (status || '').toLowerCase();
}

function logStatus(entry: OrderStatusLogEntry): string {
    return normalizeStatus(entry.status || entry.to_status || entry.new_status);
}

function logTimestamp(entry: OrderStatusLogEntry): string | null {
    return entry.created_at || entry.timestamp || entry.changed_at || null;
}

/** Map an order/log status onto a timeline step (pickup has no OFD step). */
function statusToStepKey(status: string, pickup: boolean): OrderTimelineStepKey | null {
    switch (normalizeStatus(status)) {
        case 'pending':
        case 'waiting_for_customer_approval':
        case 'confirmed':
        case 'processing':
            return 'placed';
        case 'packed':
            return 'packed';
        case 'out_for_delivery':
            return pickup ? 'packed' : 'out_for_delivery';
        case 'delivered':
            return 'delivered';
        default:
            return null;
    }
}

function timestampsFromLogs(logs: OrderStatusLogEntry[] | null | undefined, pickup: boolean): Partial<Record<OrderTimelineStepKey, string>> {
    const out: Partial<Record<OrderTimelineStepKey, string>> = {};
    if (!logs) return out;
    for (const entry of logs) {
        const key = statusToStepKey(logStatus(entry), pickup);
        const at = logTimestamp(entry);
        if (key && at && !out[key]) out[key] = at;
    }
    return out;
}

function furthestReachedIndex(
    status: string,
    steps: { key: OrderTimelineStepKey }[],
    pickup: boolean,
    logs: OrderStatusLogEntry[] | null | undefined
): number {
    const placedIndex = 0;
    const s = normalizeStatus(status);

    if (s === 'cancelled') {
        let max = placedIndex;
        if (logs) {
            for (const entry of logs) {
                const key = statusToStepKey(logStatus(entry), pickup);
                if (!key) continue;
                const idx = steps.findIndex((step) => step.key === key);
                if (idx > max) max = idx;
            }
        }
        return max;
    }

    const key = statusToStepKey(s, pickup) ?? 'placed';
    const idx = steps.findIndex((step) => step.key === key);
    return idx < 0 ? placedIndex : idx;
}

function timestampForStep(
    key: OrderTimelineStepKey,
    order: OrderStatusTimelineInput,
    fromLogs: Partial<Record<OrderTimelineStepKey, string>>
): string | null {
    if (key === 'placed') return order.created_at || fromLogs.placed || null;
    if (key === 'packed') return order.pickup_ready_at || order.packed_at || fromLogs.packed || null;
    if (key === 'out_for_delivery') return order.out_for_delivery_at || fromLogs.out_for_delivery || null;
    return order.delivered_at || order.delivery_info?.actual_delivery_time || fromLogs.delivered || null;
}

export function buildOrderStatusTimeline(order: OrderStatusTimelineInput): OrderTimelineStep[] {
    const pickup = isPickup(order.delivery_mode);
    const defs = pickup ? PICKUP_STEPS : DELIVERY_STEPS;
    const fromLogs = timestampsFromLogs(order.status_logs, pickup);
    const reachedIndex = furthestReachedIndex(order.status, defs, pickup, order.status_logs);
    const cancelled = normalizeStatus(order.status) === 'cancelled';

    return defs.map((def, index) => {
        const reached = index <= reachedIndex;
        return {
            key: def.key,
            label: def.label,
            reached,
            current: !cancelled && index === reachedIndex,
            at: reached ? timestampForStep(def.key, order, fromLogs) : null,
        };
    });
}
