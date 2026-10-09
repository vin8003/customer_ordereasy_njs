'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Store, Truck, Gift, ChevronRight } from 'lucide-react';
import LoadingScreen from '@/app/components/LoadingScreen';
import { Button } from '@/app/components/ui/Button';
import BrandLogo from '@/app/components/BrandLogo';
import { hasConfirmedLocation, requestAndPersistLocation } from '@/utils/location';
import styles from './WelcomeScreen.module.css';

export default function Home() {
    const router = useRouter();
    const [checking, setChecking] = useState(true);
    const [isLocating, setIsLocating] = useState(false);

    useEffect(() => {
        if (hasConfirmedLocation()) {
            router.replace('/retailers');
            return;
        }
        setChecking(false);
    }, [router]);

    const handleUseLocation = async () => {
        setIsLocating(true);
        sessionStorage.setItem('location_prompted', '1');
        try {
            const loc = await requestAndPersistLocation();
            if (loc) {
                router.replace('/retailers');
                return;
            }
            router.replace('/city-selection');
        } finally {
            setIsLocating(false);
        }
    };

    const handleChooseCity = () => {
        sessionStorage.setItem('location_prompted', '1');
        router.push('/city-selection');
    };

    if (checking) {
        return <LoadingScreen message="Loading..." fullScreen />;
    }

    return (
        <div className={styles.container}>
            <div className={styles.glow} aria-hidden="true" />
            <main className={styles.card}>
                <BrandLogo size="lg" showTagline className={styles.brand} />

                <h1 className={styles.title}>
                    Your neighbourhood stores, <span>delivered.</span>
                </h1>
                <p className={styles.subtitle}>
                    Find local shops near you and order groceries, essentials, and more for delivery or pickup.
                </p>

                <ul className={styles.features}>
                    <li>
                        <span className={styles.featureIcon}><Store size={18} /></span>
                        <span><strong>Trusted local shops</strong>Prices set by stores you know</span>
                    </li>
                    <li>
                        <span className={`${styles.featureIcon} ${styles.featureGreen}`}><Truck size={18} /></span>
                        <span><strong>Delivery or pickup</strong>Choose what works for you</span>
                    </li>
                    <li>
                        <span className={`${styles.featureIcon} ${styles.featureAmber}`}><Gift size={18} /></span>
                        <span><strong>Rewards on every order</strong>Earn points &amp; cashback</span>
                    </li>
                </ul>

                <div className={styles.buttonGroup}>
                    <Button
                        fullWidth
                        size="lg"
                        onClick={handleUseLocation}
                        isLoading={isLocating}
                        className={styles.primaryButton}
                    >
                        <MapPin size={18} />
                        Use my location
                    </Button>
                    <button type="button" onClick={handleChooseCity} className={styles.secondaryButton}>
                        Choose city manually
                        <ChevronRight size={16} />
                    </button>
                </div>
            </main>
        </div>
    );
}
