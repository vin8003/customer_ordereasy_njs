'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiService } from '@/services/api';

interface CartItem {
    id: number;
    product: number; // Product ID
    quantity: number;
    // For guest cart, we might need more details if we manipulate UI optimistically
}

interface CartContextType {
    items: { [productId: number]: CartItem };
    cartCount: number;
    isLoading: boolean;
    getItemQuantity: (productId: number) => number;
    addToCart: (productId: number, quantity?: number) => Promise<void>;
    removeFromCart: (productId: number) => Promise<void>;
    updateQuantity: (productId: number, quantity: number) => Promise<void>;
    syncGuestCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [items, setItems] = useState<{ [productId: number]: CartItem }>({});
    const [cartCount, setCartCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [isGuest, setIsGuest] = useState(true); // Default to guest until proven otherwise

    // Helper to calculate count
    const calculateCount = (currentItems: { [productId: number]: CartItem }) => {
        return Object.values(currentItems).reduce((acc, item) => acc + item.quantity, 0);
    };

    const loadCart = useCallback(async () => {
        if (typeof window === 'undefined') return;

        const retailerId = localStorage.getItem('current_retailer_id');
        const token = localStorage.getItem('access_token');
        const authenticated = !!token;
        setIsGuest(!authenticated);

        if (!authenticated) {
            // Load Guest Cart from LocalStorage
            try {
                const guestCartStr = localStorage.getItem(`guest_cart_${retailerId || 'default'}`);
                if (guestCartStr) {
                    const guestItems = JSON.parse(guestCartStr);
                    setItems(guestItems);
                    setCartCount(calculateCount(guestItems));
                } else {
                    setItems({});
                    setCartCount(0);
                }
            } catch (e) {
                console.error("Error loading guest cart", e);
                setItems({});
            }
            return;
        }

        if (!retailerId) {
            setItems({});
            setCartCount(0);
            return;
        }

        setIsLoading(true);
        try {
            const data = await apiService.getCart(retailerId);
            const newItems: { [productId: number]: CartItem } = {};
            if (data.items && Array.isArray(data.items)) {
                data.items.forEach((item: any) => {
                    const productId = typeof item.product === 'object' ? item.product.id : item.product;
                    newItems[productId] = { ...item, product: productId };
                });
            }
            setItems(newItems);
            setCartCount(calculateCount(newItems));
        } catch (error: any) {
            console.error("Failed to load cart", error);
            // If 401, handle? API interceptor should handle it.
            // But if we are here, strict mode might have failed.
        } finally {
            setIsLoading(false);
        }
    }, []);

    const saveGuestCart = (newItems: { [productId: number]: CartItem }) => {
        const retailerId = localStorage.getItem('current_retailer_id');
        localStorage.setItem(`guest_cart_${retailerId || 'default'}`, JSON.stringify(newItems));
        // Also fire event for other components
        window.dispatchEvent(new CustomEvent('cart-updated'));
    };

    useEffect(() => {
        loadCart();

        const handleCartUpdate = () => loadCart();
        window.addEventListener('cart-updated', handleCartUpdate);
        // Also listen for storage events to sync across tabs
        window.addEventListener('storage', handleCartUpdate);

        return () => {
            window.removeEventListener('cart-updated', handleCartUpdate);
            window.removeEventListener('storage', handleCartUpdate);
        };
    }, [loadCart]);

    const getItemQuantity = useCallback((productId: number) => {
        return items[productId]?.quantity || 0;
    }, [items]);

    const addToCart = useCallback(async (productId: number, quantity: number = 1) => {
        // 1. Optimistic Update (Works for both Guest and Auth)
        const previousItems = { ...items };
        const existingItem = items[productId];
        const newQuantity = (existingItem?.quantity || 0) + quantity;

        // Negative quantity check?
        // if (newQuantity <= 0) return removeFromCart(productId);

        const newItem = {
            id: existingItem?.id || -1 * Date.now(), // Temp ID
            product: productId,
            quantity: newQuantity
        };

        const newItems = { ...items, [productId]: newItem };
        setItems(newItems);
        setCartCount(calculateCount(newItems));

        if (isGuest) {
            saveGuestCart(newItems);
            return; // Done for guest
        }

        try {
            if (!existingItem) {
                await apiService.addToCart(productId, quantity);
                loadCart(); // Reload to get real ID
            } else {
                if (existingItem.id > 0) {
                    await apiService.updateCartItem(existingItem.id, newQuantity);
                } else {
                    // ID is temporary? Shouldn't happen if loaded from backend.
                    loadCart();
                }
            }
        } catch (error) {
            console.error("Failed to add to cart", error);
            setItems(previousItems); // Revert
            setCartCount(calculateCount(previousItems));
        }
    }, [items, isGuest, loadCart]);

    const removeFromCart = useCallback(async (productId: number) => {
        const previousItems = { ...items };
        const existingItem = items[productId];

        if (!existingItem) return;

        // Optimistic
        const newItems = { ...items };
        delete newItems[productId];
        setItems(newItems);
        setCartCount(calculateCount(newItems));

        if (isGuest) {
            saveGuestCart(newItems);
            return;
        }

        try {
            if (existingItem.id > 0) {
                await apiService.removeCartItem(existingItem.id);
            }
        } catch (error) {
            console.error("Failed to remove from cart", error);
            setItems(previousItems);
            setCartCount(calculateCount(previousItems));
        }
    }, [items, isGuest]);

    const updateQuantity = useCallback(async (productId: number, quantity: number) => {
        if (quantity < 0) return;
        if (quantity === 0) {
            await removeFromCart(productId);
            return;
        }

        const previousItems = { ...items };
        const existingItem = items[productId];

        if (!existingItem) {
            await addToCart(productId, quantity); // Should call addToCart
            return;
        }

        // Optimistic
        const newItems = { ...items, [productId]: { ...existingItem, quantity } };
        setItems(newItems);
        setCartCount(calculateCount(newItems));

        if (isGuest) {
            saveGuestCart(newItems);
            return;
        }

        try {
            if (existingItem.id > 0) {
                await apiService.updateCartItem(existingItem.id, quantity);
            } else {
                loadCart();
            }
        } catch (error) {
            console.error("Failed to update cart", error);
            setItems(previousItems);
            setCartCount(calculateCount(previousItems));
        }
    }, [items, isGuest, addToCart, removeFromCart, loadCart]);

    const syncGuestCart = useCallback(async () => {
        const retailerId = localStorage.getItem('current_retailer_id');
        const guestCartStr = localStorage.getItem(`guest_cart_${retailerId || 'default'}`);

        if (!guestCartStr) return;

        try {
            const guestItems: { [productId: number]: CartItem } = JSON.parse(guestCartStr);
            const products = Object.values(guestItems);

            if (products.length === 0) return;

            // Sequential add to ensure order? Parallel is faster.
            // Backend might have race conditions if same product added twice?
            // Since these are distinct products, parallel is fine.
            await Promise.all(products.map(async (item) => {
                // We use addToCart for each item. 
                // Note: If item already in server cart, this will ADD to it. 
                // This is generally expected behavior for merging carts.
                await apiService.addToCart(item.product, item.quantity);
            }));

            // Clear guest cart
            localStorage.removeItem(`guest_cart_${retailerId || 'default'}`);

            // Reload to get merged state
            loadCart();
        } catch (e) {
            console.error("Failed to sync guest cart", e);
        }
    }, [loadCart]);

    return (
        <CartContext.Provider value={{
            items,
            cartCount,
            isLoading,
            getItemQuantity,
            addToCart,
            removeFromCart,
            updateQuantity,
            syncGuestCart
        }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCartContext = () => {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCartContext must be used within a CartProvider');
    }
    return context;
};
