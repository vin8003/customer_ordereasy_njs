/**
 * Optional delivery_fee / discount_amount on the customer order list (OE-322).
 * Display only amounts the list payload already sent. Never invent values.
 */

export type OptionalOrderMoneyField = string | number | null | undefined;

export interface OrderListMoneyFields {
    delivery_fee?: OptionalOrderMoneyField;
    discount_amount?: OptionalOrderMoneyField;
    /** Ignored — listed so callers can pass a list row without inventing fees. */
    total_amount?: OptionalOrderMoneyField;
}

export type OrderListMoneyLineKey = 'delivery_fee' | 'discount_amount';

export interface OrderListMoneyLine {
    key: OrderListMoneyLineKey;
    label: string;
    amountDisplay: string;
}

const EXACT_DECIMAL = /^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/;

function parseExactFiniteNumber(
    value: OptionalOrderMoneyField
): { n: number; source: string } | null {
    if (value == null) return null;
    if (typeof value === 'number') {
        if (!Number.isFinite(value)) return null;
        return { n: value, source: String(value) };
    }
    if (typeof value !== 'string') return null;
    const source = value.trim();
    if (source === '' || !EXACT_DECIMAL.test(source)) return null;
    const n = Number(source);
    if (!Number.isFinite(n)) return null;
    return { n, source };
}

/** True when the BE sent a finite numeric amount that is not 0. */
export function isPresentNonZeroAmount(value: OptionalOrderMoneyField): boolean {
    const parsed = parseExactFiniteNumber(value);
    return parsed !== null && parsed.n !== 0;
}

function rupeeAmount(source: string): string {
    return `₹${source.replace(/^[+-]/, '')}`;
}

function formatDeliveryFeeDisplay(source: string): string {
    return rupeeAmount(source);
}

function formatDiscountDisplay(source: string): string {
    return `-${rupeeAmount(source)}`;
}

export function getOrderListMoneyLines(order: OrderListMoneyFields): OrderListMoneyLine[] {
    const lines: OrderListMoneyLine[] = [];

    const delivery = parseExactFiniteNumber(order.delivery_fee);
    if (delivery && delivery.n !== 0) {
        lines.push({
            key: 'delivery_fee',
            label: 'Delivery Fee',
            amountDisplay: formatDeliveryFeeDisplay(delivery.source),
        });
    }

    const discount = parseExactFiniteNumber(order.discount_amount);
    if (discount && discount.n !== 0) {
        lines.push({
            key: 'discount_amount',
            label: 'Discount',
            amountDisplay: formatDiscountDisplay(discount.source),
        });
    }

    return lines;
}
