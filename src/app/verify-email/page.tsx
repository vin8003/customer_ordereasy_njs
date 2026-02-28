'use client';

import React, { useState, Suspense } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { apiService, getErrorMessage } from '../../services/api';
import styles from './VerifyEmail.module.css';
import { Key } from 'lucide-react';
import LoadingScreen from '@/app/components/LoadingScreen';

function VerifyEmailContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get('email') || '';

    const [otp, setOtp] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccess('');

        try {
            await apiService.verifyEmailOTP(email, otp);
            setSuccess('Email verified successfully! Redirecting...');
            setTimeout(() => {
                router.push('/retailers');
            }, 2000);
        } catch (err: any) {
            console.error(err);
            setError(getErrorMessage(err));
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        setIsResending(true);
        setError('');
        setSuccess('');

        try {
            await apiService.resendEmailOTP(email);
            setSuccess('A new OTP has been sent to your email.');
        } catch (err: any) {
            console.error(err);
            setError(getErrorMessage(err));
        } finally {
            setIsResending(false);
        }
    };

    if (!email) {
        return (
            <div className={styles.container}>
                <div className={styles.card}>
                    <p className={styles.errorAlert}>Invalid verification link. Please sign up again.</p>
                    <Button onClick={() => router.push('/signup')} fullWidth>Back to Signup</Button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.header}>
                    <div className={styles.logoWrapper}>
                        <Image
                            src="/assets/images/logo.png"
                            alt="BuyEasy Logo"
                            width={100}
                            height={100}
                            className={styles.logo}
                        />
                    </div>
                    <h1 className={styles.title}>Verify Email</h1>
                    <p className={styles.subtitle}>Enter the 6-digit code sent to <strong>{email}</strong></p>
                </div>

                <form onSubmit={handleVerify} className={styles.form}>
                    {error && <div className={styles.errorAlert}>{error}</div>}
                    {success && <div className={styles.successAlert}>{success}</div>}

                    <Input
                        label="OTP Code"
                        placeholder="000000"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        type="text"
                        maxLength={6}
                        icon={<Key size={18} />}
                        required
                    />

                    <Button
                        type="submit"
                        isLoading={isLoading}
                        fullWidth
                        className={styles.verifyBtn}
                    >
                        Verify & Continue
                    </Button>
                </form>

                <div className={styles.resendSection}>
                    <p>
                        Didn't receive the code?
                        <button
                            onClick={handleResend}
                            disabled={isResending}
                            className={styles.resendBtn}
                        >
                            {isResending ? 'Sending...' : 'Resend OTP'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={<LoadingScreen message="Loading..." fullScreen />}>
            <VerifyEmailContent />
        </Suspense>
    );
}
