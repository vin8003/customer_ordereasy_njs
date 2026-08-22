/**
 * Query params for `GET /api/retailers/` (`list_retailers`).
 * `filter_by_radius` is parsed on the backend as true/1/yes (default true).
 */
export interface RetailerListParams {
    city?: string;
    state?: string;
    lat?: number;
    lng?: number;
    /** Send 'false' so the map still gets `distance` without hiding shops. */
    filter_by_radius?: 'true' | 'false';
    page_size?: number;
    search?: string;
    has_referral?: boolean;
}

/** Nested category from `RetailerCategorySerializer`. */
export interface RetailerCategorySummary {
    id: number;
    name: string;
    description?: string | null;
    icon?: string | null;
}

/** Shape returned by `GET /api/retailers/` (RetailerListSerializer). */
export interface RetailerSummary {
    id: number;
    shop_name: string;
    shop_description?: string | null;
    shop_image?: string | null;
    city: string;
    state: string;
    pincode?: string;
    /** DRF DecimalField → JSON string; null until the retailer drops a pin (KAN-53). */
    latitude?: string | number | null;
    longitude?: string | number | null;
    average_rating?: string | number;
    total_ratings?: number;
    offers_delivery?: boolean;
    offers_pickup?: boolean;
    delivery_radius?: number | null;
    minimum_order_amount?: string | number;
    /** Kilometres from the supplied lat/lng; JSON number, or null when either side lacks coords. */
    distance?: string | number | null;
    is_currently_open?: boolean;
    next_open_time?: string | null;
    categories?: RetailerCategorySummary[];
}

/** A retailer we can actually plot. `distance` is always a parsed number after partition. */
export interface PlottableRetailer extends RetailerSummary {
    lat: number;
    lng: number;
    distance: number | null;
}
