import { INDIA_LOCATIONS, cityId } from './india-locations';

export interface City {
    id: string;
    name: string;
    state: string;
    pincode?: string;
    /** @deprecated Kept for address-form compatibility */
    isAvailable?: boolean;
}

/** Flattened major cities — used by address forms that still import AVAILABLE_CITIES. */
export const AVAILABLE_CITIES: City[] = Object.entries(INDIA_LOCATIONS).flatMap(
    ([state, cities]) =>
        cities.map((name) => ({
            id: cityId(name, state),
            name,
            state,
            isAvailable: true,
        }))
);

/** Soft fallback only — prefer IP guess or explicit user selection. */
export const DEFAULT_CITY: City = {
    id: cityId('Bharatpur', 'Rajasthan'),
    name: 'Bharatpur',
    state: 'Rajasthan',
    pincode: '321001',
    isAvailable: true,
};
