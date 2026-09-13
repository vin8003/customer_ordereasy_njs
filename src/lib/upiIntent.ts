/** Per-order NPCI UPI intent URI used for the exact-amount QR on order detail (OE-277). */

export interface UpiIntentInput {
    upiId?: string | null;
    /** Retailer / shop display name shown inside the UPI app. */
    shopName?: string | null;
    /** Order total_amount as returned by the API (string or number). */
    amount?: string | number | null;
    orderNumber?: string | null;
    /** Unique transaction reference, see buildTxnRef. */
    txnRef?: string | null;
}

const FALLBACK_SHOP_NAME = 'OrderEasy Merchant';

/**
 * Formats an INR amount to exactly 2 decimals.
 * Returns null when the amount is unusable (non-numeric, non-positive) or carries
 * more than 2 decimals — a bill we cannot represent exactly must not be encoded.
 */
export function formatUpiAmount(amount?: string | number | null): string | null {
    if (amount === null || amount === undefined) return null;

    const raw = String(amount).trim();
    if (!/^\d+(\.\d{1,2})?$/.test(raw)) return null;

    const value = Number(raw);
    if (!Number.isFinite(value) || value <= 0) return null;

    return value.toFixed(2);
}

/**
 * Builds a unique transaction reference for one QR render.
 * Format: `OE{sanitised order number}{base36 timestamp}{4 random base36 chars}`,
 * uppercase alphanumeric, capped at the NPCI 35 character limit.
 */
export function buildTxnRef(orderNumber?: string | null, now: number = Date.now()): string {
    const orderPart = String(orderNumber ?? '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const timePart = now.toString(36).toUpperCase();
    const randomPart = Math.random().toString(36).slice(2, 6).toUpperCase().padEnd(4, '0');
    return `OE${orderPart}${timePart}${randomPart}`.slice(0, 35);
}

/**
 * Builds the NPCI intent URI:
 * `upi://pay?pa={upi_id}&pn={shop_name}&am={X.XX}&cu=INR&tn=OE-{order_number}&tr={txn_ref}`
 * Returns null when the retailer UPI ID, the order number or the amount is unusable,
 * so callers can show an empty state instead of a QR that would not pay correctly.
 */
export function buildUpiIntentUri(input: UpiIntentInput): string | null {
    const upiId = String(input.upiId ?? '').trim();
    const orderNumber = String(input.orderNumber ?? '').trim();
    const amount = formatUpiAmount(input.amount);
    const txnRef = String(input.txnRef ?? '').trim();

    if (!upiId || !orderNumber || !amount || !txnRef) return null;

    const shopName = String(input.shopName ?? '').trim() || FALLBACK_SHOP_NAME;

    const params = [
        `pa=${encodeURIComponent(upiId)}`,
        `pn=${encodeURIComponent(shopName)}`,
        `am=${amount}`,
        'cu=INR',
        `tn=${encodeURIComponent(`OE-${orderNumber}`)}`,
        `tr=${encodeURIComponent(txnRef)}`,
    ];

    return `upi://pay?${params.join('&')}`;
}
