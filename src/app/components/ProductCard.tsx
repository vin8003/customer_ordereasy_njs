'use client';

import React from 'react';
import { ProductImage } from '@/app/components/ProductImage';
import { WishlistIcon } from '@/app/components/WishlistIcon';
import styles from './ProductCard.module.css';

interface Product {
    id: number;
    name: string;
    price: number;
    mrp: number;
    image: string;
    unit?: string;
}

interface ProductCardProps {
    product: Product;
    isWishlisted: boolean;
    onToggleWishlist: (e: React.MouseEvent) => void;
    onAdd: (e: React.MouseEvent) => void;
    onClick: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
    product,
    isWishlisted,
    onToggleWishlist,
    onAdd,
    onClick
}) => {
    const discount = product.mrp > product.price
        ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
        : 0;

    return (
        <div className={styles.card} onClick={onClick}>
            <div className={styles.imageWrapper}>
                <div className={styles.badges}>
                    {discount > 0 ? (
                        <div className={styles.discountBadge}>{discount}% OFF</div>
                    ) : <div></div>} {/* Spacer to keep wishlist icon on right */}

                    <button className={styles.wishlistBtn} onClick={onToggleWishlist}>
                        <WishlistIcon isWishlisted={isWishlisted} />
                    </button>
                </div>

                <div className={styles.image}>
                    <ProductImage
                        src={product.image || ''}
                        alt={product.name}
                        className="w-full h-full object-contain"
                    />
                </div>
            </div>

            <div className={styles.content}>
                <div>
                    <div className={styles.unit}>{product.unit || 'Unit'}</div>
                    <h3 className={styles.title} title={product.name}>{product.name}</h3>
                </div>

                <div className={styles.footer}>
                    <div className={styles.priceContainer}>
                        {discount > 0 && <span className={styles.mrp}>₹{product.mrp}</span>}
                        <span className={styles.price}>₹{product.price}</span>
                    </div>
                    <button className={styles.addBtn} onClick={onAdd}>
                        ADD
                    </button>
                </div>
            </div>
        </div>
    );
};
