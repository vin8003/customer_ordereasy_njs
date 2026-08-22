import type { PlottableRetailer, RetailerSummary } from '@/types/retailer';

export interface LatLng {
    lat: number;
    lng: number;
}

const EARTH_RADIUS_KM = 6371;

/** Parse DRF decimal strings; reject the 0/0 null island so it never becomes a pin. */
export function toCoord(value: string | number | null | undefined): number | null {
    if (value === null || value === undefined || value === '') return null;
    const parsed = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(parsed) ? parsed : null;
}

export function getRetailerLatLng(retailer: RetailerSummary): LatLng | null {
    const lat = toCoord(retailer.latitude);
    const lng = toCoord(retailer.longitude);
    if (lat === null || lng === null) return null;
    if (lat === 0 && lng === 0) return null;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
    return { lat, lng };
}

export function haversineKm(from: LatLng, to: LatLng): number {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const dLat = toRad(to.lat - from.lat);
    const dLng = toRad(to.lng - from.lng);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.sin(dLng / 2) ** 2;
    return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)));
}

/** Parse API `distance` the same way as lat/lng (JSON number or a Decimal string). */
export function toDistance(value: string | number | null | undefined): number | null {
    return toCoord(value);
}

export function formatDistance(km: string | number | null | undefined): string | null {
    const parsed = toDistance(km);
    if (parsed === null) return null;
    if (parsed < 1) return `${Math.max(10, Math.round((parsed * 1000) / 10) * 10)} m`;
    if (parsed < 10) return `${parsed.toFixed(1)} km`;
    return `${Math.round(parsed)} km`;
}

/**
 * Split the API list into what the map can plot and what it cannot, filling in
 * distance from the customer when the backend did not send one.
 */
export function partitionByLocation(
    retailers: RetailerSummary[],
    center: LatLng | null
): { located: PlottableRetailer[]; unlocated: RetailerSummary[] } {
    const located: PlottableRetailer[] = [];
    const unlocated: RetailerSummary[] = [];

    retailers.forEach((retailer) => {
        const coords = getRetailerLatLng(retailer);
        if (!coords) {
            // Keep API distance (radius-filtered lists can still send it without pins).
            unlocated.push({ ...retailer, distance: toDistance(retailer.distance) });
            return;
        }
        located.push({
            ...retailer,
            ...coords,
            distance: center ? haversineKm(center, coords) : toDistance(retailer.distance),
        });
    });

    return { located, unlocated };
}

/** Nearest first. Shops with no distance sink to the bottom. */
export function sortByDistance<T extends RetailerSummary>(retailers: T[]): T[] {
    return [...retailers].sort((a, b) => {
        const aDist = toDistance(a.distance);
        const bDist = toDistance(b.distance);
        if (aDist === null && bDist === null) return a.shop_name.localeCompare(b.shop_name);
        if (aDist === null) return 1;
        if (bDist === null) return -1;
        if (aDist === bDist) return a.shop_name.localeCompare(b.shop_name);
        return aDist - bDist;
    });
}

/**
 * Zoom that keeps the customer centred while still showing the nearest stores.
 * We never fit bounds to every pin — that would push the customer off-centre.
 */
export function zoomForNearest(distancesKm: number[]): number {
    const usable = distancesKm.filter((d) => Number.isFinite(d) && d > 0).sort((a, b) => a - b);
    if (usable.length === 0) return 13;
    const reference = usable[Math.min(2, usable.length - 1)];
    if (reference <= 1) return 15;
    if (reference <= 3) return 14;
    if (reference <= 8) return 13;
    if (reference <= 20) return 11;
    return 10;
}
