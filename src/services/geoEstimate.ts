import { matchCity, matchState } from '@/config/india-locations';

export interface GeoEstimate {
    city: string | null;
    state: string | null;
    pincode?: string | null;
    /** Raw city from provider when not in our static list */
    guessedCityName?: string | null;
    source: 'ipapi' | 'geojs' | 'backend';
}

const TIMEOUT_MS = 3000;

async function fetchJson(url: string): Promise<any> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    } finally {
        clearTimeout(timer);
    }
}

function fromIpapi(data: any): GeoEstimate | null {
    if (!data || data.error) return null;
    const state = matchState(data.region || data.region_code);
    const rawCity = data.city || null;
    const city = matchCity(rawCity, state);
    return {
        city,
        state,
        pincode: data.postal || null,
        guessedCityName: rawCity,
        source: 'ipapi',
    };
}

function fromGeojs(data: any): GeoEstimate | null {
    if (!data) return null;
    const state = matchState(data.region || data.region_code);
    const rawCity = data.city || null;
    const city = matchCity(rawCity, state);
    return {
        city,
        state,
        pincode: null,
        guessedCityName: rawCity,
        source: 'geojs',
    };
}

/**
 * Estimate client city/state from public IP (no GPS, no API key).
 * Tries ipapi.co → geojs.io. Caller may fall back to backend geo-estimate.
 */
export async function estimateCityFromIp(): Promise<GeoEstimate | null> {
    try {
        const data = await fetchJson('https://ipapi.co/json/');
        const result = fromIpapi(data);
        if (result && (result.state || result.guessedCityName)) return result;
    } catch {
        // try fallback
    }

    try {
        const data = await fetchJson('https://get.geojs.io/v1/ip/geo.json');
        const result = fromGeojs(data);
        if (result && (result.state || result.guessedCityName)) return result;
    } catch {
        // caller may use backend
    }

    return null;
}
