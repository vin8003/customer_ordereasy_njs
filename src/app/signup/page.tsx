'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { apiService, setAuthToken } from '../../services/api';
import styles from './Signup.module.css';
import { Phone, Lock, User, Mail } from 'lucide-react';
import { auth } from '../../services/firebase';
import { GoogleAuthProvider, signInWithPopup, signInWithCredential } from 'firebase/auth';
import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';

export default function SignupPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Google Sign-up States
    const [showPhoneModal, setShowPhoneModal] = useState(false);
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [tempToken, setTempToken] = useState('');
    const [googlePhone, setGooglePhone] = useState('');
    const [googleOtp, setGoogleOtp] = useState('');
    const [googleError, setGoogleError] = useState('');

    useEffect(() => {
        GoogleAuth.initialize();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            setIsLoading(false);
            return;
        }

        try {
            const response = await apiService.signup({
                username: formData.phone,
                email: formData.email,
                phone_number: formData.phone,
                password: formData.password,
                password_confirm: formData.confirmPassword,
            });

            if (response && response.tokens) {
                // Defer token activation to prevent overwriting guest cart
                localStorage.setItem('temp_customer_access_token', response.tokens.access);
                if (response.tokens.refresh) {
                    localStorage.setItem('temp_customer_refresh_token', response.tokens.refresh);
                }
                router.push(`/verify-email?email=${encodeURIComponent(formData.email)}`);
            } else {
                // Handle case where tokens might not be returned immediately (verification needed)
                router.push('/login');
            }

        } catch (err: any) {
            console.error(err);
            if (err.response && err.response.data) {
                // Format errors from Django
                const errorData = err.response.data;
                let errorMessage = 'Signup failed.';
                if (typeof errorData === 'object') {
                    errorMessage = Object.entries(errorData)
                        .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
                        .join('\n');
                }
                setError(errorMessage);

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
                // Native path: GoogleAuth.signIn() returns a Google OAuth token.
                // Convert it to a Firebase ID token so the backend can verify
                // it the same way it verifies web tokens.
                const user = await GoogleAuth.signIn();
                const googleIdToken = user.authentication.idToken;
                const credential = GoogleAuthProvider.credential(googleIdToken);
                const firebaseResult = await signInWithCredential(auth, credential);
                token = await firebaseResult.user.getIdToken();
            } else {
                const provider = new GoogleAuthProvider();
                provider.setCustomParameters({ prompt: 'select_account' });
                
                const result = await signInWithPopup(auth, provider);
                token = await result.user.getIdToken();
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
                router.push('/retailers');
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
                setShowPhoneModal(false);
                router.push('/retailers');
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
                setShowOtpModal(false);
                setGooglePhone('');
                setGoogleOtp('');
                setTempToken('');
                router.push('/retailers');
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
                            width={100}
                            height={100}
                            className={styles.logo}
                        />
                    </div>
                    <h1 className={styles.title}>
                        {showOtpModal 
                            ? 'Verify Mobile Number' 
                            : showPhoneModal 
                                ? 'One Last Step!' 
                                : 'Create Account'}
                    </h1>
                    <p className={styles.subtitle}>
                        {showOtpModal
                            ? 'Enter the SMS verification code sent to your phone'
                            : showPhoneModal 
                                ? 'Please enter your mobile number to complete registration' 
                                : 'Join us and start shopping!'}
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
                            className={styles.signupBtn}
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
                            className={styles.signupBtn}
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
                        <form onSubmit={handleSignup} className={styles.form}>
                            {error && <div className={styles.errorAlert}>{error}</div>}

                            <Input
                                label="Email"
                                placeholder="Enter your email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                type="email"
                                icon={<Mail size={18} />}
                                required
                            />

                            <Input
                                label="Phone Number"
                                placeholder="Enter 10 digit number"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                type="tel"
                                icon={<Phone size={18} />}
                                maxLength={10}
                                required
                            />

                            <Input
                                label="Password"
                                placeholder="Create a password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                type="password"
                                icon={<Lock size={18} />}
                                required
                            />

                            <Input
                                label="Confirm Password"
                                placeholder="Confirm your password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                type="password"
                                icon={<Lock size={18} />}
                                required
                            />

                            <Button
                                type="submit"
                                isLoading={isLoading}
                                fullWidth
                                className={styles.signupBtn}
                            >
                                Sign Up
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
                    <p>Already have an account?</p>
                    <Link href="/login" className={styles.loginLink}>Log In</Link>
                </div>
            </div>
        </div>
    );
}
