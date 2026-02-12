'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiService } from '@/services/api';

interface CartItem {
    id: number; // Cart Item ID (not product ID, usually) - wait, backend returns cart items. 
    // Let's check api.ts getCart response structure. 
    // api.ts line 15: const count = (cartData.items || []).reduce...
    // So cartData.items is an array.
    product: number; // Product ID
    quantity: number;
    // ... potentially other fields
}

interface CartContextType {
    items: { [productId: number]: CartItem }; // Map productId to CartItem for easy lookup
    cartCount: number;
    isLoading: boolean;
    getItemQuantity: (productId: number) => number;
    addToCart: (productId: number, quantity?: number) => Promise<void>;
    removeFromCart: (productId: number) => Promise<void>;
    updateQuantity: (productId: number, quantity: number) => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [items, setItems] = useState<{ [productId: number]: CartItem }>({});
    const [cartCount, setCartCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    // Helper to calculate count from items map
    const calculateCount = (currentItems: { [productId: number]: CartItem }) => {
        return Object.values(currentItems).reduce((acc, item) => acc + item.quantity, 0);
    };

    const loadCart = useCallback(async () => {
        // We need retailerId for getCart. 
        // In this app, it seems retailerId is stored in localStorage 'current_retailer_id'
        // or derived from URL / context. 
        // Let's check checking `useCart` in `api.ts` again. 
        // `useCart` hook used `localStorage.getItem('current_retailer_id')`.
        // We should likely do the same here.
        if (typeof window === 'undefined') return;

        const retailerId = localStorage.getItem('current_retailer_id');
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
                    // Start Mapping: Backend usually returns { id: cart_item_id, product: product_id, quantity: N } 
                    // or { id: cart_item_id, product: { id: product_id, ... }, quantity: N }
                    // I need to be careful about `item.product`.
                    // Let's assume item.product is ID or object. 
                    // To be safe, let's inspect what apiService.getCart returns if possible, or write defensive code.
                    const productId = typeof item.product === 'object' ? item.product.id : item.product;
                    newItems[productId] = { ...item, product: productId };
                });
            }
            setItems(newItems);
            setCartCount(calculateCount(newItems));
        } catch (error) {
            console.error("Failed to load cart", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadCart();

        // Listen for global cart updates (legacy support if other components emit this)
        const handleCartUpdate = () => loadCart();
        window.addEventListener('cart-updated', handleCartUpdate);
        return () => window.removeEventListener('cart-updated', handleCartUpdate);
    }, [loadCart]);

    const getItemQuantity = useCallback((productId: number) => {
        return items[productId]?.quantity || 0;
    }, [items]);

    const addToCart = useCallback(async (productId: number, quantity: number = 1) => {
        // Optimistic Update
        const previousItems = { ...items };
        const existingItem = items[productId];

        const newQuantity = (existingItem?.quantity || 0) + quantity;

        const newItem = {
            id: existingItem?.id || -1, // Temporary ID if new
            product: productId,
            quantity: newQuantity
        };

        const newItems = { ...items, [productId]: newItem };
        setItems(newItems);
        setCartCount(calculateCount(newItems));

        try {
            // Check if we need to Add or Update
            // API `addToCart` takes (productId, quantity) and adds to existing or creates new. 
            // Wait, standard `addToCart` usually ADDS to quantity. 
            // `api.ts`: `addToCart: async (productId: number, quantity: number) => ... post('cart/add/', ...)`
            // `updateCartItem`: `updateCartItem: async (itemId: number, quantity: number) => ... patch('cart/items/${itemId}/', ...)`

            // Should we use `addToCart` for initial add, and `updateCartItem` for changes?
            // If we use `addToCart` for +1, it simplifies things IF backend supports "+1" logic.
            // But for explicit "Set to 5", we might need update.
            // The requirement says:
            // 3. When user clicks "+": Quantity increases.
            // 4. When user clicks "-": Quantity decreases.

            // If item exists, we should probably use `addToCart` with quantity=1 
            // OR use `updateCartItem` with total quantity.
            // `api.ts` `addToCart` seems to be "Add this quantity to cart". 
            // Let's assume `addToCart` accumulates. 
            // BUT `updateCartItem` sets specific quantity.

            // Strategy:
            // If item doesn't exist: call `addToCart(productId, 1)`
            // If item exists: call `updateCartItem(itemId, newQuantity)` OR `addToCart` if generic.
            // Using `addToCart` repeatedly might create multiple lines if backend is not coalescing.
            // Safest: Use `addToCart` for first add. Use `updateCartItem` for subsequent changes.

            if (!existingItem) {
                const res = await apiService.addToCart(productId, quantity);
                // Refresh cart to get real ID
                loadCart();
            } else {
                // We have an existing item, we need its ID to update
                if (existingItem.id !== -1) {
                    await apiService.updateCartItem(existingItem.id, newQuantity);
                    // No need to full reload if we trust the update, but to be safe/sync:
                    // loadCart(); // Optional, maybe too heavy?
                    // Just updating state is enough if successful.
                } else {
                    // Corner case: We added item locally but don't have ID yet (race condition).
                    // Should revert or wait. For now, trigger reload.
                    loadCart();
                }
            }
        } catch (error) {
            console.error("Failed to add to cart", error);
            // Revert
            setItems(previousItems);
            setCartCount(calculateCount(previousItems));
        }
    }, [items, loadCart]);

    const updateQuantity = useCallback(async (productId: number, quantity: number) => {
        if (quantity < 0) return;
        if (quantity === 0) {
            await removeFromCart(productId);
            return;
        }

        const previousItems = { ...items };
        const existingItem = items[productId];

        if (!existingItem) {
            // Should have been an add
            await addToCart(productId, quantity);
            return;
        }

        // Optimistic
        const newItems = { ...items, [productId]: { ...existingItem, quantity } };
        setItems(newItems);
        setCartCount(calculateCount(newItems));

        try {
            if (existingItem.id !== -1) {
                await apiService.updateCartItem(existingItem.id, quantity);
            } else {
                // Fallback
                loadCart();
            }
        } catch (error) {
            console.error("Failed to update cart", error);
            setItems(previousItems);
            setCartCount(calculateCount(previousItems));
        }
    }, [items, addToCart, loadCart]); // Added addToCart to deps

    const removeFromCart = useCallback(async (productId: number) => {
        const previousItems = { ...items };
        const existingItem = items[productId];

        if (!existingItem) return;

        // Optimistic
        const newItems = { ...items };
        delete newItems[productId];
        setItems(newItems);
        setCartCount(calculateCount(newItems));

        try {
            if (existingItem.id !== -1) {
                await apiService.removeCartItem(existingItem.id);
            }
        } catch (error) {
            console.error("Failed to remove from cart", error);
            setItems(previousItems);
            setCartCount(calculateCount(previousItems));
        }
    }, [items]);

    return (
        <CartContext.Provider value={{
            items,
            cartCount,
            isLoading,
            getItemQuantity,
            addToCart,
            removeFromCart,
            updateQuantity
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
