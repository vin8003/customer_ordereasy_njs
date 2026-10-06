'use client';

import React, { useState } from 'react';
import { useAppNavigation } from '@/hooks/useAppNavigation';
import { Mail, Phone, ChevronDown, MessageCircle, ChevronRight } from 'lucide-react';
import PageHeader from '@/app/components/PageHeader';

export default function SupportPage() {
    const { handleBack } = useAppNavigation();
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    const toggleFaq = (index: number) => {
        setOpenFaq(openFaq === index ? null : index);
    };

    const faqs = [
        {
            question: "How do I track my order?",
            answer: "You can track your order status in the 'Order History' section under your Profile. Click on any order to see its current status."
        },
        {
            question: "What is the return policy?",
            answer: "We accept returns for damaged or incorrect items within 48 hours of delivery. Please contact support with photos of the issue."
        },
        {
            question: "How do I use my loyalty points?",
            answer: "Loyalty points (Cashback) are automatically applied to your next purchase from the specific retailer where you earned them."
        },
        {
            question: "Can I change my delivery address?",
            answer: "Yes, you can manage your addresses in the 'My Addresses' section. For active orders, please contact the retailer directly."
        }
    ];

    return (
        <div className="min-h-dvh bg-[var(--canvas)] pb-[var(--bottom-nav-space)]">
            <PageHeader title="Help & Support" subtitle="We're here to help" onBack={handleBack} />

            <main className="mx-auto max-w-2xl space-y-6 px-[var(--gutter)] py-4">

                {/* Contact Options */}
                <section className="rounded-[var(--r-lg)] border border-[var(--line)] bg-white p-4">
                    <h2 className="mb-3 text-base font-extrabold tracking-tight text-[var(--ink)]">Contact us</h2>
                    <div className="space-y-2.5">
                        <a href="mailto:support@ordereasy.com" className="group flex items-center gap-3 rounded-[var(--r-md)] border border-[var(--line)] p-3 transition-colors hover:border-[var(--brand-200)] hover:bg-[var(--brand-50)]">
                            <div className="flex size-10 items-center justify-center rounded-xl bg-[var(--brand-50)] text-[var(--brand-600)]">
                                <Mail size={19} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold text-[var(--ink)]">Email Support</p>
                                <p className="text-[13px] text-[var(--ink-3)]">support@ordereasy.com</p>
                            </div>
                            <ChevronRight size={18} className="text-[var(--ink-4)]" />
                        </a>

                        <a href="tel:+919876543210" className="group flex items-center gap-3 rounded-[var(--r-md)] border border-[var(--line)] p-3 transition-colors hover:border-[var(--fresh-100)] hover:bg-[var(--fresh-50)]">
                            <div className="flex size-10 items-center justify-center rounded-xl bg-[var(--fresh-50)] text-[var(--fresh-700)]">
                                <Phone size={19} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold text-[var(--ink)]">Call Us</p>
                                <p className="text-[13px] text-[var(--ink-3)]">+91 98765 43210</p>
                            </div>
                            <ChevronRight size={18} className="text-[var(--ink-4)]" />
                        </a>

                        <div className="mt-3 flex items-start gap-3 rounded-[var(--r-md)] bg-[var(--amber-50)] p-3.5">
                            <MessageCircle size={18} className="mt-0.5 shrink-0 text-[var(--amber-700)]" />
                            <p className="text-[13px] leading-relaxed text-[#78350f]">
                                For urgent issues with an ongoing order, please contact the Retailer directly from the Order Details page.
                            </p>
                        </div>
                    </div>
                </section>

                {/* FAQs */}
                <section>
                    <h2 className="mb-3 px-1 text-base font-extrabold tracking-tight text-[var(--ink)]">Frequently asked questions</h2>
                    <div className="overflow-hidden rounded-[var(--r-lg)] border border-[var(--line)] bg-white">
                        {faqs.map((faq, index) => (
                            <div key={index} className="border-[var(--line)] [&:not(:first-child)]:border-t">
                                <button
                                    type="button"
                                    onClick={() => toggleFaq(index)}
                                    aria-expanded={openFaq === index}
                                    className="flex w-full items-center justify-between gap-3 p-4 text-left transition-colors hover:bg-[var(--surface-2)]"
                                >
                                    <span className="text-sm font-semibold text-[var(--ink)]">{faq.question}</span>
                                    <ChevronDown
                                        size={18}
                                        className={`shrink-0 text-[var(--ink-4)] transition-transform duration-200 ${openFaq === index ? 'rotate-180' : ''}`}
                                    />
                                </button>
                                {openFaq === index && (
                                    <div className="px-4 pb-4 text-[13px] leading-relaxed text-[var(--ink-3)] animate-in fade-in slide-in-from-top-1 duration-200">
                                        {faq.answer}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
}
