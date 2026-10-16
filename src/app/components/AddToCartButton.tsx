'use client';

import React, { useState } from 'react';
import toast from '@/lib/toast';
import { Plus, Minus, Loader2 } from 'lucide-react';
import { useCartContext } from '@/context/CartContext';
import { isOutOfStock } from '@/utils/productStock';
import styles from './AddToCartButton.module.css';

interface AddToCartButtonProps {
    productId: number;
    minimumOrderQuantity?: number;
    maximumOrderQuantity?: number | null;
    trackInventory?: boolean;
    stockQuantity?: number;
    retailerId?: string;
    retailerName?: string;
    offersDelivery?: boolean;
    offersPickup?: boolean;
    className?: string;
    /** `block` renders a full-width "Add to cart" CTA (product page). */
    variant?: 'compact' | 'block';
}

const AddToCartButton: React.FC<AddToCartButtonProps> = ({
    productId,
    minimumOrderQuantity = 1,
    maximumOrderQuantity = null,
    retailerId,
    retailerName,
    offersDelivery = true, // Default to true if not provided
    offersPickup = true,
    trackInventory,
    stockQuantity,
    className,
    variant = 'compact'
}) => {
    const { getItemQuantity, addToCart, updateQuantity } = useCartContext();
    const quantity = getItemQuantity(productId);
    const [loading, setLoading] = useState(false);
    const outOfStock = (trackInventory !== undefined || stockQuantity !== undefined)
        ? isOutOfStock(trackInventory, stockQuantity)
        : false;

    const handleAdd = async (e: React.MouseEvent) => {
        e.stopPropagation();

        if (outOfStock) return;

        // Retailer Validation
        const currentRetailerId = localStorage.getItem('current_retailer_id');
        if (retailerId && currentRetailerId && retailerId !== currentRetailerId) {
            toast.error(
                <span>
                    Switch to <span className="font-semibold text-primary">{retailerName || 'its'}</span> store to add this item.
                </span>,
                { duration: 4000 }
            );
            return;
        }

        // Offline Validation
        if (!offersDelivery && !offersPickup) {
            toast.error("This store is currently not accepting orders.", {
                icon: '🚫',
                duration: 3000
            });
            return;
        }

        setLoading(true);
        try {
            await addToCart(productId, minimumOrderQuantity);
            if (minimumOrderQuantity > 1) {
                toast(`Minimum order quantity is ${minimumOrderQuantity}`, {
                    icon: 'ℹ️',
                    duration: 3000
                });
            }
        } finally {
            setLoading(false);
        }
    };

    const handleIncrement = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (maximumOrderQuantity && quantity >= maximumOrderQuantity) {
            toast.error(`Maximum order limit is ${maximumOrderQuantity}`);
            return;
        }
        setLoading(true);
        try {
            await updateQuantity(productId, quantity + 1);
        } finally {
            setLoading(false);
        }
    };

    const handleDecrement = async (e: React.MouseEvent) => {
        e.stopPropagation();
        setLoading(true);
        try {
            if (quantity <= minimumOrderQuantity) {
                await updateQuantity(productId, 0);
            } else {
                await updateQuantity(productId, quantity - 1);
            }
        } finally {
            setLoading(false);
        }
    };

    if (quantity === 0) {
        if (outOfStock) {
            return (
                <button
                    className={`${styles.addButton} ${styles.soldOut} ${className || ''}`}
                    disabled
                    type="button"
                >
                    Sold out
                </button>
            );
        }
        const isOffline = !offersDelivery && !offersPickup;
        return (
            <button
                type="button"
                className={`${styles.addButton} ${variant === 'block' ? styles.block : ''} ${className || ''} ${isOffline ? styles.disabled : ''}`}
                onClick={handleAdd}
                disabled={loading || isOffline}
                aria-label="Add to cart"
            >
                {loading ? <Loader2 size={15} className={styles.spin} /> : (isOffline ? 'Offline' : (
                    variant === 'block' ? (
                        <>
                            <Plus size={18} strokeWidth={2.5} />
                            Add to cart
                        </>
                    ) : (
                        <>
                            ADD
                            <Plus size={13} strokeWidth={3} className={styles.addPlus} />
                        </>
                    )
                ))}
            </button>
        );
    }

    const atMax = !!maximumOrderQuantity && quantity >= maximumOrderQuantity;

    return (
        <div className={`${styles.quantityControl} ${variant === 'block' ? styles.block : ''} ${loading ? styles.busy : ''} ${className || ''}`} onClick={(e) => e.stopPropagation()}>
            <button
                type="button"
                className={styles.controlBtn}
                onClick={handleDecrement}
                disabled={loading}
                aria-label="Decrease quantity"
            >
                <Minus size={15} strokeWidth={3} />
            </button>
            <span className={styles.quantity} aria-live="polite">{quantity}</span>
            <button
                type="button"
                className={`${styles.controlBtn} ${atMax ? styles.disabledBtn : ''}`}
                onClick={handleIncrement}
                disabled={loading}
                aria-label="Increase quantity"
            >
                <Plus size={15} strokeWidth={3} />
            </button>
        </div>
    );
};

export default AddToCartButton;
