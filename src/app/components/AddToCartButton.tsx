'use client';

import React, { useState } from 'react';
import { useCartContext } from '@/context/CartContext';
import styles from './AddToCartButton.module.css';

interface AddToCartButtonProps {
    productId: number;
    retailerId?: string; // Optional if we want to enforce retailer check, but CartContext handles logic
    className?: string;
}

const AddToCartButton: React.FC<AddToCartButtonProps> = ({ productId, className }) => {
    const { getItemQuantity, addToCart, updateQuantity } = useCartContext();
    const quantity = getItemQuantity(productId);
    const [loading, setLoading] = useState(false);

    const handleAdd = async (e: React.MouseEvent) => {
        e.stopPropagation();
        setLoading(true);
        try {
            await addToCart(productId, 1);
        } finally {
            setLoading(false);
        }
    };

    const handleIncrement = async (e: React.MouseEvent) => {
        e.stopPropagation();
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
            await updateQuantity(productId, quantity - 1);
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
                className={styles.controlBtn}
                onClick={handleIncrement}
                disabled={loading}
            >
                +
            </button>
        </div>
    );
};

export default AddToCartButton;
