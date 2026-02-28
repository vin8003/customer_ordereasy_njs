'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { apiService, getErrorMessage } from '../../services/api';
import styles from './ForgotPassword.module.css';
import { Mail, Lock, Key } from 'lucide-react';

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [step, setStep] = useState(1); // 1: Request OTP, 2: Reset Password
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleRequestOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await apiService.forgotPasswordEmail(email);
            setSuccess(response.message || 'OTP sent successfully to your email.');
            setStep(2);
        } catch (err: any) {
            console.error(err);
            setError(getErrorMessage(err));
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            setIsLoading(false);
            return;
        }

        try {
            const response = await apiService.resetPasswordEmail({
                email,
                otp_code: otp,
                new_password: password,
                confirm_password: confirmPassword
            });

            setSuccess(response.message || 'Password reset successfully!');
            setTimeout(() => {
                router.push('/login');
            }, 3000);
        } catch (err: any) {
            console.error(err);
            setError(getErrorMessage(err));
        } finally {
            setIsLoading(false);
        }
    };

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
                    <h1 className={styles.title}>Reset Password</h1>
                    <p className={styles.subtitle}>
                        {step === 1
                            ? "Enter your email to receive a reset OTP"
                            : "Check your email for the OTP code"}
                    </p>
                </div>

                {step === 1 ? (
                    <form onSubmit={handleRequestOTP} className={styles.form}>
                        {error && <div className={styles.errorAlert}>{error}</div>}
                        {success && <div className={styles.successAlert}>{success}</div>}

                        <Input
                            label="Email Address"
                            placeholder="Enter your registered email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            type="email"
                            icon={<Mail size={18} />}
                            required
                        />

                        <Button
                            type="submit"
                            isLoading={isLoading}
                            fullWidth
                            className={styles.submitBtn}
                        >
                            Send OTP
                        </Button>
                    </form>
                ) : (
                    <form onSubmit={handleResetPassword} className={styles.form}>
                        {error && <div className={styles.errorAlert}>{error}</div>}
                        {success && <div className={styles.successAlert}>{success}</div>}

                        <Input
                            label="OTP Code"
                            placeholder="Enter 6-digit OTP"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            type="text"
                            maxLength={6}
                            icon={<Key size={18} />}
                            required
                        />

                        <Input
                            label="New Password"
                            placeholder="Create a new password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            type="password"
                            icon={<Lock size={18} />}
                            required
                        />

                        <Input
                            label="Confirm New Password"
                            placeholder="Confirm your new password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            type="password"
                            icon={<Lock size={18} />}
                            required
                        />

                        <Button
                            type="submit"
                            isLoading={isLoading}
                            fullWidth
                            className={styles.submitBtn}
                        >
                            Reset Password
                        </Button>

                        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setStep(1)}
                            >
                                Back
                            </Button>
                        </div>
                    </form>
                )}

                <div className={styles.backToLogin}>
                    <p>Remembered your password?</p>
                    <Link href="/login" className={styles.loginLink}>Back to Login</Link>
                </div>
            </div>
        </div>
    );
}
