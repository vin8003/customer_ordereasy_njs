/** Optional estimated_delivery date on customer order list. Display only. */

export type OptionalEstimatedDelivery = string | null | undefined;

export interface OrderListEstimatedDeliveryFields {
    estimated_delivery?: OptionalEstimatedDelivery;
    /** Allowed on payloads / tests; never used to invent a date. */
    estimated_delivery_time?: OptionalEstimatedDelivery;
    fulfillment_slot_start?: OptionalEstimatedDelivery;
    fulfillment_slot_end?: OptionalEstimatedDelivery;
    created_at?: OptionalEstimatedDelivery;
    delivery_info?: { estimated_delivery_time?: OptionalEstimatedDelivery } | null;
}

/** Calendar YYYY-MM-DD at the start of a date or ISO datetime. */
const LEADING_CALENDAR_DATE = /^(\d{4})-(\d{2})-(\d{2})(?:$|[T\s])/;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function parseCalendarDateParts(raw: unknown): { year: number; month: number; day: number } | null {
    if (typeof raw !== 'string') return null;
    const trimmed = raw.trim();
    if (!trimmed) return null;

    const match = LEADING_CALENDAR_DATE.exec(trimmed);
    if (!match) return null;

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const parsed = new Date(year, month - 1, day);
    if (
        parsed.getFullYear() !== year ||
        parsed.getMonth() !== month - 1 ||
        parsed.getDate() !== day
    ) {
        return null;
    }
    return { year, month, day };
}

function formatDateLabel(parts: { year: number; month: number; day: number }): string {
    return `${parts.day} ${MONTHS[parts.month - 1]} ${parts.year}`;
}

/**
 * Date label from top-level `estimated_delivery` only.
 * Uses the calendar YYYY-MM-DD in the payload — never a timezone-shifted Date.
 * Absent / null / blank / non-string / unparseable / overflow → do not show.
 */
export function formatVisibleEstimatedDelivery(value: unknown): string | null {
    const parts = parseCalendarDateParts(value);
    return parts ? formatDateLabel(parts) : null;
}

/**
 * List-card date from `estimated_delivery` only.
 * Never derived from courier ETA, slot windows, or created_at.
 */
export function getVisibleEstimatedDeliveryDate(
    order: OrderListEstimatedDeliveryFields
): string | null {
    return formatVisibleEstimatedDelivery(order.estimated_delivery);
}
