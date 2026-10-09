'use client';

import React from 'react';
import { ProductImage } from '@/app/components/ProductImage';
import { WishlistIcon } from '@/app/components/WishlistIcon';
import styles from './ProductCard.module.css';
import AddToCartButton from '@/app/components/AddToCartButton';
import { isOutOfStock } from '@/utils/productStock';

interface Product {
    id: number;
    name: string;
    price: number;
    mrp: number;
    image: string;
    unit?: string;
    active_offer_text?: string;
    track_inventory?: boolean;
    stock_quantity?: number;
    minimum_order_quantity?: number;
    maximum_order_quantity?: number | null;
}

interface ProductCardProps {
    product: Product;
    isWishlisted: boolean;
    onToggleWishlist: (e: React.MouseEvent) => void;
    onClick: () => void;
    offersDelivery?: boolean;
    offersPickup?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
    product,
    isWishlisted,
    onToggleWishlist,
    onClick,
    offersDelivery,
    offersPickup
}) => {
    const price = Number(product.price);
    const mrp = Number(product.mrp);
    const discount = mrp > price
        ? Math.round(((mrp - price) / mrp) * 100)
        : 0;
    const outOfStock = isOutOfStock(product.track_inventory, product.stock_quantity);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.target !== e.currentTarget) return;
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick();
        }
    };

    return (
        <div
            className={`${styles.card} ${outOfStock ? styles.isOut : ''}`}
            onClick={onClick}
            onKeyDown={handleKeyDown}
            role="link"
            tabIndex={0}
            aria-label={product.name}
        >
            <div className={styles.imageWrapper}>
                <div className={styles.image}>
                    <ProductImage
                        src={product.image || ''}
                        alt={product.name}
                        className={styles.productImage}
                    />
                </div>

                {!outOfStock && discount > 0 && (
                    <div className={styles.discountBadge}>
                        <span>{discount}%</span>
                        <span>OFF</span>
                    </div>
                )}

                <button
                    type="button"
                    className={styles.wishlistBtn}
                    onClick={onToggleWishlist}
                    aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                    aria-pressed={isWishlisted}
                >
                    <WishlistIcon isWishlisted={isWishlisted} size={16} />
                </button>

                {outOfStock && <div className={styles.outBadge}>Out of stock</div>}
            </div>

            <div className={styles.content}>
                {product.active_offer_text && (
                    <div className={styles.offerBadge} title={product.active_offer_text}>
                        {product.active_offer_text}
                    </div>
                )}
                <div className={styles.unit}>{product.unit || 'Unit'}</div>
                <h3 className={styles.title} title={product.name}>{product.name}</h3>

                <div className={styles.footer}>
                    <div className={styles.priceContainer}>
                        <span className={styles.price}>₹{product.price}</span>
                        {discount > 0 && (
                            <span className={styles.mrp}>₹{product.mrp}</span>
                        )}
                    </div>
                    <div onClick={(e) => e.stopPropagation()}>
                        <AddToCartButton
                            productId={product.id}
                            minimumOrderQuantity={product.minimum_order_quantity}
                            maximumOrderQuantity={product.maximum_order_quantity}
                            trackInventory={product.track_inventory}
                            stockQuantity={product.stock_quantity}
                            offersDelivery={offersDelivery}
                            offersPickup={offersPickup}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
