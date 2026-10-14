'use client';

import React from 'react';
import { useAppNavigation } from '@/hooks/useAppNavigation';
import PageHeader from '@/app/components/PageHeader';
import { ShieldCheck, Mail, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function PrivacyPolicyPage() {
    const { handleBack } = useAppNavigation();

    return (
        <div className="min-h-screen bg-[var(--canvas)] pb-16">
            <PageHeader
                title="Privacy Policy"
                subtitle="Last updated: October 2026"
                onBack={handleBack}
            />

            <main className="mx-auto max-w-3xl px-[var(--gutter)] py-6 space-y-6">
                {/* Intro Card */}
                <div className="rounded-[var(--r-lg)] border border-[var(--line)] bg-white p-5 shadow-xs">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                            <ShieldCheck size={22} />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-[var(--ink)]">Order Easy Privacy Policy</h1>
                            <p className="text-xs text-[var(--ink-3)]">Managed by SHOP EASY</p>
                        </div>
                    </div>
                    <p className="text-sm leading-relaxed text-[var(--ink-2)]">
                        Welcome to Order Easy (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;). We are committed to protecting your privacy and ensuring transparency about how your data is collected, used, and shared. This Privacy Policy applies to our website (customer.ordereasy.win) and our mobile applications.
                    </p>
                </div>

                {/* Section 1 */}
                <section className="rounded-[var(--r-lg)] border border-[var(--line)] bg-white p-5 shadow-xs space-y-3">
                    <h2 className="text-base font-bold text-[var(--ink)]">1. Information We Collect</h2>
                    <p className="text-sm text-[var(--ink-2)]">When you use Order Easy, we may collect the following types of information:</p>
                    <ul className="list-disc pl-5 text-sm text-[var(--ink-2)] space-y-1.5">
                        <li><strong>Personal Identification:</strong> Name, phone number, email address when you register or sign in (including via Google authentication).</li>
                        <li><strong>Delivery Information:</strong> Physical addresses, delivery notes, and contact numbers to fulfill your orders.</li>
                        <li><strong>Location Data:</strong> Approximate or precise GPS location (with your consent) to find nearby retail stores and provide real-time delivery estimates.</li>
                        <li><strong>Order and Transaction Details:</strong> Products purchased, order history, timestamps, and payment transaction IDs (we do not store full payment card/UPI PIN details).</li>
                        <li><strong>Device and Usage Information:</strong> Device model, operating system version, app version, IP address, unique device identifiers, and Google Advertising ID (GAID).</li>
                    </ul>
                </section>

                {/* Section 2 */}
                <section className="rounded-[var(--r-lg)] border border-[var(--line)] bg-white p-5 shadow-xs space-y-3">
                    <h2 className="text-base font-bold text-[var(--ink)]">2. How We Use Your Information</h2>
                    <p className="text-sm text-[var(--ink-2)]">We use your data for the following purposes:</p>
                    <ul className="list-disc pl-5 text-sm text-[var(--ink-2)] space-y-1.5">
                        <li>To process, fulfill, and deliver your orders accurately.</li>
                        <li>To communicate order status, delivery notifications, and customer support updates.</li>
                        <li>To personalize your shopping experience and display relevant nearby retailers and offers.</li>
                        <li>To prevent fraud, secure our platform, and maintain system stability.</li>
                        <li>To measure and analyze app performance, installs, and advertising effectiveness via Meta (Facebook) App Events and Google services.</li>
                    </ul>
                </section>

                {/* Section 3 */}
                <section className="rounded-[var(--r-lg)] border border-[var(--line)] bg-white p-5 shadow-xs space-y-3">
                    <h2 className="text-base font-bold text-[var(--ink)]">3. Advertising & Analytics (Meta / Third Parties)</h2>
                    <p className="text-sm text-[var(--ink-2)]">
                        We use third-party analytics and advertising tools, including <strong>Meta Platforms, Inc. (Facebook SDK)</strong> and Google Analytics. These tools may collect information such as app launch events, app installations, device advertising IDs, and interaction data to help us measure campaign performance and deliver relevant promotions.
                    </p>
                    <p className="text-sm text-[var(--ink-2)]">
                        You can manage personalized advertising preferences anytime through your mobile device settings (e.g., &quot;Opt out of Ads Personalization&quot; or &quot;Reset Advertising ID&quot; in Android Settings).
                    </p>
                </section>

                {/* Section 4 */}
                <section className="rounded-[var(--r-lg)] border border-[var(--line)] bg-white p-5 shadow-xs space-y-3">
                    <h2 className="text-base font-bold text-[var(--ink)]">4. Data Sharing & Disclosure</h2>
                    <p className="text-sm text-[var(--ink-2)]">We do not sell your personal data. We only share information with:</p>
                    <ul className="list-disc pl-5 text-sm text-[var(--ink-2)] space-y-1.5">
                        <li><strong>Partner Retailers & Delivery Partners:</strong> Necessary details (such as your name, delivery address, and phone number) required to prepare and deliver your orders.</li>
                        <li><strong>Service Providers:</strong> Cloud hosting, SMS/notification gateways, and payment gateway providers who operate under strict confidentiality agreements.</li>
                        <li><strong>Legal Authorities:</strong> When required by applicable law, court order, or governmental regulation.</li>
                    </ul>
                </section>

                {/* Section 5 */}
                <section className="rounded-[var(--r-lg)] border border-[var(--line)] bg-white p-5 shadow-xs space-y-3">
                    <h2 className="text-base font-bold text-[var(--ink)]">5. Data Retention & User Rights (Account & Data Deletion)</h2>
                    <p className="text-sm text-[var(--ink-2)]">
                        You have the right to access, review, update, or request the deletion of your account and personal information at any time.
                    </p>
                    <div className="rounded-[var(--r-md)] bg-amber-50 p-3.5 text-xs leading-relaxed text-amber-900 border border-amber-200">
                        <strong>Request Data Deletion:</strong> If you wish to delete your account and associated personal data, you can submit a deletion request by emailing us at{' '}
                        <a href="mailto:support@ordereasy.com" className="font-semibold underline">support@ordereasy.com</a>{' '}
                        with the subject &quot;Data Deletion Request&quot;. We will process and confirm your request within 7 business days.
                    </div>
                </section>

                {/* Section 6 */}
                <section className="rounded-[var(--r-lg)] border border-[var(--line)] bg-white p-5 shadow-xs space-y-3">
                    <h2 className="text-base font-bold text-[var(--ink)]">6. Security of Your Information</h2>
                    <p className="text-sm text-[var(--ink-2)]">
                        We implement administrative, technical, and physical security measures to protect your personal information against unauthorized access, loss, or alteration. All communication between our applications and servers is encrypted using industry-standard SSL/TLS protocols.
                    </p>
                </section>

                {/* Contact Card */}
                <section className="rounded-[var(--r-lg)] border border-[var(--line)] bg-white p-5 shadow-xs space-y-3">
                    <h2 className="text-base font-bold text-[var(--ink)]">7. Contact Us</h2>
                    <p className="text-sm text-[var(--ink-2)]">
                        If you have questions, concerns, or requests regarding this Privacy Policy or your data, please contact our support team:
                    </p>
                    <div className="flex items-center gap-3 pt-2 text-sm text-[var(--ink)]">
                        <Mail size={18} className="text-blue-600" />
                        <span>Email: <a href="mailto:support@ordereasy.com" className="font-semibold text-blue-600 hover:underline">support@ordereasy.com</a></span>
                    </div>
                </section>

                <div className="pt-2 text-center">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:underline"
                    >
                        <ArrowLeft size={16} /> Back to Home
                    </Link>
                </div>
            </main>
        </div>
    );
}
