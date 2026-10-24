/**
 * Query for GET /retailers/ on the shop list.
 *
 * With the customer's GPS pin the backend lists each pinned shop whose delivery
 * radius covers them (any city), and falls back to city/pincode only for shops
 * that have no pin. Without a pin it is the plain city listing, as before.
 */

export interface DiscoveryLocation {
    name: string;
    state: string;
    pincode?: string;
    lat?: number;
    lng?: number;
}

function usableCoordinate(lat: unknown, lng: unknown): lat is number {
    if (typeof lat !== 'number' || typeof lng !== 'number') return false;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
    if (Math.abs(lat) < 1e-6 && Math.abs(lng) < 1e-6) return false;
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

export function buildRetailerDiscoveryParams(loc: DiscoveryLocation): Record<string, string> {
    const params: Record<string, string> = {
        city: loc.name,
        state: loc.state,
    };
    if (usableCoordinate(loc.lat, loc.lng)) {
        params.lat = String(loc.lat);
        params.lng = String(loc.lng);
        if (loc.pincode && /^\d{6}$/.test(loc.pincode)) params.user_pincode = loc.pincode;
    }
    return params;
}

/** Chip text for the delivery fee on a shop card, or null to show none. */
export function deliveryFeeChip(retailer: {
    delivery_fee_estimate?: string | number | null;
    delivery_fee_mode?: string | null;
}): string | null {
    const estimate = retailer.delivery_fee_estimate;
    if (estimate !== null && estimate !== undefined && estimate !== '') {
        const n = Number(estimate);
        if (Number.isFinite(n)) {
            if (n <= 0) return 'Free delivery';
            return `Delivery ₹${n % 1 === 0 ? n : n.toFixed(2)}`;
        }
    }
    if (retailer.delivery_fee_mode === 'distance') return 'Delivery fee by distance';
    return null;
}
