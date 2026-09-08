/** Helpers for RCP fulfillment-slot API (OE-240 / OE-243). */

export interface FulfillmentSlot {
    slot_start: string;
    slot_end: string;
    slot_start_local: string;
    slot_end_local: string;
    timezone: string;
    capacity: number;
    booked: number;
    remaining: number;
    is_available: boolean;
}

export interface FulfillmentSlotsResponse {
    retailer_id: number;
    delivery_mode: 'pickup' | 'delivery';
    slot_capacity: number;
    timezone: string;
    slots: FulfillmentSlot[];
}

/** Format a slot window for display (uses local ISO from API). */
export function formatSlotWindow(slot: FulfillmentSlot): string {
    const start = new Date(slot.slot_start_local);
    const end = new Date(slot.slot_end_local);
    const dateOpts: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' };
    const timeOpts: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', hour12: true };
    const datePart = start.toLocaleDateString(undefined, dateOpts);
    const startTime = start.toLocaleTimeString(undefined, timeOpts);
    const endTime = end.toLocaleTimeString(undefined, timeOpts);
    return `${datePart}, ${startTime} – ${endTime}`;
}

export function formatSlotTimeOnly(isoLocal: string): string {
    return new Date(isoLocal).toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    });
}

export function groupSlotsByDay(slots: FulfillmentSlot[]): Map<string, FulfillmentSlot[]> {
    const groups = new Map<string, FulfillmentSlot[]>();
    for (const slot of slots) {
        if (!slot.is_available) continue;
        const dayKey = slot.slot_start_local.slice(0, 10);
        const list = groups.get(dayKey) ?? [];
        list.push(slot);
        groups.set(dayKey, list);
    }
    return groups;
}

export function dayLabel(dayKey: string): string {
    const d = new Date(dayKey + 'T12:00:00');
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
}

/** Order statuses where customer can reschedule a booked slot. */
export const RESCHEDULABLE_ORDER_STATUSES = new Set([
    'pending',
    'waiting_for_customer_approval',
    'confirmed',
    'processing',
    'packed',
    'out_for_delivery',
]);
