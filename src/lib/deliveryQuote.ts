/**
 * Delivery quote from GET /retailers/<id>/delivery-quote/ (distance tiers,
 * radius, free-delivery threshold). The backend prices orders with the same
 * function, so the checkout preview matches the placed order.
 */

export interface DeliveryQuote {
    deliverable: boolean;
    fee: number;
    distanceKm: number | null;
    reason: string;
    pricing: string;
}

export interface FlatDeliverySettings {
    deliveryCharge: number;
    freeDeliveryThreshold: number;
}

function num(value: unknown): number | null {
    if (value === null || value === undefined || value === '') return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
}

export function parseDeliveryQuote(raw: unknown): DeliveryQuote | null {
    if (!raw || typeof raw !== 'object') return null;
    const r = raw as Record<string, unknown>;
    const fee = num(r.delivery_fee);
    if (typeof r.deliverable !== 'boolean' || fee === null) return null;
    return {
        deliverable: r.deliverable,
        fee,
        distanceKm: num(r.distance_km),
        reason: typeof r.reason === 'string' ? r.reason : '',
        pricing: typeof r.pricing === 'string' ? r.pricing : '',
    };
}

/** The pre-distance rule, used until a quote arrives or when it cannot be fetched. */
export function flatDeliveryFee(settings: FlatDeliverySettings, cartTotal: number): number {
    if (settings.freeDeliveryThreshold > 0 && cartTotal >= settings.freeDeliveryThreshold) return 0;
    return settings.deliveryCharge;
}

/** "3.4 km away" style label, or '' when the distance is unknown. */
export function formatDistanceKm(km: number | null | undefined): string {
    if (km === null || km === undefined || !Number.isFinite(km)) return '';
    return `${km < 10 ? km.toFixed(1) : Math.round(km)} km`;
}
