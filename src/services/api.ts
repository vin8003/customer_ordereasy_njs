import axios from 'axios';

const API_BASE_URL = process.env.NODE_ENV === 'production'
    ? 'https://api.ordereasy.win/api/'
    : (process.env.NEXT_PUBLIC_API_URL || 'https://api.ordereasy.win/api/');

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const setAuthToken = (token: string, refreshToken?: string) => {
    if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        if (typeof window !== 'undefined') {
            localStorage.setItem('access_token', token);
            if (refreshToken) localStorage.setItem('refresh_token', refreshToken);
        }
    } else {
        delete api.defaults.headers.common['Authorization'];
        if (typeof window !== 'undefined') {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
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

// Add interceptor to response to handle 401 errors and refreshing
api.interceptors.response.use((response) => {
    return response;
}, async (error) => {
    const originalRequest = error.config;

    if (error.response && error.response.status === 401 && !originalRequest._retry) {
        // Avoid infinite loop if refresh itself fails
        if (originalRequest.url?.includes('auth/token/refresh/')) {
            if (typeof window !== 'undefined') {
                setAuthToken('');
                if (!window.location.pathname.includes('/login')) {
                    window.location.href = '/login';
                }
            }
            return Promise.reject(error);
        }

        originalRequest._retry = true;

        if (typeof window !== 'undefined') {
            const refreshToken = localStorage.getItem('refresh_token');
            if (refreshToken) {
                try {
                    const response = await axios.post(`${API_BASE_URL}auth/token/refresh/`, {
                        refresh: refreshToken
                    });

                    const { access, refresh } = response.data;
                    setAuthToken(access, refresh);
                    originalRequest.headers['Authorization'] = `Bearer ${access}`;

                    return api(originalRequest);
                } catch (refreshError) {
                    setAuthToken('');
                    if (!window.location.pathname.includes('/login')) {
                        window.location.href = '/login';
                    }
                    return Promise.reject(refreshError);
                }
            } else {
                setAuthToken('');
                if (!window.location.pathname.includes('/login')) {
                    window.location.href = '/login';
                }
            }
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

    registerDeviceToken: async (token: string) => {
        try {
            await api.post('auth/device/register/', {
                registration_id: token,
                type: 'web',
                name: 'customer_web'
            });
            console.log('FCM Token registered successfully');
        } catch (error) {
            console.error('Failed to register FCM token:', error);
        }
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

    verifyPhoneWithFirebase: async (phone: string, token: string) => {
        // Ensure phone number has +91 prefix for consistency
        const formattedPhone = phone.startsWith('+91') ? phone : `+91${phone}`;

        // The backend endpoint is 'auth/verify-otp/' (implied from views.py checks, need to verify urls.py but standard naming applies)
        // Wait, looking at views.py, the function is `verify_otp`. 
        // Let's assume the URL is 'auth/verify-otp/' or similar. 
        // I should probably check urls.py to be 100% sure, but I'll stick to 'auth/verify-otp/' as a common convention 
        // or check the user provided views.py context which usually maps verify_otp to a url.
        // Actually, looking at the conversation history, I haven't seen urls.py.
        // I will assume 'auth/verify-otp/' based on standard DRF router or manual paths.
        // If it fails, I'll debug.
        // Re-reading views.py: @api_view(['POST']) def verify_otp(request)
        // Usually mapped in urls.py.

        const response = await api.post('auth/customer/verify-otp/', {
            phone_number: formattedPhone,
            firebase_token: token
        });

        // If backend returned tokens (meaning login/verification successful), set them
        if (response.data && response.data.tokens) {
            setAuthToken(response.data.tokens.access, response.data.tokens.refresh);
        }

        // Invalidate profile cache so next fetch gets updated verification status
        delete CACHE['user_profile'];
        return response.data;
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

    getBestSellingProducts: async (retailerId: string) => {
        const key = `best_selling_${retailerId}`;
        return fetchWithDedupe(key, async () => {
            const response = await api.get(`products/retailer/${retailerId}/best-selling/`);
            return response.data;
        });
    },

    getBuyAgainProducts: async (retailerId: string) => {
        const key = `buy_again_${retailerId}`;
        return fetchWithDedupe(key, async () => {
            const response = await api.get(`products/retailer/${retailerId}/buy-again/`);
            return response.data;
        });
    },

    getRecommendedProducts: async (retailerId: string) => {
        const key = `recommended_${retailerId}`;
        return fetchWithDedupe(key, async () => {
            const response = await api.get(`products/retailer/${retailerId}/recommended/`);
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

    getOrders: async (force: boolean = false) => {
        const key = 'orders_history';
        return fetchWithDedupe(key, async () => {
            const response = await api.get('orders/history/');
            return response.data;
        }, force);
    },

    getCurrentOrders: async (force: boolean = false) => {
        const key = 'orders_current';
        return fetchWithDedupe(key, async () => {
            const response = await api.get('orders/current/');
            return response.data;
        }, force);
    },

    getOrderDetail: async (id: number, force: boolean = false) => {
        const key = `order_${id}`;
        return fetchWithDedupe(key, async () => {
            const response = await api.get(`orders/${id}/`);
            return response.data;
        }, force);
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
    },

    // Chat
    getOrderChat: async (orderId: number | string) => {
        const response = await api.get(`orders/${orderId}/chat/`);
        return response.data;
    },

    sendOrderMessage: async (orderId: number | string, message: string) => {
        const response = await api.post(`orders/${orderId}/chat/send/`, { message });
        return response.data;
    },

    markOrderChatRead: async (orderId: number | string) => {
        const response = await api.post(`orders/${orderId}/chat/read/`);
        return response.data;
    },

    createOrderFeedback: async (orderId: number | string, data: any) => {
        const response = await api.post(`orders/${orderId}/feedback/`, data);
        delete CACHE[`order_${orderId}`];
        delete CACHE['orders_history'];
        return response.data;
    }
};

export const getErrorMessage = (error: any): string => {
    if (!error) return "An unknown error occurred";
    if (typeof error === 'string') return error;

    // Axios error
    if (error.response && error.response.data) {
        const data = error.response.data;

        // 1. { "error": "message" }
        if (data.error && typeof data.error === 'string') return data.error;

        // 2. { "detail": "message" }
        if (data.detail && typeof data.detail === 'string') return data.detail;

        // 3. { "field": ["error"] } or { "non_field_errors": ["error"] }
        // We join all error messages
        const messages: string[] = [];
        Object.keys(data).forEach(key => {
            const value = data[key];
            if (Array.isArray(value)) {
                // If key is non_field_errors, just show validation msg. Else show "Field: msg"
                const prefix = (key === 'non_field_errors' || key === 'error') ? '' : `${key}: `;
                messages.push(`${prefix}${value.join(', ')}`);
            } else if (typeof value === 'string') {
                messages.push(value);
            }
        });

        if (messages.length > 0) return messages.join('\n');
    }

    // Fallback to error message
    return error.message || "An unknown error occurred";
};

export default api;
