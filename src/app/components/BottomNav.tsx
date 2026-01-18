'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ShoppingBag, Heart, User } from 'lucide-react';
import styles from './BottomNav.module.css';

export default function BottomNav() {
    const pathname = usePathname();
    const [homeLink, setHomeLink] = useState('/retailers');

    // Pages where we don't want to show the bottom nav
    const hiddenRoutes = ['/login', '/signup', '/'];

    useEffect(() => {
        // Determine 'Home' link based on context
        const savedRetailerId = localStorage.getItem('current_retailer_id');
        if (savedRetailerId) {
            setHomeLink(`/retailer/${savedRetailerId}`);
        }
    }, [pathname]);

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
                <ShoppingBag size={24} className={styles.icon} />
                <span>Cart</span>
            </Link>

            <Link href="/wishlist" className={`${styles.navItem} ${pathname === '/wishlist' ? styles.active : ''}`}>
                <Heart size={24} className={styles.icon} />
                <span>Wishlist</span>
            </Link>

            <Link href="/profile" className={`${styles.navItem} ${pathname.startsWith('/profile') ? styles.active : ''}`}>
                <User size={24} className={styles.icon} />
                <span>Profile</span>
            </Link>
        </nav>
    );
}
