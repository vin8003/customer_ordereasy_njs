importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

const urlParams = new URLSearchParams(self.location.search);
firebase.initializeApp({
    apiKey: urlParams.get('apiKey'),
    authDomain: urlParams.get('authDomain'),
    projectId: urlParams.get('projectId'),
    storageBucket: urlParams.get('storageBucket'),
    messagingSenderId: urlParams.get('messagingSenderId'),
    appId: urlParams.get('appId'),
});

const messaging = firebase.messaging();

// Broadcast Channel for cross-tab communication
const broadcast = new BroadcastChannel('fcm_updates');

messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);

    // Broadcast to open tabs for real-time updates even if backgrounded
    broadcast.postMessage(payload);

    // If it's a silent update, we don't need to show a notification
    if (payload.data?.is_silent === 'true' && !payload.notification) {
        return;
    }

    // Customize notification if needed
    const notificationTitle = payload.notification?.title || 'Order Update';
    const notificationOptions = {
        body: payload.notification?.body,
        icon: '/logo.png',
        data: payload.data
    };

    // Firebase handles showing notifications automatically if 'notification' property is present.
    // However, if we want to ensure it shows or customize behavior:
    // self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const data = event.notification.data;
    const orderId = data?.order_id || data?.id;

    if (!orderId) return;

    const urlToOpen = new URL(`/orders/detail?id=${orderId}`, self.location.origin).href;

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            // Check if there is already a window open with this URL and focus it
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            // If no window is open, open a new one
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});
