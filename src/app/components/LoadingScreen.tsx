import React from 'react';
import styles from './LoadingScreen.module.css';

interface LoadingScreenProps {
    message?: string;
    fullScreen?: boolean;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
    message = 'Loading...',
    fullScreen = false
}) => {
    return (
        <div className={`${styles.container} ${fullScreen ? styles.fullScreen : ''}`}>
            <div className={styles.content}>
                <div className={styles.logoWrapper}>
                    <img
                        src="/assets/images/logo.png"
                        alt="Order Easy"
                        className={styles.logo}
                    />
                    <div className={styles.spinnerRing}></div>
                </div>
                {message && <p className={styles.message}>{message}</p>}
            </div>
        </div>
    );
};

export default LoadingScreen;
