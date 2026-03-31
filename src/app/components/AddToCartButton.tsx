'use client';

import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useCartContext } from '@/context/CartContext';
import styles from './AddToCartButton.module.css';

interface AddToCartButtonProps {
    productId: number;
    minimumOrderQuantity?: number;
    maximumOrderQuantity?: number | null;
    retailerId?: string;
    retailerName?: string;
    className?: string;
}

const AddToCartButton: React.FC<AddToCartButtonProps> = ({
    productId,
    minimumOrderQuantity = 1,
    maximumOrderQuantity = null,
    retailerId,
    retailerName,
    className
}) => {
    const { getItemQuantity, addToCart, updateQuantity } = useCartContext();
    const quantity = getItemQuantity(productId);
    const [loading, setLoading] = useState(false);

    const handleAdd = async (e: React.MouseEvent) => {
        e.stopPropagation();

        // Retailer Validation
        const currentRetailerId = localStorage.getItem('current_retailer_id');
        if (retailerId && currentRetailerId && retailerId !== currentRetailerId) {
            toast.error(
                <span>
                    Switch to <span style={{ color: '#007bff', fontWeight: '600' }}>{retailerName || 'its'}</span> store to add this item.
                </span>,
                { duration: 4000 }
            );
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
        return (
            <button
                className={`${styles.addButton} ${className || ''}`}
                onClick={handleAdd}
                disabled={loading}
            >
                {loading ? '...' : 'ADD'}
            </button>
        );
    }

    return (
        <div className={`${styles.quantityControl} ${className || ''}`} onClick={(e) => e.stopPropagation()}>
            <button
                className={styles.controlBtn}
                onClick={handleDecrement}
                disabled={loading}
            >
                -
            </button>
            <span className={styles.quantity}>{quantity}</span>
            <button
                className={`${styles.controlBtn} ${(!!maximumOrderQuantity && quantity >= maximumOrderQuantity) ? styles.disabledBtn : ''}`}
                onClick={handleIncrement}
                disabled={loading}
            >
                +
            </button>
        </div>
    );
};

export default AddToCartButton;
