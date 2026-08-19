import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';
import { AVAILABLE_CITIES, City } from '@/config/cities';

export const STORAGE_CITY = 'selected_city';
export const STORAGE_PINCODE = 'selected_pincode';

export interface StoredLocation extends City {
    lat?: number;
    lng?: number;
    address?: string;
    source?: 'gps' | 'manual';
}

export interface GeoAddress {
    address: string;
    pincode: string;
    city: string;
    state: string;
}

export function getPersistedLocation(): StoredLocation | null {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(STORAGE_CITY);
    if (!raw) return null;
    try {
        const parsed = JSON.parse(raw);
        if (!parsed || !parsed.name) return null;
        return parsed as StoredLocation;
    } catch {
        return null;
    }
}

export function hasConfirmedLocation(): boolean {
    const loc = getPersistedLocation();
    if (!loc) return false;
    if (loc.source === 'gps' || loc.source === 'manual') return true;
    return !!(loc.lat && loc.lng);
}

export function persistLocation(loc: StoredLocation) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_CITY, JSON.stringify(loc));
    if (loc.pincode) {
        localStorage.setItem(STORAGE_PINCODE, loc.pincode);
    }
    window.dispatchEvent(new Event('storage'));
}

export function persistManualCity(city: City) {
    persistLocation({ ...city, source: 'manual' });
}

/** Same native/web GPS path as MapPicker (Capacitor Geolocation / navigator.geolocation). */
export async function requestCurrentPosition(): Promise<{ lat: number; lng: number } | null> {
    try {
        if (Capacitor.isNativePlatform()) {
            let permStatus = await Geolocation.checkPermissions();
            if (permStatus.location !== 'granted') {
                permStatus = await Geolocation.requestPermissions();
            }
            if (permStatus.location !== 'granted') return null;
            const position = await Geolocation.getCurrentPosition();
            return {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
            };
        }

        if (!navigator.geolocation) return null;

        return await new Promise((resolve) => {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    });
                },
                () => resolve(null),
                { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
            );
        });
    } catch (e) {
        console.warn('Geolocation failed or denied.', e);
        return null;
    }
}

export function matchAvailableCity(city?: string, state?: string): City | null {
    const normalize = (s: string) => s?.toLowerCase().trim() || '';
    const nCity = normalize(city || '');
    const nState = normalize(state || '');
    if (!nCity) return null;

    return AVAILABLE_CITIES.find((c) => {
        const cName = normalize(c.name);
        const cState = normalize(c.state);
        const cityMatch = cName === nCity || cName.startsWith(nCity) || nCity.startsWith(cName);
        const stateMatch = !nState || cState === nState || cState.startsWith(nState) || nState.startsWith(cState);
        return cityMatch && stateMatch;
    }) || null;
}

function extractAddress(result: google.maps.GeocoderResult): GeoAddress {
    let pincode = '';
    let city = '';
    let state = '';
    result.address_components.forEach((comp) => {
        if (comp.types.includes('postal_code')) pincode = comp.long_name;
        if (comp.types.includes('locality')) city = comp.long_name;
        if (comp.types.includes('administrative_area_level_1')) state = comp.long_name;
    });
    return {
        address: result.formatted_address,
        pincode,
        city,
        state,
    };
}

function loadGoogleMaps(): Promise<boolean> {
    if (typeof window === 'undefined') return Promise.resolve(false);
    if (typeof google !== 'undefined' && google.maps && google.maps.Geocoder) {
        return Promise.resolve(true);
    }

    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
    if (!key) return Promise.resolve(false);

    return new Promise((resolve) => {
        const existing = document.getElementById('google-map-script') as HTMLScriptElement | null;
        if (existing) {
            if (typeof google !== 'undefined' && google.maps && google.maps.Geocoder) {
                resolve(true);
                return;
            }
            existing.addEventListener('load', () => resolve(true), { once: true });
            existing.addEventListener('error', () => resolve(false), { once: true });
            return;
        }

        const script = document.createElement('script');
        script.id = 'google-map-script';
        script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`;
        script.async = true;
        script.defer = true;
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.head.appendChild(script);
    });
}

/** Reverse-geocode the same way MapPicker does (Google Geocoder + address_components). */
export async function reverseGeocode(lat: number, lng: number): Promise<GeoAddress | null> {
    const loaded = await loadGoogleMaps();
    if (!loaded || typeof google === 'undefined' || !google.maps) return null;
    try {
        const geocoder = new google.maps.Geocoder();
        const response = await geocoder.geocode({ location: { lat, lng } });
        if (response.results[0]) {
            return extractAddress(response.results[0]);
        }
    } catch (error) {
        console.error('Geocoding failed', error);
    }
    return null;
}

export function buildStoredLocation(
    lat: number,
    lng: number,
    geo?: GeoAddress | null
): StoredLocation {
    const matched = geo ? matchAvailableCity(geo.city, geo.state) : null;
    if (matched) {
        return {
            ...matched,
            lat,
            lng,
            address: geo?.address,
            pincode: matched.pincode || geo?.pincode || '',
            source: 'gps',
        };
    }
    return {
        id: 'gps',
        name: geo?.city || 'Current location',
        pincode: geo?.pincode || '',
        state: geo?.state || '',
        isAvailable: true,
        lat,
        lng,
        address: geo?.address,
        source: 'gps',
    };
}

export async function requestAndPersistLocation(): Promise<StoredLocation | null> {
    const pos = await requestCurrentPosition();
    if (!pos) return null;
    const geo = await Promise.race([
        reverseGeocode(pos.lat, pos.lng),
        new Promise<GeoAddress | null>((resolve) => setTimeout(() => resolve(null), 8000)),
    ]);
    const loc = buildStoredLocation(pos.lat, pos.lng, geo);
    persistLocation(loc);
    return loc;
}
