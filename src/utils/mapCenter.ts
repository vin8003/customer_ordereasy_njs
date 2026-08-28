import { apiService } from '@/services/api';
import { toCoord, type LatLng } from '@/utils/geo';
import { geocodeCityCenter, getPersistedLocation } from '@/utils/location';
import type { City } from '@/config/cities';

export type CenterSource = 'address' | 'gps' | 'city';

export interface MapCenter extends LatLng {
    source: CenterSource;
    /** Short human label for the location chip, e.g. "Home" or "Current location". */
    label: string;
    /** Set when the centre came from a saved delivery address. */
    addressId?: number;
}

export interface SavedAddress {
    id: number;
    title?: string;
    address_type?: string;
    address_line1?: string;
    address_line2?: string;
    landmark?: string;
    city?: string;
    state?: string;
    pincode?: string;
    latitude?: string | number | null;
    longitude?: string | number | null;
    is_default?: boolean;
    full_address?: string;
}

export function addressLabel(address: SavedAddress): string {
    return address.title || address.address_type || address.address_line1 || 'Saved address';
}

export function addressToCenter(address: SavedAddress): MapCenter | null {
    const lat = toCoord(address.latitude);
    const lng = toCoord(address.longitude);
    if (lat === null || lng === null) return null;
    return { lat, lng, source: 'address', label: addressLabel(address), addressId: address.id };
}

/**
 * The default address wins, then any saved address with coordinates.
 * The API already orders by `-is_default`, but we read the flag rather than
 * trusting position.
 */
export function pickDefaultAddress(addresses: SavedAddress[]): SavedAddress | null {
    const withCoords = addresses.filter((a) => addressToCenter(a) !== null);
    if (withCoords.length === 0) return null;
    return withCoords.find((a) => a.is_default) ?? withCoords[0];
}

export async function loadSavedAddresses(): Promise<SavedAddress[]> {
    if (!apiService.isAuthenticated()) return [];
    try {
        const data = await apiService.getAddresses();
        return Array.isArray(data) ? (data as SavedAddress[]) : [];
    } catch (error) {
        console.error('Could not load saved addresses', error);
        return [];
    }
}

/** Centre of a city the customer picked explicitly. */
export async function cityCenter(city: City | null): Promise<MapCenter | null> {
    if (!city?.name || !city?.state) return null;
    const geocoded = await geocodeCityCenter(city.name, city.state);
    if (!geocoded) return null;
    return { ...geocoded, source: 'city', label: city.name };
}

function sameCity(a?: string | null, b?: string | null): boolean {
    if (!a || !b) return false;
    return a.trim().toLowerCase() === b.trim().toLowerCase();
}

/**
 * Where to put the customer marker: their default delivery address, else the
 * last GPS fix we persisted, else the centre of the city they are browsing.
 *
 * Candidates from another city are skipped — the marker has to sit among the
 * stores we just fetched, otherwise every distance reads as hundreds of km.
 */
export async function resolveMapCenter(
    city: City | null,
    addresses?: SavedAddress[]
): Promise<MapCenter | null> {
    const saved = addresses ?? (await loadSavedAddresses());
    const persisted = getPersistedLocation();
    const inCity = city ? saved.filter((a) => sameCity(a.city, city.name)) : saved;

    // An address the customer picked themselves outranks their default one.
    const chosen = inCity.find((a) => a.id === persisted?.addressId);
    const preferred = chosen ?? pickDefaultAddress(inCity);
    if (preferred) {
        const center = addressToCenter(preferred);
        if (center) return center;
    }

    const lat = toCoord(persisted?.lat);
    const lng = toCoord(persisted?.lng);
    if (lat !== null && lng !== null && (!city || sameCity(persisted?.name, city.name))) {
        return {
            lat,
            lng,
            source: persisted?.source === 'gps' ? 'gps' : 'city',
            label: persisted?.source === 'gps' ? 'Current location' : persisted?.name ?? city?.name ?? 'Selected area',
        };
    }

    return cityCenter(city);
}
