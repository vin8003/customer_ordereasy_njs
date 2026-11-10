/**
 * Pure helpers for the map-first shop picker (/retailers): which shops can be
 * plotted, search and filter, list order, and which point the map opens on.
 */

export interface MapRetailer {
    id: number;
    shop_name: string;
    shop_description?: string | null;
    business_type?: string | null;
    city?: string | null;
    state?: string | null;
    latitude?: number | string | null;
    longitude?: number | string | null;
    average_rating?: number | string | null;
    total_ratings?: number | null;
    offers_delivery?: boolean;
    offers_pickup?: boolean;
    shop_image?: string | null;
    distance?: number | null;
    categories?: { name: string }[];
    is_currently_open?: boolean;
    minimum_order_amount?: number | string;
    delivery_charge?: number | string;
    free_delivery_threshold?: number | string;
    delivery_fee_mode?: 'flat' | 'distance';
    delivery_fee_estimate?: string | null;
}

export interface LatLng {
    lat: number;
    lng: number;
}

/** A real pin: finite, in range, and not the 0,0 that empty forms send. */
export function toLatLng(lat: unknown, lng: unknown): LatLng | null {
    if (lat === null || lat === undefined || lat === '' || lng === null || lng === undefined || lng === '') return null;
    const la = Number(lat);
    const ln = Number(lng);
    if (!Number.isFinite(la) || !Number.isFinite(ln)) return null;
    if (la < -90 || la > 90 || ln < -180 || ln > 180) return null;
    if (Math.abs(la) < 1e-6 && Math.abs(ln) < 1e-6) return null;
    return { lat: la, lng: ln };
}

export function retailerPin(r: Pick<MapRetailer, 'latitude' | 'longitude'>): LatLng | null {
    return toLatLng(r.latitude, r.longitude);
}

/** Shops with a pin go on the map; the rest go in the fallback list. */
export function splitByPin<T extends MapRetailer>(retailers: T[]): { pinned: T[]; unpinned: T[] } {
    const pinned: T[] = [];
    const unpinned: T[] = [];
    for (const r of retailers) (retailerPin(r) ? pinned : unpinned).push(r);
    return { pinned, unpinned };
}

export type RetailerFilter = 'open' | 'delivery' | 'pickup' | 'free_delivery' | 'top_rated';

export const RETAILER_FILTERS: { id: RetailerFilter; label: string }[] = [
    { id: 'open', label: 'Open now' },
    { id: 'delivery', label: 'Delivery' },
    { id: 'pickup', label: 'Pickup' },
    { id: 'free_delivery', label: 'Free delivery' },
    { id: 'top_rated', label: 'Rated 4+' },
];

function hasFreeDelivery(r: MapRetailer): boolean {
    if (!r.offers_delivery) return false;
    const estimate = r.delivery_fee_estimate;
    if (estimate !== null && estimate !== undefined && estimate !== '') {
        const n = Number(estimate);
        if (Number.isFinite(n)) return n <= 0;
    }
    if (r.delivery_fee_mode === 'distance') return false;
    const charge = r.delivery_charge;
    if (charge === null || charge === undefined || charge === '') return false;
    return Number(charge) === 0;
}

const FILTER_TESTS: Record<RetailerFilter, (r: MapRetailer) => boolean> = {
    open: (r) => r.is_currently_open === true,
    delivery: (r) => r.offers_delivery === true,
    pickup: (r) => r.offers_pickup === true,
    free_delivery: hasFreeDelivery,
    top_rated: (r) => Number(r.average_rating) >= 4,
};

function searchText(r: MapRetailer): string {
    return [
        r.shop_name,
        r.business_type,
        r.shop_description,
        r.city,
        ...(r.categories || []).map((c) => c.name),
    ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
}

/** Every word of the query must appear somewhere in the shop's name, type, categories or city. */
export function filterRetailers<T extends MapRetailer>(
    retailers: T[],
    query: string,
    filters: Iterable<RetailerFilter> = []
): T[] {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    const active = [...filters];
    return retailers.filter((r) => {
        if (!active.every((f) => FILTER_TESTS[f](r))) return false;
        if (words.length === 0) return true;
        const text = searchText(r);
        return words.every((w) => text.includes(w));
    });
}

/** Nearest first when distances are known; shops without one keep the server order after them. */
export function sortRetailers<T extends MapRetailer>(retailers: T[]): T[] {
    return retailers
        .map((r, i) => ({ r, i }))
        .sort((a, b) => {
            const da = typeof a.r.distance === 'number' && Number.isFinite(a.r.distance) ? a.r.distance : null;
            const db = typeof b.r.distance === 'number' && Number.isFinite(b.r.distance) ? b.r.distance : null;
            if (da !== null && db !== null && da !== db) return da - db;
            if (da !== null && db === null) return -1;
            if (da === null && db !== null) return 1;
            return a.i - b.i;
        })
        .map((x) => x.r);
}

/* ---------- Which point the map opens on ---------- */

export type LocationSource = 'gps' | 'manual' | 'address' | 'pin';

export interface ChosenLocation {
    id: string;
    name: string;
    state: string;
    pincode?: string;
    lat?: number;
    lng?: number;
    address?: string;
    source?: LocationSource;
    /** Saved address this location came from. */
    addressId?: number;
    /** Short name shown in the location bar ("Home", "Pinned location"). */
    label?: string;
    /** Picked by the customer in the location sheet, so it is never replaced automatically. */
    explicit?: boolean;
}

export interface SavedAddress {
    id: number;
    title?: string | null;
    address_type?: string | null;
    address_line1?: string | null;
    address_line2?: string | null;
    landmark?: string | null;
    city: string;
    state: string;
    pincode?: string | null;
    latitude?: number | string | null;
    longitude?: number | string | null;
    is_default?: boolean;
}

function norm(value: string | null | undefined): string {
    return (value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

export function sameCity(a: { name?: string; city?: string }, b: { name?: string; city?: string }): boolean {
    const ca = norm(a.name ?? a.city);
    const cb = norm(b.name ?? b.city);
    return ca !== '' && ca === cb;
}

/** Same slug the app uses for city ids (see config/india-locations cityId). */
function slugCityId(name: string, state: string): string {
    const slug = (s: string) => s.toLowerCase().trim().replace(/\s+/g, '-');
    return `${slug(name)}_${slug(state)}`;
}

export function addressLabel(a: SavedAddress): string {
    const title = (a.title || '').trim();
    if (title) return title;
    const type = (a.address_type || '').trim();
    return type ? type.charAt(0).toUpperCase() + type.slice(1) : 'Address';
}

export function addressLine(a: SavedAddress): string {
    return [a.address_line1, a.address_line2, a.landmark, a.city].map((p) => (p || '').trim()).filter(Boolean).join(', ');
}

export function addressToLocation(a: SavedAddress, explicit: boolean, cityIdFor = slugCityId): ChosenLocation {
    const pin = toLatLng(a.latitude, a.longitude);
    return {
        id: cityIdFor(a.city, a.state),
        name: a.city,
        state: a.state,
        pincode: a.pincode || undefined,
        ...(pin ? { lat: pin.lat, lng: pin.lng } : {}),
        address: addressLine(a),
        source: 'address',
        addressId: a.id,
        label: addressLabel(a),
        explicit,
    };
}

/**
 * The location the shop map should use when the screen opens.
 *
 * 1. Whatever the customer picked in the location sheet stays (a picked saved
 *    address is refreshed from the address book, and dropped if it was deleted).
 * 2. Otherwise the default saved address (or, with no default, the first one
 *    that has a pin) when it has a pin. A city the customer typed by hand wins
 *    over an address in a different city: they are browsing somewhere else.
 * 3. Otherwise the stored location as it is (GPS from the welcome screen, or
 *    a city with no pin).
 */
export function resolveStartLocation(
    stored: ChosenLocation,
    addresses: SavedAddress[],
    cityIdFor = slugCityId
): ChosenLocation {
    if (stored.source === 'address' && stored.addressId != null) {
        const current = addresses.find((a) => a.id === stored.addressId);
        if (current) return addressToLocation(current, stored.explicit === true, cityIdFor);
        if (addresses.length > 0 || stored.explicit !== true) {
            // The address is gone (or was only auto-picked): fall through to the rules below.
            stored = { id: stored.id, name: stored.name, state: stored.state, pincode: stored.pincode, source: 'manual' };
        } else {
            return stored;
        }
    } else if (stored.explicit === true) {
        return stored;
    }

    const withPin = addresses.filter((a) => toLatLng(a.latitude, a.longitude));
    const preferred = withPin.find((a) => a.is_default) || withPin[0];
    if (preferred) {
        const typedCity = stored.source !== 'gps' && toLatLng(stored.lat, stored.lng) === null;
        if (!typedCity || sameCity(stored, preferred)) {
            return addressToLocation(preferred, false, cityIdFor);
        }
    }
    return stored;
}

/** One-line text for the location bar. */
export function locationSummary(loc: ChosenLocation | null): { title: string; detail: string } {
    if (!loc) return { title: 'Select location', detail: '' };
    const place = loc.pincode ? `${loc.name} ${loc.pincode}` : `${loc.name}, ${loc.state}`;
    if (loc.source === 'address') return { title: loc.label || 'Saved address', detail: loc.address || place };
    if (loc.source === 'pin') return { title: loc.label || 'Pinned location', detail: loc.address || place };
    if (loc.source === 'gps' && toLatLng(loc.lat, loc.lng)) return { title: 'Current location', detail: loc.address || place };
    return { title: loc.name, detail: loc.pincode ? `${loc.state} ${loc.pincode}` : loc.state };
}

/* ---------- Map maths ---------- */

/**
 * The point to centre the map on so that `target` lands `dx`/`dy` screen pixels
 * away from the map centre (Web Mercator). Used to keep a selected shop clear
 * of the bottom sheet.
 */
export function offsetCenter(target: LatLng, dxPx: number, dyPx: number, zoom: number): LatLng {
    const scale = 256 * Math.pow(2, zoom);
    const x = ((target.lng + 180) / 360) * scale;
    const sin = Math.sin((target.lat * Math.PI) / 180);
    const y = (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale;
    const cx = x - dxPx;
    const cy = y - dyPx;
    const lng = (cx / scale) * 360 - 180;
    const n = Math.PI - (2 * Math.PI * cy) / scale;
    const lat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
    return { lat, lng };
}

export type SheetSnap = 'peek' | 'mid' | 'full';

/** Snap to rest on after a drag: a quick flick moves one step, otherwise the nearest height wins. */
export function pickSnap(
    visibleHeight: number,
    velocity: number,
    heights: Record<SheetSnap, number>,
    from: SheetSnap
): SheetSnap {
    const order: SheetSnap[] = ['peek', 'mid', 'full'];
    if (Math.abs(velocity) > 0.5) {
        const i = order.indexOf(from);
        // velocity > 0 means the finger is moving down (sheet shrinking).
        const next = velocity > 0 ? Math.max(0, i - 1) : Math.min(order.length - 1, i + 1);
        return order[next];
    }
    let best: SheetSnap = from;
    let bestGap = Infinity;
    for (const s of order) {
        const gap = Math.abs(heights[s] - visibleHeight);
        if (gap < bestGap) {
            bestGap = gap;
            best = s;
        }
    }
    return best;
}
