import { useState, useCallback, useEffect } from 'react';
import { apiService } from '@/services/api';

export const useCart = () => {
    const [cartCount, setCartCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    const loadCartCount = useCallback(async () => {
        const retailerId = localStorage.getItem('current_retailer_id');
        if (!retailerId) return;

        setIsLoading(true);
        try {
            const cartData = await apiService.getCart(retailerId);
            const count = (cartData.items || []).reduce((acc: number, item: any) => acc + item.quantity, 0);
            setCartCount(count);
        } catch (error) {
            console.error("Failed to load cart count", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Also listen for a custom event to refresh the count
    useEffect(() => {
        const handleCartUpdate = () => {
            loadCartCount();
        };

        window.addEventListener('cart-updated', handleCartUpdate);
        return () => window.removeEventListener('cart-updated', handleCartUpdate);
    }, [loadCartCount]);

    return {
        cartCount,
        loadCartCount,
        isLoading
    };
};
