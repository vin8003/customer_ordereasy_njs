/** Production stand-in so `mockRetailers.ts` is not in the client graph. */
export function mockRetailerList() {
    return { count: 0, next: null, previous: null, results: [] };
}

export function mockOperationalCities() {
    return { results: [] };
}

export function mockRetailerDetails() {
    throw new Error('Mock API is not available in production');
}

export function mockEmptyList() {
    return { count: 0, next: null, previous: null, results: [] };
}

export function mockCustomerProfile() {
    return { id: 0, first_name: '', last_name: '', email: '', phone_number: '' };
}

export function mockAddresses() {
    return [];
}

export function mockNotifications() {
    return { count: 0, next: null, previous: null, results: [], unread_count: 0 };
}
