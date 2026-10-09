'use client';

import React, { useRef, useEffect } from 'react';
import { useNotification } from '@/context/NotificationContext';
import { useRouter } from 'next/navigation';
import { Bell, Check, ShoppingBag, Tag, Info, AlertCircle, MessageCircle } from 'lucide-react';
import styles from './NotificationDropdown.module.css';

interface NotificationDropdownProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function NotificationDropdown({ isOpen, onClose }: NotificationDropdownProps) {
    const { notifications, unreadCount, markAsRead, markAllAsRead, isLoading, error } = useNotification();
    const router = useRouter();
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element | null;
            // The bell toggles the dropdown itself; closing here too would make it reopen on the same tap.
            if (target?.closest?.('[data-notification-trigger]')) return;
            if (dropdownRef.current && !dropdownRef.current.contains(target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const getIcon = (notification: any) => {
        if (notification.title.toLowerCase().includes('message')) {
            return <MessageCircle size={17} className="text-[var(--fresh-700)]" />;
        }

        switch (notification.notification_type) {
            case 'order_update': return <ShoppingBag size={17} className="text-[var(--brand-600)]" />;
            case 'promotion': return <Tag size={17} className="text-[var(--fresh-700)]" />;
            case 'reminder': return <AlertCircle size={17} className="text-[var(--amber-700)]" />;
            default: return <Info size={17} className="text-[var(--ink-3)]" />;
        }
    };

    return (
        <div className={styles.dropdown} ref={dropdownRef} role="dialog" aria-label="Notifications">
            <div className={styles.header}>
                <h3 className={styles.title}>Notifications</h3>
                {unreadCount > 0 && (
                    <button type="button" onClick={markAllAsRead} className={styles.markAllBtn}>
                        Mark all as read
                    </button>
                )}
            </div>

            <div className={styles.list}>
                {isLoading ? (
                    <div className={styles.emptyState}>Loading...</div>
                ) : error ? (
                    <div className={styles.emptyState}>
                        <AlertCircle size={28} className="mb-2 text-[var(--rose-600)]" />
                        <p className="px-4 text-center text-sm text-[var(--rose-600)]">{error}</p>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className={styles.emptyState}>
                        <Bell size={28} className="mb-2 text-[var(--ink-4)]" />
                        <p>No notifications yet</p>
                    </div>
                ) : (
                    notifications.map(notification => (
                        <div
                            key={notification.id}
                            className={`${styles.item} ${!notification.is_read ? styles.unread : ''}`}
                            onClick={() => {
                                if (!notification.is_read) markAsRead(notification.id);

                                if (notification.order_id) {
                                    // Navigate to order or chat
                                    const isChat = notification.title.toLowerCase().includes('message');
                                    const targetUrl = isChat
                                        ? `/orders/chat?id=${notification.order_id}`
                                        : `/orders/detail?id=${notification.order_id}`;

                                    // Close dropdown and navigate
                                    onClose();
                                    // We need useRouter but hooks can't be conditional or inside callback.
                                    // So we must add useRouter at the top.
                                    router.push(targetUrl);
                                }
                            }}
                        >
                            <div className={styles.iconContainer}>
                                {getIcon(notification)}
                            </div>
                            <div className={styles.content}>
                                <h4 className={styles.itemTitle}>{notification.title}</h4>
                                <p className={styles.itemMessage}>{notification.message}</p>
                                <span className={styles.time}>
                                    {new Date(notification.created_at).toLocaleDateString()} • {new Date(notification.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                            {!notification.is_read && <div className={styles.dot} />}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
