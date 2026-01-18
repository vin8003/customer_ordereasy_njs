import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.ordereasy.win/api/';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const setAuthToken = (token: string) => {
    if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        if (typeof window !== 'undefined') {
            localStorage.setItem('access_token', token);
        }
    } else {
        delete api.defaults.headers.common['Authorization'];
        if (typeof window !== 'undefined') {
            localStorage.removeItem('access_token');
        }
    }
};

// Add interceptor to request to ensure token is picked up from localStorage on reload
api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Add interceptor to response to handle 401 errors
api.interceptors.response.use((response) => {
    return response;
}, (error) => {
    if (error.response && error.response.status === 401) {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('access_token');
            // Force reload or redirect could happen here, or let the UI react to the missing token
        }
    }
    return Promise.reject(error);
});

const CACHE: { [key: string]: { data: any, timestamp: number } } = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const PENDING_REQUESTS: { [key: string]: Promise<any> | undefined } = {};

const getCached = (key: string) => {
    const cached = CACHE[key];
    if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
        return cached.data;
    }
    return null;
};

const setCache = (key: string, data: any) => {
    CACHE[key] = { data, timestamp: Date.now() };
};

const fetchWithDedupe = async (key: string, fetchFn: () => Promise<any>, force: boolean = false) => {
    // 1. Check Memory Cache
    if (!force) {
        const cached = getCached(key);
        if (cached) return cached;
    }

    // 2. Check In-Flight Requests (Deduplication)
    if (PENDING_REQUESTS[key]) {
        return PENDING_REQUESTS[key];
    }

    // 3. Make New Request
    const promise = fetchFn().then((response) => {
        // Axios response, usually we return response.data
        // But the fetchFn below usually returns response.data directly if we wrap it right, 
        // OR we return response object. 
        // Looking at usage: fetchFn should return the DATA.
        // Let's standardise: fetchFn returns the FINAL data.
        setCache(key, response);
        delete PENDING_REQUESTS[key];
        return response;
    }).catch((err) => {
        delete PENDING_REQUESTS[key];
        throw err;
    });

    PENDING_REQUESTS[key] = promise;
    return promise;
};

export const apiService = {
    login: async (phone: string, password: string) => {
        // Ensure phone number has +91 prefix
        const formattedPhone = phone.startsWith('+91')
            ? phone
            : `+91${phone}`;

        const response = await api.post('auth/customer/login/', {
            username: formattedPhone,
            password
        });
        return response.data;
    },

    signup: async (data: any) => {
        // Ensure phone number has +91 prefix
        if (data.phone_number && !data.phone_number.startsWith('+91')) {
            data.phone_number = `+91${data.phone_number}`;
        }

        // Hardcode user_type to customer
        data.user_type = 'customer';

        const response = await api.post('auth/customer/signup/', data);
        return response.data;
    },

    isAuthenticated: () => {
        if (typeof window !== 'undefined') {
            return !!localStorage.getItem('access_token');
        }
        return false;
    },



    // Retailers
    getRetailers: async (params?: any) => {
        const key = `retailers_${JSON.stringify(params || {})}`;
        return fetchWithDedupe(key, async () => {
            const response = await api.get('retailers/', { params });
            return response.data;
        });
    },

    getRetailerDetails: async (retailerId: string) => {
        const key = `retailer_${retailerId}`;
        return fetchWithDedupe(key, async () => {
            const response = await api.get(`retailers/${retailerId}/`);
            return response.data;
        });
    },

    // Products & Categories
    getRetailerCategories: async (retailerId: string) => {
        const key = `categories_${retailerId}`;
        return fetchWithDedupe(key, async () => {
            const response = await api.get(`products/retailer/${retailerId}/categories/`);
            return response.data;
        });
    },

    getFeaturedProducts: async (retailerId: string) => {
        const key = `featured_${retailerId}`;
        return fetchWithDedupe(key, async () => {
            const response = await api.get(`products/retailer/${retailerId}/featured/`);
            return response.data;
        });
    },

    getRetailerProducts: async (retailerId: string, params?: any) => {
        const key = `products_${retailerId}_${JSON.stringify(params || {})}`;
        return fetchWithDedupe(key, async () => {
            const response = await api.get(`products/retailer/${retailerId}/`, { params });
            return response.data;
        });
    },

    getProductDetail: async (retailerId: string, productId: string) => {
        const key = `product_${retailerId}_${productId}`;
        return fetchWithDedupe(key, async () => {
            const response = await api.get(`products/retailer/${retailerId}/${productId}/`);
            return response.data;
        });
    },

    // Cart
    getCart: async (retailerId: string | number) => {
        // Cache Key includes retailerId
        const key = `cart_${retailerId}`;
        // Using dedupe to prevent simultaneous calls. 
        // Note: Cart changes frequently, so ensure we invalidate or rely on short cache duration.
        // For now, rely on 5 min cache BUT invalidate on add/update.
        return fetchWithDedupe(key, async () => {
            const response = await api.get('cart/', { params: { retailer_id: retailerId } });
            return response.data;
        });
    },

    addToCart: async (productId: number, quantity: number) => {
        const response = await api.post('cart/add/', { product_id: productId, quantity });
        // Invalidate Cart Cache roughly (wildcard invalidation would be better but simple solution: clear specific keys if we knew retailerId)
        // Since we don't know retailerId easily here without passing it, clear ALL cart keys?
        // Or better: pass retailerId to addToCart? The backend infers it from product?
        // For now, let's just accept that immediate consistency might need manual refetch or we clear all cart_* keys.
        // Simple hack: Clear the GLOBAL cache map entries that start with cart_
        Object.keys(CACHE).forEach(k => {
            if (k.startsWith('cart_')) delete CACHE[k];
        });
        return response.data;
    },

    updateCartItem: async (itemId: number, quantity: number) => {
        const response = await api.patch(`cart/items/${itemId}/`, { quantity });
        Object.keys(CACHE).forEach(k => { if (k.startsWith('cart_')) delete CACHE[k]; });
        return response.data;
    },

    removeCartItem: async (itemId: number) => {
        const response = await api.delete(`cart/items/${itemId}/remove/`);
        Object.keys(CACHE).forEach(k => { if (k.startsWith('cart_')) delete CACHE[k]; });
        return response.data;
    },

    // Wishlist
    getWishlist: async () => {
        const key = 'customer_wishlist';
        return fetchWithDedupe(key, async () => {
            const response = await api.get('customer/wishlist/');
            return response.data;
        });
    },

    addToWishlist: async (productId: number) => {
        const response = await api.post('customer/wishlist/add/', { product: productId });
        delete CACHE['customer_wishlist'];
        return response.data;
    },

    removeFromWishlist: async (productId: number) => {
        const response = await api.delete(`customer/wishlist/remove/${productId}/`);
        delete CACHE['customer_wishlist'];
        return response.data;
    },

    // User Profile
    fetchUserProfile: async () => {
        const key = 'user_profile';
        return fetchWithDedupe(key, async () => {
            const response = await api.get('customer/profile/');
            return response.data;
        });
    },

    updateUserProfile: async (data: any) => {
        const response = await api.patch('customer/profile/update/', data);
        delete CACHE['user_profile'];
        return response.data;
    },

    logout: async () => {
        setAuthToken('');
        // Clear all cache
        Object.keys(CACHE).forEach(key => delete CACHE[key]);
    },

    // Addresses
    getAddresses: async () => {
        const key = 'addresses';
        return fetchWithDedupe(key, async () => {
            const response = await api.get('customer/addresses/');
            return response.data;
        });
    },

    getAddressDetail: async (id: number | string) => {
        const key = `address_${id}`;
        return fetchWithDedupe(key, async () => {
            const response = await api.get(`customer/addresses/${id}/`);
            return response.data;
        });
    },

    addAddress: async (data: any) => {
        const response = await api.post('customer/addresses/create/', data);
        delete CACHE['addresses'];
        return response.data;
    },

    updateAddress: async (id: number, data: any) => {
        const response = await api.patch(`customer/addresses/${id}/update/`, data);
        delete CACHE['addresses'];
        return response.data;
    },

    deleteAddress: async (id: number) => {
        const response = await api.delete(`customer/addresses/${id}/delete/`);
        delete CACHE['addresses'];
        return response.data;
    },

    // Orders
    placeOrder: async (data: any) => {
        const response = await api.post('orders/place/', data);
        delete CACHE['orders_history'];
        delete CACHE['orders_current'];
        // Also clear cart
        Object.keys(CACHE).forEach(k => { if (k.startsWith('cart_')) delete CACHE[k]; });
        // Clear loyalty cache
        delete CACHE['loyalty_all'];
        if (data.retailer_id) delete CACHE[`loyalty_${data.retailer_id}`];
        return response.data;
    },

    // Referrals
    applyReferralCode: async (referralCode: string, retailerId: number) => {
        const response = await api.post('customer/referral/apply/', {
            referral_code: referralCode,
            retailer_id: retailerId
        });
        return response.data;
    },

    getReferralStats: async () => {
        const key = 'referral_stats';
        return fetchWithDedupe(key, async () => {
            const response = await api.get('customer/referral/stats/');
            return response.data;
        });
    },

    getOrders: async () => {
        const key = 'orders_history';
        return fetchWithDedupe(key, async () => {
            const response = await api.get('orders/history/');
            return response.data;
        });
    },

    getCurrentOrders: async () => {
        const key = 'orders_current';
        return fetchWithDedupe(key, async () => {
            const response = await api.get('orders/current/');
            return response.data;
        });
    },

    getOrderDetail: async (id: number) => {
        const key = `order_${id}`;
        return fetchWithDedupe(key, async () => {
            const response = await api.get(`orders/${id}/`);
            return response.data;
        });
    },

    // Rewards
    fetchRewardConfiguration: async (retailerId: string | number) => {
        const key = `reward_config_${retailerId}`;
        return fetchWithDedupe(key, async () => {
            const response = await api.get('customer/reward-configuration/', { params: { retailer_id: retailerId } });
            return response.data;
        });
    },

    getCustomerLoyalty: async (retailerId: string | number, force: boolean = false) => {
        const key = `loyalty_${retailerId}`;
        return fetchWithDedupe(key, async () => {
            const response = await api.get('customer/loyalty/', { params: { retailer_id: retailerId } });
            return response.data;
        }, force);
    },

    getAllCustomerLoyalty: async (force: boolean = false) => {
        const key = 'loyalty_all';
        return fetchWithDedupe(key, async () => {
            const response = await api.get('customer/loyalty/all/');
            return response.data;
        }, force);
    },

    confirmOrderModification: async (orderId: number | string, action: 'accept' | 'reject') => {
        const response = await api.post(`orders/${orderId}/confirm_modification/`, { action });
        delete CACHE[`order_${orderId}`];
        delete CACHE['orders_history'];
        delete CACHE['orders_current'];
        // Clear all loyalty cache to be sure
        delete CACHE['loyalty_all'];
        Object.keys(CACHE).forEach(k => { if (k.startsWith('loyalty_')) delete CACHE[k]; });
        return response.data;
    },

    cancelOrder: async (orderId: number | string, reason: string = '') => {
        const response = await api.post(`orders/${orderId}/cancel/`, { reason });
        delete CACHE[`order_${orderId}`];
        delete CACHE['orders_history'];
        delete CACHE['orders_current'];
        // Clear all loyalty cache to be sure
        delete CACHE['loyalty_all'];
        Object.keys(CACHE).forEach(k => { if (k.startsWith('loyalty_')) delete CACHE[k]; });
        return response.data;
    }
};

export default api;
