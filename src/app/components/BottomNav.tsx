'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ShoppingBag, Heart, User } from 'lucide-react';
import { useWishlist } from '@/hooks/useWishlist';
import { useCartContext } from '@/context/CartContext';
import { apiService } from '@/services/api';
import { cn } from '@/lib/utils';

const HIDDEN_ROUTES = ['/login', '/signup', '/', '/city-selection', '/checkout', '/checkout/success', '/retailer/product'];

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
        <nav className="fixed right-0 bottom-0 left-0 z-50 flex items-center justify-around border-t border-border bg-white/80 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgba(0,0,0,0.03)] backdrop-blur-lg">
            {items.map((item) => {
                const Icon = item.icon;
                return (
                    <Link
                        key={item.label}
                        href={item.href}
                        className={cn(
                            'relative flex w-1/4 flex-col items-center justify-center space-y-1 py-3 transition-all duration-300',
                            item.active ? 'text-primary' : 'text-muted-foreground hover:text-primary'
                        )}
                    >
                        {item.active && (
                            <div className="absolute top-0 h-1 w-8 rounded-b-full bg-primary shadow-lg shadow-primary/40" />
                        )}
                        <div className="relative">
                            <Icon className={cn('h-5 w-5 transition-transform duration-300', item.active && 'scale-110')} />
                            {item.badge > 0 && (
                                <span className="absolute -top-1.5 -right-2.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-destructive px-1 text-[10px] font-bold text-white">
                                    {item.badge}
                                </span>
                            )}
                        </div>
                        <span className={cn('text-[10px] font-semibold tracking-wide', item.active ? 'opacity-100' : 'opacity-70')}>
                            {item.label}
                        </span>
                    </Link>
                );
            })}
        </nav>
    );
}
