'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ShoppingBag, Heart, User } from 'lucide-react';
import { useWishlist } from '@/hooks/useWishlist';
import { useCartContext } from '@/context/CartContext';
import { apiService } from '@/services/api';
import { cn } from '@/lib/utils';
import styles from './BottomNav.module.css';

const HIDDEN_ROUTES = ['/login', '/signup', '/', '/city-selection', '/checkout', '/checkout/success', '/retailer/product', '/orders/chat'];

function readHomeLink() {
    if (typeof window === 'undefined') return '/retailers';
    const savedRetailerId = localStorage.getItem('current_retailer_id');
    return savedRetailerId ? `/retailer?id=${savedRetailerId}` : '/retailers';
}

export default function BottomNav() {
    const pathname = usePathname();
    const [homeLink, setHomeLink] = useState('/retailers');
    const { wishlistIds, loadWishlist } = useWishlist();
    const { cartCount } = useCartContext();

    useEffect(() => {
        const next = readHomeLink();
        setHomeLink((current) => (current === next ? current : next));

        if (!HIDDEN_ROUTES.includes(pathname) && apiService.isAuthenticated() && localStorage.getItem('current_retailer_id')) {
            loadWishlist();
        }
    }, [pathname, loadWishlist]);

    if (HIDDEN_ROUTES.includes(pathname)) {
        return null;
    }

    const isActive = (path: string) => {
        if (path === '/retailers' || path.startsWith('/retailer/')) {
            return pathname.startsWith('/retailer') || pathname === '/retailers';
        }
        return pathname.startsWith(path);
    };

    const items = [
        { label: 'Home', href: homeLink, icon: Home, active: isActive('/retailer'), badge: 0 },
        { label: 'Cart', href: '/cart', icon: ShoppingBag, active: pathname === '/cart', badge: cartCount },
        { label: 'Wishlist', href: '/wishlist', icon: Heart, active: pathname === '/wishlist', badge: wishlistIds.size },
        { label: 'Profile', href: '/profile', icon: User, active: pathname.startsWith('/profile'), badge: 0 },
    ];

    return (
        <nav className={styles.bottomNav} aria-label="Primary">
            <div className={styles.inner}>
                {items.map((item) => {
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.label}
                            href={item.href}
                            aria-current={item.active ? 'page' : undefined}
                            className={cn(styles.navItem, item.active && styles.active)}
                        >
                            <span className={styles.iconWrapper}>
                                <Icon
                                    size={21}
                                    strokeWidth={item.active ? 2.4 : 2}
                                    className={styles.icon}
                                    fill={item.active && item.label === 'Wishlist' ? 'currentColor' : 'none'}
                                />
                                {item.badge > 0 && (
                                    <span className={styles.badge}>{item.badge > 99 ? '99+' : item.badge}</span>
                                )}
                            </span>
                            <span className={styles.label}>{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
