'use client';

import React from 'react';
import { ProductImage } from '@/app/components/ProductImage';
import { WishlistIcon } from '@/app/components/WishlistIcon';
import styles from './ProductCard.module.css';
import AddToCartButton from '@/app/components/AddToCartButton';

interface Product {
    id: number;
    name: string;
    price: number;
    mrp: number;
    image: string;
    unit?: string;
    active_offer_text?: string;
}

interface ProductCardProps {
    product: Product;
    isWishlisted: boolean;
    onToggleWishlist: (e: React.MouseEvent) => void;
    onClick: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
    product,
    isWishlisted,
    onToggleWishlist,
    onClick
}) => {
    const price = Number(product.price);
    const mrp = Number(product.mrp);
    const discount = mrp > price
        ? Math.round(((mrp - price) / mrp) * 100)
        : 0;

    return (
        <div className={styles.card} onClick={onClick}>
            <div className={styles.imageWrapper}>
                <div className={styles.badges}>
                    <div className={styles.badgeGroup}>
                        {product.active_offer_text && (
                            <div className={styles.offerBadge}>
                                {product.active_offer_text}
                            </div>
                        )}
                        {discount > 0 && (
                            <div className={styles.discountBadge}>{discount}% OFF</div>
                        )}
                    </div>

                    <button className={styles.wishlistBtn} onClick={onToggleWishlist}>
                        <WishlistIcon isWishlisted={isWishlisted} />
                    </button>
                </div>

                <div className={styles.image}>
                    <ProductImage
                        src={product.image || ''}
                        alt={product.name}
                        className={styles.productImage}
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
                    <div onClick={(e) => e.stopPropagation()}>
                        <AddToCartButton productId={product.id} />
                    </div>
                </div>
            </div>
        </div>
    );
};
