import { useEffect } from 'react';
import { messaging, onMessage, requestNotificationPermission } from '@/services/firebase';
import { apiService } from '@/services/api';
import { useRouter } from 'next/navigation';
import { LocalNotifications } from '@capacitor/local-notifications';
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

export const useNotifications = () => {
    const router = useRouter();

    useEffect(() => {
        let unsubscribe: (() => void) | null = null;
        let broadcast: BroadcastChannel | null = null;
        let nativeClickListener: any = null;

        const setupNotifications = async () => {
            if (typeof window === 'undefined') return;

            // 1. Request permission and get token (returns native FCM token on native, web token on web)
            const token = await requestNotificationPermission();
            if (token) {
                console.log('FCM Token:', token);
                await apiService.registerDeviceToken(token);
            }

            // 2. Handle foreground and click messages
            if (Capacitor.isNativePlatform()) {
                try {
                    // Foreground Push Listener
                    const pushReceivedListener = await PushNotifications.addListener(
                        'pushNotificationReceived',
                        async (notification) => {
                            console.log('Push received in foreground:', notification);
                            try {
                                let permStatus = await LocalNotifications.checkPermissions();
                                if (permStatus.display !== 'granted') {
                                    permStatus = await LocalNotifications.requestPermissions();
                                }
                                if (permStatus.display === 'granted') {
                                    await LocalNotifications.schedule({
                                        notifications: [
                                            {
                                                title: notification.title || 'Order Update',
                                                body: notification.body || '',
                                                id: Math.floor(Math.random() * 1000000),
                                                extra: notification.data
                                            }
                                        ]
                                    });
                                }
                            } catch (err) {
                                console.error('Local notification schedule error:', err);
                            }
                        }
                    );

                    // Click/Action Listener
                    const pushActionListener = await PushNotifications.addListener(
                        'pushNotificationActionPerformed',
                        (action) => {
                            console.log('Push action performed:', action);
                            handleNotificationClick(action.notification.data);
                        }
                    );

                    nativeClickListener = {
                        remove: () => {
                            pushReceivedListener.remove();
                            pushActionListener.remove();
                        }
                    };
                } catch (e) {
                    console.error("Failed to setup native push listeners: ", e);
                }
            } else {
                if (!messaging) return;
                broadcast = new BroadcastChannel('fcm_updates');

                const processMessage = (payload: any) => {
                    // Show a browser notification or a custom UI toast
                    if (payload.notification) {
                        const { title, body } = payload.notification;

                        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
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

                unsubscribe = onMessage(messaging, (payload) => {
                    console.log('Foreground message received:', payload);
                    processMessage(payload);
                    if (broadcast) broadcast.postMessage(payload);
                });

                // Listen for broadcasts from other tabs or service worker
                broadcast.onmessage = (event) => {
                    console.log('Received broadcast message:', event.data);
                    processMessage(event.data);
                };
            }
        };

        if (apiService.isAuthenticated()) {
            setupNotifications();
        }

        return () => {
            if (unsubscribe) unsubscribe();
            if (broadcast) broadcast.close();
            if (nativeClickListener) nativeClickListener.remove();
        };
    }, [router]);

    const handleNotificationClick = (data: any) => {
        const orderId = data?.order_id || data?.id;
        if (orderId) {
            router.push(`/orders/detail?id=${orderId}`);
        }
    };
};
