import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

// Messaging is only available in the browser
const messaging = typeof window !== 'undefined' ? getMessaging(app) : null;

export const requestNotificationPermission = async () => {
    if (typeof window === 'undefined' || !messaging) return null;

    try {
        if (Capacitor.isNativePlatform()) {
            let permStatus = await PushNotifications.checkPermissions();
            if (permStatus.receive === 'prompt') {
                permStatus = await PushNotifications.requestPermissions();
            }
            if (permStatus.receive === 'granted') {
                return new Promise<string | null>((resolve) => {
                    let regListener: any = null;
                    let errListener: any = null;

                    const cleanup = () => {
                        if (regListener) regListener.remove();
                        if (errListener) errListener.remove();
                    };

                    PushNotifications.addListener('registration', (token) => {
                        console.log('Native FCM Token registered:', token.value);
                        cleanup();
                        resolve(token.value);
                    }).then(l => regListener = l);

                    PushNotifications.addListener('registrationError', (err) => {
                        console.error('Native FCM registration error:', err);
                        cleanup();
                        resolve(null);
                    }).then(l => errListener = l);

                    PushNotifications.register();
                });
            }
            return null;
        } else {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                const swUrl = `/firebase-messaging-sw.js?apiKey=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}&authDomain=${process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}&projectId=${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}&storageBucket=${process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}&messagingSenderId=${process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID}&appId=${process.env.NEXT_PUBLIC_FIREBASE_APP_ID}`;

                const registration = await navigator.serviceWorker.register(swUrl);
                const token = await getToken(messaging, {
                    vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
                    serviceWorkerRegistration: registration
                });
                return token;
            }
        }
    } catch (error) {
        console.error('Error requesting notification permission:', error);
    }
    return null;
};

export { auth, messaging, onMessage };
