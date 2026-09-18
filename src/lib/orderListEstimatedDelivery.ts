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

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function parseEstimatedDeliveryDate(raw: unknown): Date | null {
    if (typeof raw !== 'string') return null;
    const trimmed = raw.trim();
    if (!trimmed) return null;

    const dateOnly = DATE_ONLY.exec(trimmed);
    if (dateOnly) {
        const year = Number(dateOnly[1]);
        const month = Number(dateOnly[2]);
        const day = Number(dateOnly[3]);
        const parsed = new Date(year, month - 1, day);
        if (
            parsed.getFullYear() !== year ||
            parsed.getMonth() !== month - 1 ||
            parsed.getDate() !== day
        ) {
            return null;
        }
        return parsed;
    }

    const parsed = new Date(trimmed);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed;
}

function formatDateLabel(date: Date): string {
    return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

/**
 * Date label from top-level `estimated_delivery` only.
 * Absent / null / blank / non-string / unparseable → do not show.
 */
export function formatVisibleEstimatedDelivery(value: unknown): string | null {
    const date = parseEstimatedDeliveryDate(value);
    return date ? formatDateLabel(date) : null;
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
