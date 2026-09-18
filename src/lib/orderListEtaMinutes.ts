/**
 * Top-level order list row `eta_minutes`. Display only.
 * Never invent from delivery_info.estimated_delivery_time, slots, or OE-322 fees.
 */

export type OptionalEtaMinutes = string | number | null | undefined;

export interface OrderListOptionalEta {
    eta_minutes?: OptionalEtaMinutes;
    /** Allowed on payloads / tests; never used to invent ETA. */
    estimated_delivery_time?: string | null;
    delivery_info?: { estimated_delivery_time?: string | null } | null;
    preparation_time_minutes?: OptionalEtaMinutes;
    delivery_fee?: unknown;
    discount_amount?: unknown;
}

function asFiniteNumber(value: unknown): number | null {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : null;
    }
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    const n = Number(trimmed);
    return Number.isFinite(n) ? n : null;
}

/**
 * Present + finite minutes > 0 → `ETA {n} min`.
 * Missing / null / blank / non-numeric / ≤ 0 → hide; never invent.
 */
export function formatVisibleOrderListEtaMinutes(value: unknown): string | null {
    const n = asFiniteNumber(value);
    if (n == null || n <= 0) return null;
    return `ETA ${n} min`;
}

/** Trimmed top-level `eta_minutes` only. */
export function visibleOrderListEtaMinutes(
    order: OrderListOptionalEta | null | undefined
): string | null {
    if (!order) return null;
    return formatVisibleOrderListEtaMinutes(order.eta_minutes);
}
