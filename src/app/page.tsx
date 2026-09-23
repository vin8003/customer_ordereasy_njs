'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import LoadingScreen from '@/app/components/LoadingScreen';
import { Button } from '@/app/components/ui/Button';
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
            <div className={styles.logoContainer}>
                <Image
                    src="/assets/images/logo.png"
                    alt="Order Easy"
                    width={150}
                    height={150}
                    className={styles.logo}
                    priority
                />
            </div>
            <h1 className={styles.title}>Order Easy</h1>
            <p className={styles.subtitle}>
                Find local shops near you and order groceries, essentials, and more for delivery or pickup.
            </p>
            <div className={styles.buttonGroup}>
                <Button
                    fullWidth
                    onClick={handleUseLocation}
                    isLoading={isLocating}
                    className={styles.primaryButton}
                >
                    Use my location
                </Button>
                <button type="button" onClick={handleChooseCity} className={styles.secondaryButton}>
                    Choose city manually
                </button>
            </div>
        </div>
    );
}
