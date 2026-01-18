'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { apiService, setAuthToken } from '../../services/api';
import styles from './Login.module.css';
import { Phone, Lock } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const response = await apiService.login(phone, password);

            // Assuming response follows the structure seen in Flutter app:
            // { tokens: { access: '...', refresh: '...' }, ... }
            if (response && response.tokens) {
                setAuthToken(response.tokens.access);
                // Store refresh token if needed, or handle in api service
                router.push('/'); // Redirect to Home
            } else {
                setError('Login failed: Invalid response format');
            }

        } catch (err: any) {
            console.error(err);
            if (err.response && err.response.data && err.response.data.detail) {
                setError(err.response.data.detail);
            } else if (err.response && err.response.status === 401) {
                setError('Invalid phone number or password');
            } else {
                setError('An unexpected error occurred. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.header}>
                    {/* Fallback to text if logo not found, or handle error */}
                    <div className={styles.logoWrapper}>
                        <Image
                            src="/assets/images/logo.png"
                            alt="BuyEasy Logo"
                            width={120}
                            height={120}
                            priority
                            className={styles.logo}
                        />
                    </div>
                    <h1 className={styles.title}>Welcome Back!</h1>
                    <p className={styles.subtitle}>Sign in to continue to your account</p>
                </div>

                <form onSubmit={handleLogin} className={styles.form}>
                    {error && <div className={styles.errorAlert}>{error}</div>}

                    <Input
                        label="Phone Number"
                        placeholder="Enter 10 digit number"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        type="tel"
                        icon={<Phone size={18} />}
                        maxLength={10}
                        required
                    />

                    <Input
                        label="Password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        type="password"
                        icon={<Lock size={18} />}
                        required
                        autoComplete="current-password"
                    />

                    <div className={styles.forgotPassword}>
                        <Link href="/forgot-password">Forgot Password?</Link>
                    </div>

                    <Button
                        type="submit"
                        isLoading={isLoading}
                        fullWidth
                        className={styles.loginBtn}
                    >
                        Log In
                    </Button>
                </form>

                <div className={styles.footer}>
                    <p>Don't have an account?</p>
                    <Link href="/signup" className={styles.signupLink}>Sign Up</Link>
                </div>
            </div>
        </div>
    );
}
