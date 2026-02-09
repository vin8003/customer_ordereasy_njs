export interface City {
    id: string;
    name: string;
    pincode: string;
    state: string;
    isAvailable: boolean;
}

export const AVAILABLE_CITIES: City[] = [
    {
        id: 'bharatpur',
        name: 'Bharatpur',
        pincode: '321001',
        state: 'Rajasthan',
        isAvailable: true,
    },
    // Future cities can be added here
];

export const DEFAULT_CITY = AVAILABLE_CITIES[0];
