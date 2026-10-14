'use client';

import React, { useState, useEffect } from 'react';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { auth } from '@/services/firebase';
import { apiService } from '@/services/api';
import { Button } from '@/app/components/ui/Button';
import { X, Phone, ShieldCheck, Loader2 } from 'lucide-react';
import { canRequestOTP, recordOTPRequest } from '@/utils/rateLimit';

interface PhoneVerificationProps {
    isOpen: boolean;
    onClose: () => void;
    onVerified: () => void;
    initialPhone?: string; // e.g. from user profile
}

export default function PhoneVerification({ isOpen, onClose, onVerified, initialPhone = '' }: PhoneVerificationProps) {
    const [step, setStep] = useState<'request' | 'verify'>('request');
    const [phone, setPhone] = useState(initialPhone);
    const [otp, setOtp] = useState('');
    const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [cooldown, setCooldown] = useState<{ allowed: boolean; remaining: number; reason?: 'cooldown' | 'attempts' }>({ allowed: true, remaining: 0 });

    useEffect(() => {
        if (!isOpen || !phone) return;
        
        const formattedPhone = phone.startsWith('+91') ? phone : `+91${phone}`;
        const rateLimitKey = `otp_limit_phone_${formattedPhone.replace(/\s+/g, '')}`;
        
        const updateCooldown = () => {
            const check = canRequestOTP(rateLimitKey);
            setCooldown(check);
        };

        updateCooldown(); // Initial check

        const timer = setInterval(() => {
            const check = canRequestOTP(rateLimitKey);
            setCooldown(check);
            // We could clear interval if check.allowed, but standard interval keeps hitting
            // which handles state moving into cooldown later or updates every second.
        }, 1000);

        return () => clearInterval(timer);
    }, [isOpen, phone]);

    // Reset state when opened
    useEffect(() => {
        if (isOpen) {
            setStep('request');
            setError('');
            setLoading(false);
            setOtp('');
            // Ensure phone is consistent if passed
            if (initialPhone) setPhone(initialPhone);
        }
    }, [isOpen, initialPhone]);

    // Helper to fully destroy the existing reCAPTCHA instance
    const clearRecaptcha = () => {
        if (window.recaptchaVerifier) {
            try {
                window.recaptchaVerifier.clear();
            } catch (_) {}
            window.recaptchaVerifier = null;
        }
    };

    // Initialize (or re-initialize) reCAPTCHA whenever the request step is shown
    useEffect(() => {
        if (!isOpen || step !== 'request') return;

        // Always start fresh so we never reuse a verifier whose DOM node is gone
        clearRecaptcha();

        try {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                'size': 'normal',
                'callback': (_response: any) => {
                    // reCAPTCHA solved – actual send happens in handleSendOtp
                },
                'expired-callback': () => {
                    setError('Recaptcha expired, please try again.');
                }
            });
            window.recaptchaVerifier.render();
        } catch (e) {
            console.error('Recaptcha init error:', e);
        }

        return () => {
            // Clean up when the component unmounts or the modal closes
            if (!isOpen) clearRecaptcha();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, step]);

    const handleSendOtp = async () => {
        if (!phone || phone.length < 10) {
            setError('Please enter a valid phone number');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const formattedPhone = phone.startsWith('+91') ? phone : `+91${phone}`;
            const rateLimitKey = `otp_limit_phone_${formattedPhone.replace(/\s+/g, '')}`;
            
            const check = canRequestOTP(rateLimitKey);
            if (!check.allowed) {
                setError(check.reason === 'attempts' 
                    ? `Too many attempts. Try again in ${Math.ceil(check.remaining / 60)} mins.` 
                    : `Please wait ${check.remaining}s before resending.`);
                setLoading(false);
                return;
            }

            const appVerifier = window.recaptchaVerifier;

            const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
            setConfirmationResult(confirmation);
            setStep('verify');
            
            // Record OTP request on success trigger
            recordOTPRequest(rateLimitKey);
        } catch (err: any) {
            console.error('Error sending OTP:', err);
            setError(err.message || 'Failed to send OTP. Try again.');
            // Destroy stale verifier so it is recreated fresh on next attempt
            clearRecaptcha();
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!otp || otp.length < 6) {
            setError('Please enter a valid 6-digit OTP');
            return;
        }

        setLoading(true);
        setError('');

        try {
            if (!confirmationResult) throw new Error("Session expired");

            const result = await confirmationResult.confirm(otp);
            const user = result.user;
            const token = await user.getIdToken();

            // Send to backend
            await apiService.verifyPhoneWithFirebase(phone, token);

            // Success
            onVerified();
            onClose();

        } catch (err: any) {
            console.error("Error verifying OTP:", err);
            setError('Invalid OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-[rgb(11_19_36/0.45)] backdrop-blur-sm sm:items-center sm:p-4">
            <div
                role="dialog"
                aria-modal="true"
                aria-label="Verify phone"
                className="relative w-full max-w-[420px] rounded-t-[var(--r-xl)] bg-white p-6 pb-[calc(24px+env(safe-area-inset-bottom))] shadow-[var(--sh-lg)] animate-in fade-in slide-in-from-bottom-8 duration-300 sm:rounded-[var(--r-xl)] sm:pb-6"
            >
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close"
                    className="absolute top-4 right-4 flex size-9 items-center justify-center rounded-[10px] bg-[var(--surface-2)] text-[var(--ink-2)] hover:bg-[var(--surface-3)]"
                >
                    <X size={18} />
                </button>

                <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-[var(--fresh-50)] text-[var(--fresh-700)]">
                    <ShieldCheck size={24} />
                </div>
                <h2 className="mb-1 text-xl font-extrabold tracking-tight text-[var(--ink)]">Verify phone</h2>

                {error && (
                    <div className="my-3 rounded-[var(--r-md)] border border-[var(--rose-100)] bg-[var(--rose-50)] px-3 py-2.5 text-[13px] font-semibold text-[#9f1239]">
                        {error}
                    </div>
                )}

                {step === 'request' && (
                    <div className="flex flex-col gap-4">
                        <p className="text-sm leading-relaxed text-[var(--ink-3)]">
                            We need to verify your phone number to proceed with the order.
                        </p>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-[13px] font-semibold text-[var(--ink-2)]">Phone Number</label>
                            <div className="flex h-12 items-center rounded-xl border border-[var(--line-strong)] px-3.5 focus-within:border-[var(--brand-500)] focus-within:ring-4 focus-within:ring-[var(--brand-100)]">
                                <Phone size={16} className="mr-2 text-[var(--ink-4)]" />
                                <span className="mr-2 font-semibold text-[var(--ink-3)]">+91</span>
                                <input
                                    type="tel"
                                    value={phone.replace('+91', '')}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="Enter mobile number"
                                    className="min-w-0 flex-1 bg-transparent text-[15px] text-[var(--ink)] outline-none"
                                    disabled={loading} // Fixed phone for now if user logged in? Maybe allow edit if profile allows.
                                />
                            </div>
                        </div>

                        <div id="recaptcha-container" style={{ margin: '0 auto' }}></div>

                        <Button onClick={handleSendOtp} disabled={loading || !cooldown.allowed} size="lg" fullWidth>
                            {loading ? <Loader2 className="animate-spin" /> : cooldown.allowed ? 'Send OTP' : cooldown.reason === 'attempts' ? `Retry in ${Math.ceil(cooldown.remaining / 60)}m` : `Resend in ${cooldown.remaining}s`}
                        </Button>
                    </div>
                )}

                {step === 'verify' && (
                    <div className="flex flex-col gap-4">
                        <p className="text-sm leading-relaxed text-[var(--ink-3)]">
                            Enter the 6-digit code sent to <b className="text-[var(--ink)]">{phone}</b>
                        </p>

                        <input
                            type="text"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            placeholder="••••••"
                            maxLength={6}
                            aria-label="OTP code"
                            className="h-14 w-full rounded-xl border border-[var(--line-strong)] text-center font-mono text-2xl tracking-[0.5em] text-[var(--ink)] outline-none focus:border-[var(--brand-500)] focus:ring-4 focus:ring-[var(--brand-100)]"
                        />

                        <Button onClick={handleVerifyOtp} disabled={loading} size="lg" fullWidth>
                            {loading ? <Loader2 className="animate-spin" /> : 'Verify Code'}
                        </Button>

                        <button
                            type="button"
                            onClick={() => {
                                // Clear reCAPTCHA before going back so it is recreated fresh
                                clearRecaptcha();
                                setStep('request');
                            }}
                            className="text-sm font-semibold text-[var(--brand-600)] hover:underline"
                        >
                            Change Number / Resend
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
}

// Add global type for recaptcha
declare global {
    interface Window {
        recaptchaVerifier: any;
    }
}
