import { useState, useCallback } from 'react';
import { apiService } from '@/services/api';

export const useWishlist = () => {
    const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(false);

    // Load wishlist data from API and normalize IDs to strings
    const loadWishlist = useCallback(async () => {
        setIsLoading(true);
        try {
            const wishlistData = await apiService.getWishlist().catch(() => ({ results: [] }));

            // Handle both direct ID lists and object lists (API variations)
            const rawItems = wishlistData.results || wishlistData;

            const ids = new Set<string>(rawItems.map((item: any) => {
                // Check if item has a 'product' field (standard) or is just an ID
                // And handle if 'product' is an object (nested) or ID (flat)
                const prod = item.product || item;

                if (prod && typeof prod === 'object') {
                    // Handle case where product is an object with an ID
                    return String(prod.id);
                }
                return String(prod);
            }));

            setWishlistIds(ids);
        } catch (error) {
            console.error("Failed to load wishlist", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Toggle wishlist status with optimistic UI update
    const toggleWishlist = useCallback(async (productId: number) => {
        const strId = String(productId);
        const isAdding = !wishlistIds.has(strId);

        // Optimistic Update
        setWishlistIds(prev => {
            const next = new Set(prev);
            if (isAdding) next.add(strId);
            else next.delete(strId);
            return next;
        });

        try {
            if (isAdding) {
                await apiService.addToWishlist(Number(productId));
            } else {
                await apiService.removeFromWishlist(Number(productId));
            }
        } catch (error) {
            console.error("Wishlist toggle action failed", error);
            // Revert state on failure
            setWishlistIds(prev => {
                const next = new Set(prev);
                if (isAdding) next.delete(strId);
                else next.add(strId);
                return next;
            });
        }
    }, [wishlistIds]);

    const isWishlisted = useCallback((productId: number | string) => {
        return wishlistIds.has(String(productId));
    }, [wishlistIds]);

    return {
        wishlistIds,
        loadWishlist,
        toggleWishlist,
        isWishlisted,
        isLoading
    };
};
