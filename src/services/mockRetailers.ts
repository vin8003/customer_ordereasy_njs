/**
 * Local-only stand-in for the retailer list API while the KAN-69 backend
 * (lat/lng on the list serializer + `filter_by_radius`) is not deployed yet.
 *
 * Enable with `NEXT_PUBLIC_MOCK_RETAILERS=1` in `.env.local`. `api.ts` loads
 * this module only behind an inlined NODE_ENV guard, so production builds do
 * not statically import it.
 */
import { haversineKm, toDistance, type LatLng } from '@/utils/geo';
import type { RetailerListParams, RetailerSummary } from '@/types/retailer';

/** Just enough centroids to make the mock feel like a real city. */
const CITY_CENTROIDS: Record<string, LatLng> = {
    bharatpur: { lat: 27.2173, lng: 77.4892 },
    jaipur: { lat: 26.9124, lng: 75.7873 },
    mumbai: { lat: 19.076, lng: 72.8777 },
    'new delhi': { lat: 28.6139, lng: 77.209 },
    delhi: { lat: 28.7041, lng: 77.1025 },
    bengaluru: { lat: 12.9716, lng: 77.5946 },
    bangalore: { lat: 12.9716, lng: 77.5946 },
    pune: { lat: 18.5204, lng: 73.8567 },
    agra: { lat: 27.1767, lng: 78.0081 },
};

const FALLBACK_CENTER: LatLng = CITY_CENTROIDS.bharatpur;

const CITY_PINCODES: Record<string, string> = {
    bharatpur: '321001',
    jaipur: '302001',
    mumbai: '400001',
    'new delhi': '110001',
    delhi: '110001',
    bengaluru: '560001',
    bangalore: '560001',
    pune: '411001',
    agra: '282001',
};

/** Same rules as `retailers.views._parse_bool`. */
function parseQueryBool(value: unknown, defaultValue: boolean): boolean {
    if (value === undefined || value === null) return defaultValue;
    const token = String(value).trim().toLowerCase();
    if (token === '') return defaultValue;
    if (['true', '1', 'yes'].includes(token)) return true;
    if (['false', '0', 'no'].includes(token)) return false;
    return defaultValue;
}

/** Last city the mock list was asked for, so catalog details match the map. */
let lastListCity = 'Bharatpur';
let lastListState = 'Rajasthan';

interface MockShop {
    name: string;
    /** Offset from the centre in kilometres: north/east. */
    north: number;
    east: number;
    rating: number;
    delivery: boolean;
    pickup: boolean;
    categories: string[];
    open?: boolean;
    /** Shops the retailer never pinned on a map — the edge-rail case. */
    unlocated?: boolean;
}

const SHOPS: MockShop[] = [
    { name: 'Sharma Kirana Store', north: 0.35, east: 0.2, rating: 4.6, delivery: true, pickup: true, categories: ['Grocery', 'Daily Needs'] },
    { name: 'Gupta General Store', north: -0.5, east: 0.75, rating: 4.3, delivery: true, pickup: false, categories: ['Grocery'] },
    { name: 'Fresh Mart Supermarket', north: 1.1, east: -0.6, rating: 4.8, delivery: true, pickup: true, categories: ['Supermarket', 'Fruits & Veg'] },
    { name: 'Verma Dairy & Bakery', north: -1.2, east: -0.9, rating: 4.1, delivery: false, pickup: true, categories: ['Dairy', 'Bakery'] },
    { name: 'Singh Provision Store', north: 2.1, east: 1.6, rating: 3.9, delivery: true, pickup: true, categories: ['Grocery'], open: false },
    { name: 'Annapurna Super Bazaar', north: -2.4, east: 1.9, rating: 4.5, delivery: true, pickup: true, categories: ['Supermarket'] },
    { name: 'Jain Medical & General', north: 3.6, east: -2.2, rating: 4.2, delivery: false, pickup: true, categories: ['Pharmacy', 'Daily Needs'] },
    { name: 'Krishna Fruit Corner', north: -3.9, east: -3.1, rating: 4.7, delivery: true, pickup: true, categories: ['Fruits & Veg'] },
    // Outside a typical 5 km delivery radius: only visible with filter_by_radius=false.
    { name: 'Highway Wholesale Mart', north: 7.8, east: 5.4, rating: 4.0, delivery: true, pickup: true, categories: ['Wholesale'] },
    { name: 'Riverside Cash & Carry', north: -9.2, east: 6.7, rating: 3.8, delivery: false, pickup: true, categories: ['Wholesale'], open: false },
    // No pin set by the retailer yet.
    { name: 'New Bazaar Kirana', north: 0, east: 0, rating: 4.4, delivery: true, pickup: true, categories: ['Grocery'], unlocated: true },
    { name: 'Shyam Ji Stationery', north: 0, east: 0, rating: 4.0, delivery: false, pickup: true, categories: ['Stationery'], unlocated: true },
    { name: 'Metro Home Needs', north: 0, east: 0, rating: 3.7, delivery: true, pickup: false, categories: ['Home'], unlocated: true },
];

const KM_PER_DEG_LAT = 110.574;

function offsetToLatLng(center: LatLng, northKm: number, eastKm: number): LatLng {
    const kmPerDegLng = 111.32 * Math.cos((center.lat * Math.PI) / 180);
    return {
        lat: center.lat + northKm / KM_PER_DEG_LAT,
        lng: center.lng + eastKm / kmPerDegLng,
    };
}

export function mockRetailerList(params: RetailerListParams = {}) {
    const city = params.city ?? 'Bharatpur';
    const state = params.state ?? 'Rajasthan';
    lastListCity = city;
    lastListState = state;
    const filterByRadius = parseQueryBool(params.filter_by_radius, true);

    const lat = Number(params.lat);
    const lng = Number(params.lng);
    const userPoint: LatLng | null =
        Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;

    // Shops belong to the city, not to the customer: moving the customer must
    // change the distances, not teleport the shops.
    const shopAnchor =
        CITY_CENTROIDS[city.trim().toLowerCase()] ?? userPoint ?? FALLBACK_CENTER;
    const cityKey = city.trim().toLowerCase();

    const results: RetailerSummary[] = SHOPS.map((shop, index) => {
        const coords = shop.unlocated ? null : offsetToLatLng(shopAnchor, shop.north, shop.east);
        const distance = coords && userPoint ? haversineKm(userPoint, coords) : null;

        return {
            id: 9000 + index,
            shop_name: shop.name,
            shop_description: `${shop.categories[0]} store in ${city}`,
            shop_image: null,
            city,
            state,
            pincode: CITY_PINCODES[cityKey] ?? '321001',
            latitude: coords ? coords.lat.toFixed(8) : null,
            longitude: coords ? coords.lng.toFixed(8) : null,
            average_rating: shop.rating.toFixed(2),
            total_ratings: 12 + index * 7,
            offers_delivery: shop.delivery,
            offers_pickup: shop.pickup,
            delivery_radius: 5,
            minimum_order_amount: '99.00',
            distance,
            is_currently_open: shop.open !== false,
            next_open_time: shop.open === false ? 'Opens today at 09:00 AM' : null,
            categories: shop.categories.map((name, catIndex) => ({
                id: index * 10 + catIndex,
                name,
                description: null,
                icon: null,
            })),
        };
    }).filter((retailer) => {
        if (!filterByRadius || !userPoint) return true;
        // Mirrors list_retailers: radius filtering drops far and unpinned shops.
        const km = toDistance(retailer.distance);
        const radius = toDistance(retailer.delivery_radius) ?? 5;
        return km !== null && km <= radius;
    });

    return { count: results.length, next: null, previous: null, results };
}

export function mockCustomerProfile() {
    return {
        id: 1,
        first_name: 'Aarav',
        last_name: 'Sharma',
        email: 'aarav@example.com',
        phone_number: '+919999900000',
    };
}

export function mockOperationalCities() {
    return {
        results: [
            { city: 'Bharatpur', state: 'Rajasthan' },
            { city: 'Jaipur', state: 'Rajasthan' },
            { city: 'Agra', state: 'Uttar Pradesh' },
        ],
    };
}

/** Keeps the notification poller quiet when there is no backend to talk to. */
export function mockNotifications() {
    return { count: 0, next: null, previous: null, results: [], unread_count: 0 };
}

/** Empty paginated list used by catalog endpoints in mock mode. */
export function mockEmptyList() {
    return { count: 0, next: null, previous: null, results: [] };
}

export function mockRetailerDetails(retailerId: string | number) {
    const id = Number(retailerId);
    const shop = mockRetailerList({
        city: lastListCity,
        state: lastListState,
        filter_by_radius: 'false',
    }).results.find((item) => item.id === id);
    if (!shop) {
        throw new Error(`Mock retailer ${retailerId} not found`);
    }
    return {
        ...shop,
        address_line1: `${shop.shop_name}, ${shop.city}`,
        is_referral_enabled: false,
        is_reward_active: false,
        referral_reward_points: 0,
        min_referral_order_amount: 0,
        loyalty_earning_type: 'percentage',
        loyalty_earning_value: '0',
        loyalty_min_order_value: '0',
    };
}

/** One default address with coordinates so the "centre on default address" path is testable. */
export function mockAddresses() {
    const home = offsetToLatLng(FALLBACK_CENTER, 0.6, -0.4);
    const work = offsetToLatLng(FALLBACK_CENTER, -1.5, 2.2);
    return [
        {
            id: 501,
            title: 'Home',
            address_type: 'home',
            address_line1: '12 Anah Gate',
            address_line2: 'Near Water Tank',
            landmark: 'Opp. Shiv Mandir',
            city: 'Bharatpur',
            state: 'Rajasthan',
            pincode: '321001',
            latitude: home.lat.toFixed(8),
            longitude: home.lng.toFixed(8),
            is_default: true,
            full_address: '12 Anah Gate, Near Water Tank, Bharatpur, Rajasthan 321001',
        },
        {
            id: 502,
            title: 'Shop',
            address_type: 'office',
            address_line1: '4 Mathura Gate Market',
            address_line2: '',
            landmark: 'Above SBI ATM',
            city: 'Bharatpur',
            state: 'Rajasthan',
            pincode: '321001',
            latitude: work.lat.toFixed(8),
            longitude: work.lng.toFixed(8),
            is_default: false,
            full_address: '4 Mathura Gate Market, Bharatpur, Rajasthan 321001',
        },
    ];
}
