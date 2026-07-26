'use client';
import LoadingScreen from '@/app/components/LoadingScreen';

import React, { useState, Suspense, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { apiService, setAuthToken } from '../../services/api';
import styles from './Login.module.css';
import { Phone, Lock } from 'lucide-react';
import { useCartContext } from '@/context/CartContext';
import { auth } from '../../services/firebase';
import { GoogleAuthProvider, signInWithRedirect, getRedirectResult } from 'firebase/auth';
import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';

function LoginContent() {
    const router = useRouter();
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Google Sign-In States
    const [showPhoneModal, setShowPhoneModal] = useState(false);
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [tempToken, setTempToken] = useState('');
    const [googlePhone, setGooglePhone] = useState('');
    const [googleOtp, setGoogleOtp] = useState('');
    const [googleError, setGoogleError] = useState('');

    const { syncGuestCart } = useCartContext(); // Get sync function
    const searchParams = useSearchParams();

    useEffect(() => {
        GoogleAuth.initialize({
            clientId: '241725361064-2k6np1n9ecj2admv520596kvgker14hb.apps.googleusercontent.com',
            scopes: ['profile', 'email'],
            grantOfflineAccess: true,
        });
    }, []);

    // Handle the result when Google redirects back after signInWithRedirect
    useEffect(() => {
        const handleRedirectResult = async () => {
            try {
                const result = await getRedirectResult(auth);
                if (!result) return; // No pending redirect result

                const token = await result.user.getIdToken();
                if (!token) return;

                setIsLoading(true);
                const res = await apiService.googleLogin(token);
                if (res.status === 'phone_required') {
                    setTempToken(token);
                    setShowPhoneModal(true);
                } else if (res.tokens) {
                    setAuthToken(res.tokens.access, res.tokens.refresh);
                    await syncGuestCart();
                    const redirectPath = searchParams.get('redirect');
                    if (redirectPath) {
                        router.push(decodeURIComponent(redirectPath));
                    } else {
                        router.push('/retailers');
                    }
                }
            } catch (err: any) {
                console.error('Redirect result error:', err);
                setError(err.message || 'Google Login failed');
            } finally {
                setIsLoading(false);
            }
        };

        handleRedirectResult();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const response = await apiService.login(phone, password);

            if (response && response.tokens) {
                setAuthToken(response.tokens.access, response.tokens.refresh);

                // Sync Guest Cart
                await syncGuestCart();

                // Handle Redirect
                const redirectPath = searchParams.get('redirect');
                if (redirectPath) {
                    router.push(decodeURIComponent(redirectPath));
                } else {
                    router.push('/retailers');
                }
            } else {
                setError('Login failed: Invalid response format');
            }

        } catch (err: any) {
            console.error(err);
            if (err.response && err.response.data && err.response.data.code === 'email_not_verified') {
                const unverifiedEmail = err.response.data.email;
                router.push(`/verify-email?email=${encodeURIComponent(unverifiedEmail)}`);
                return;
            }
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

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        setError('');
        setGoogleError('');
        try {
            let token = '';

            if (Capacitor.isNativePlatform()) {
                const user = await GoogleAuth.signIn();
                token = user.authentication.idToken;
            } else {
                // Use signInWithRedirect instead of signInWithPopup:
                // - Popups are blocked by Android WebViews
                // - Redirect works in both browser and WebView environments
                // The result is handled in the useEffect above via getRedirectResult()
                const provider = new GoogleAuthProvider();
                provider.setCustomParameters({ prompt: 'select_account' });
                await signInWithRedirect(auth, provider);
                return; // Page will redirect to Google; result handled in useEffect
            }

            if (!token) {
                throw new Error('Google authentication did not return an ID token.');
            }

            const res = await apiService.googleLogin(token);
            if (res.status === 'phone_required') {
                setTempToken(token);
                setShowPhoneModal(true);
            } else if (res.tokens) {
                setAuthToken(res.tokens.access, res.tokens.refresh);
                await syncGuestCart();
                const redirectPath = searchParams.get('redirect');
                if (redirectPath) {
                    router.push(decodeURIComponent(redirectPath));
                } else {
                    router.push('/retailers');
                }
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Google Login failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGooglePhoneSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (googlePhone.length !== 10) {
            setGoogleError('Please enter a valid 10-digit number');
            return;
        }
        setIsLoading(true);
        setGoogleError('');
        try {
            const res = await apiService.googleLogin(tempToken, googlePhone);
            if (res.status === 'otp_required') {
                setShowPhoneModal(false);
                setShowOtpModal(true);
            } else if (res.tokens) {
                setAuthToken(res.tokens.access, res.tokens.refresh);
                await syncGuestCart();
                setShowPhoneModal(false);
                const redirectPath = searchParams.get('redirect');
                if (redirectPath) {
                    router.push(decodeURIComponent(redirectPath));
                } else {
                    router.push('/retailers');
                }
            }
        } catch (err: any) {
            console.error(err);
            if (err.response && err.response.data && err.response.data.error) {
                setGoogleError(err.response.data.error);
            } else {
                setGoogleError('Failed to register phone number. It may already be in use.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleOtpSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (googleOtp.length !== 6) {
            setGoogleError('Please enter a 6-digit verification code');
            return;
        }
        setIsLoading(true);
        setGoogleError('');
        try {
            const res = await apiService.googleLogin(tempToken, googlePhone, googleOtp);
            if (res.tokens) {
                setAuthToken(res.tokens.access, res.tokens.refresh);
                await syncGuestCart();
                setShowOtpModal(false);
                setGooglePhone('');
                setGoogleOtp('');
                setTempToken('');
                const redirectPath = searchParams.get('redirect');
                if (redirectPath) {
                    router.push(decodeURIComponent(redirectPath));
                } else {
                    router.push('/retailers');
                }
            }
        } catch (err: any) {
            console.error(err);
            if (err.response && err.response.data && err.response.data.error) {
                setGoogleError(err.response.data.error);
            } else {
                setGoogleError('Verification failed. Invalid or expired OTP.');
            }
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
                            width={200}
                            height={200}
                            priority
                            className={styles.logo}
                        />
                    </div>
                    <h1 className={styles.title}>
                        {showOtpModal 
                            ? 'Verify Mobile Number' 
                            : showPhoneModal 
                                ? 'One Last Step!' 
                                : 'Welcome Back!'}
                    </h1>
                    <p className={styles.subtitle}>
                        {showOtpModal
                            ? 'Enter the SMS verification code sent to your phone'
                            : showPhoneModal 
                                ? 'Please enter your mobile number to complete registration' 
                                : 'Sign in to continue to your account'}
                    </p>
                </div>

                {showOtpModal ? (
                    <form onSubmit={handleGoogleOtpSubmit} className={styles.form}>
                        {googleError && <div className={styles.errorAlert}>{googleError}</div>}

                        <Input
                            label="Verification Code"
                            placeholder="Enter 6 digit OTP"
                            value={googleOtp}
                            onChange={(e) => setGoogleOtp(e.target.value)}
                            type="text"
                            maxLength={6}
                            required
                        />

                        <Button
                            type="submit"
                            isLoading={isLoading}
                            fullWidth
                            className={styles.loginBtn}
                            style={{ marginTop: '1.5rem' }}
                        >
                            Verify & Link Account
                        </Button>

                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => {
                                setShowOtpModal(false);
                                setTempToken('');
                                setGooglePhone('');
                                setGoogleOtp('');
                            }}
                            fullWidth
                            style={{ marginTop: '0.75rem', color: 'var(--text-secondary)' }}
                        >
                            Cancel
                        </Button>
                    </form>
                ) : showPhoneModal ? (
                    <form onSubmit={handleGooglePhoneSubmit} className={styles.form}>
                        {googleError && <div className={styles.errorAlert}>{googleError}</div>}

                        <Input
                            label="Phone Number"
                            placeholder="Enter 10 digit number"
                            value={googlePhone}
                            onChange={(e) => setGooglePhone(e.target.value)}
                            type="tel"
                            icon={<Phone size={18} />}
                            maxLength={10}
                            required
                        />

                        <Button
                            type="submit"
                            isLoading={isLoading}
                            fullWidth
                            className={styles.loginBtn}
                            style={{ marginTop: '1.5rem' }}
                        >
                            Complete Setup
                        </Button>

                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => {
                                setShowPhoneModal(false);
                                setTempToken('');
                                setGooglePhone('');
                            }}
                            fullWidth
                            style={{ marginTop: '0.75rem', color: 'var(--text-secondary)' }}
                        >
                            Cancel
                        </Button>
                    </form>
                ) : (
                    <>
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

                        <div className={styles.divider}>or</div>

                        <button 
                            type="button" 
                            onClick={handleGoogleLogin} 
                            disabled={isLoading}
                            className={styles.googleBtn}
                        >
                            <span className={styles.googleIcon}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05"/>
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                </svg>
                            </span>
                            Continue with Google
                        </button>
                    </>
                )}

                <div className={styles.footer} style={{ marginTop: '1.5rem' }}>
                    <p>Don't have an account?</p>
                    <Link href="/signup" className={styles.signupLink}>Sign Up</Link>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<LoadingScreen message="Loading..." fullScreen />}>
            <LoginContent />
        </Suspense>
    );
}
