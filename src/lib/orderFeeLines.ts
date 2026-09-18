/** Optional delivery/discount lines on customer order detail (OE-311). Display only. */

export type OptionalMoneyAmount = string | number | null | undefined;

export type OrderFeeLineKey = 'delivery_fee' | 'discount_amount';

export interface VisibleOrderFeeLine {
    key: OrderFeeLineKey;
    label: string;
    /** Trimmed API amount; no currency prefix and no invented sign. */
    amount: string;
    isDiscount: boolean;
}

export interface OrderDetailOptionalFees {
    delivery_fee?: OptionalMoneyAmount;
    discount_amount?: OptionalMoneyAmount;
}

function asTrimmedString(value: unknown): string | null {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? String(value) : null;
    }
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
}

/** Finite number when the API sent a parseable amount; otherwise null (do not invent). */
export function parseOptionalMoneyAmount(value: unknown): number | null {
    const raw = asTrimmedString(value);
    if (raw == null) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
}

/** True when the field is present and a number other than 0. */
export function isVisibleOptionalMoneyAmount(value: unknown): boolean {
    const n = parseOptionalMoneyAmount(value);
    return n != null && n !== 0;
}

/** Trimmed amount for display, or null when the line must stay hidden. */
export function formatVisibleOptionalMoneyAmount(value: unknown): string | null {
    if (!isVisibleOptionalMoneyAmount(value)) return null;
    return asTrimmedString(value);
}

const FEE_LINE_SPECS: ReadonlyArray<{
    key: OrderFeeLineKey;
    label: string;
    isDiscount: boolean;
}> = [
    { key: 'delivery_fee', label: 'Delivery Fee', isDiscount: false },
    { key: 'discount_amount', label: 'Discount', isDiscount: true },
];

/** Compact fee/discount rows to render near the order-detail total. */
export function getVisibleOrderFeeLines(
    fees: OrderDetailOptionalFees
): VisibleOrderFeeLine[] {
    const lines: VisibleOrderFeeLine[] = [];
    for (const spec of FEE_LINE_SPECS) {
        const amount = formatVisibleOptionalMoneyAmount(fees[spec.key]);
        if (amount == null) continue;
        lines.push({
            key: spec.key,
            label: spec.label,
            amount,
            isDiscount: spec.isDiscount,
        });
    }
    return lines;
}
