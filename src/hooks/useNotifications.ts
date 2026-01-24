import { useEffect } from 'react';
import { messaging, onMessage, requestNotificationPermission } from '@/services/firebase';
import { apiService } from '@/services/api';
import { useRouter } from 'next/navigation';

export const useNotifications = () => {
    const router = useRouter();

    useEffect(() => {
        const setupNotifications = async () => {
            if (typeof window === 'undefined' || !messaging) return;

            // 1. Request permission and get token
            const token = await requestNotificationPermission();
            if (token) {
                console.log('FCM Token:', token);
                await apiService.registerDeviceToken(token);
            }

            // 2. Handle foreground messages
            const broadcast = new BroadcastChannel('fcm_updates');

            const processMessage = (payload: any) => {
                // Show a browser notification or a custom UI toast
                if (payload.notification) {
                    const { title, body } = payload.notification;

                    if (Notification.permission === 'granted') {
                        const notification = new Notification(title || 'Order Update', {
                            body: body,
                            icon: '/logo.png',
                            data: payload.data
                        });

                        notification.onclick = (event) => {
                            event.preventDefault();
                            handleNotificationClick(payload.data);
                            notification.close();
                        };
                    }
                }

                // Handle silent updates (e.g., chat message or order status)
                const dataType = (payload.data?.type || payload.data?.event || '') as string;
                console.log('Classifying FCM message:', { dataType, data: payload.data });

                if (payload.data?.is_silent === 'true' || dataType || payload.data?.order_id) {
                    let eventName = 'fcm_message';

                    const isChat = ['new_message', 'chat', 'order_chat'].includes(dataType);
                    const isOrder = ['order_status_update', 'order_refresh', 'order_update', 'new_order'].includes(dataType);

                    if (isChat) {
                        eventName = 'fcm_chat_message';
                    } else if (isOrder || payload.data?.order_id) {
                        eventName = 'fcm_order_update';
                    }

                    console.log(`Dispatching event: ${eventName}`, payload.data);
                    window.dispatchEvent(new CustomEvent(eventName, { detail: payload }));
                }
            };

            const unsubscribe = onMessage(messaging, (payload) => {
                console.log('Foreground message received:', payload);
                processMessage(payload);
                // Also broadcast to other tabs
                broadcast.postMessage(payload);
            });

            // Listen for broadcasts from other tabs or service worker
            broadcast.onmessage = (event) => {
                console.log('Received broadcast message:', event.data);
                processMessage(event.data);
            };

            return () => {
                unsubscribe();
                broadcast.close();
            };
        };

        if (apiService.isAuthenticated()) {
            setupNotifications();
        }
    }, [router]);

    const handleNotificationClick = (data: any) => {
        const orderId = data?.order_id || data?.id;
        if (orderId) {
            router.push(`/orders/detail?id=${orderId}`);
        }
    };
};
