'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ShoppingBag, Heart, User } from 'lucide-react';
import { useWishlist } from '@/hooks/useWishlist';
import { useCartContext } from '@/context/CartContext';
import { apiService } from '@/services/api';
import styles from './BottomNav.module.css';

export default function BottomNav() {
    const pathname = usePathname();
    const [homeLink, setHomeLink] = useState('/retailers');
    const { wishlistIds, loadWishlist } = useWishlist();
    const { cartCount } = useCartContext();

    // Pages where we don't want to show the bottom nav
    const hiddenRoutes = ['/login', '/signup', '/', '/city-selection', '/checkout', '/checkout/success', '/retailer/product'];

    useEffect(() => {
        // Determine 'Home' link based on context
        const savedRetailerId = localStorage.getItem('current_retailer_id');
        if (savedRetailerId) {
            setHomeLink(`/retailer?id=${savedRetailerId}`);

            // Only load data if we are on a page where the nav is visible
            // This prevents 401 errors on login/signup if token is expired
            if (!hiddenRoutes.includes(pathname)) {
                if (apiService.isAuthenticated()) {
                    loadWishlist();
                }
            }
        }
    }, [pathname, loadWishlist]);

    if (hiddenRoutes.includes(pathname)) {
        return null;
    }

    // Function to check if a link is active
    const isActive = (path: string) => {
        if (path === '/retailers' || path.startsWith('/retailer/')) {
            // Home is active if we are in retailer context
            return pathname.startsWith('/retailer') || pathname === '/retailers';
        }
        return pathname.startsWith(path);
    };

    return (
        <nav className={styles.bottomNav}>
            <Link href={homeLink} className={`${styles.navItem} ${isActive('/retailer') ? styles.active : ''}`}>
                <Home size={24} className={styles.icon} />
                <span>Home</span>
            </Link>

            <Link href="/cart" className={`${styles.navItem} ${pathname === '/cart' ? styles.active : ''}`}>
                <div className={styles.iconWrapper}>
                    <ShoppingBag size={24} className={styles.icon} />
                    {cartCount > 0 && <span className={styles.badge}>{cartCount}</span>}
                </div>
                <span>Cart</span>
            </Link>

            <Link href="/wishlist" className={`${styles.navItem} ${pathname === '/wishlist' ? styles.active : ''}`}>
                <div className={styles.iconWrapper}>
                    <Heart size={24} className={styles.icon} />
                    {wishlistIds.size > 0 && <span className={styles.badge}>{wishlistIds.size}</span>}
                </div>
                <span>Wishlist</span>
            </Link>

            <Link href="/profile" className={`${styles.navItem} ${pathname.startsWith('/profile') ? styles.active : ''}`}>
                <User size={24} className={styles.icon} />
                <span>Profile</span>
            </Link>
        </nav>
    );
}
