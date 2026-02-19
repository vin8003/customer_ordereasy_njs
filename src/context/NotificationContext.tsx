'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiService, Notification } from '@/services/api';

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    isLoading: boolean;
    error: string | null;
    refreshNotifications: () => Promise<void>;
    markAsRead: (id: number) => Promise<void>;
    markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const refreshNotifications = useCallback(async () => {
        if (!apiService.isAuthenticated()) {
            setNotifications([]);
            setUnreadCount(0);
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            // Fetch notifications
            const data = await apiService.getNotifications();
            const notifs = Array.isArray(data) ? data : data.results || [];

            setNotifications(notifs);
            setUnreadCount(notifs.filter((n: Notification) => !n.is_read).length);
        } catch (error: any) {
            console.error("Failed to fetch notifications", error);
            if (error.response && error.response.status === 403) {
                setError("Authentication failed. Please login again.");
            } else {
                setError("Failed to load notifications.");
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshNotifications();

        // Optional: Poll for notifications every minute or on window focus
        const interval = setInterval(refreshNotifications, 60000);

        const handleFocus = () => refreshNotifications();
        window.addEventListener('focus', handleFocus);

        return () => {
            clearInterval(interval);
            window.removeEventListener('focus', handleFocus);
        };
    }, [refreshNotifications]);

    const markAsRead = async (id: number) => {
        try {
            // Optimistic update
            setNotifications(prev => prev.map(n =>
                n.id === id ? { ...n, is_read: true } : n
            ));
            setUnreadCount(prev => Math.max(0, prev - 1));

            await apiService.markNotificationRead(id);
        } catch (error) {
            console.error("Failed to mark notification as read", error);
            // Revert changes if needed, but for read status it's usually fine not to
            refreshNotifications();
        }
    };

    const markAllAsRead = async () => {
        // Implement if backend supports it, otherwise loop (not ideal) or just mark visible ones
        // For now, we'll iterate locally and optimistically update
        const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);

        if (unreadIds.length === 0) return;

        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);

        // Call API for each (limit parallelism or add bulk endpoint later)
        // Ideally backend should have 'mark all read' endpoint
        try {
            await Promise.all(unreadIds.map(id => apiService.markNotificationRead(id)));
        } catch (e) {
            console.error("Error marking all read", e);
            refreshNotifications();
        }
    };

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            isLoading,
            error,
            refreshNotifications,
            markAsRead,
            markAllAsRead
        }}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotification() {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
}
