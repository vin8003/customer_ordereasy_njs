'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Mail, Phone, ChevronDown, ChevronUp, MessageCircle } from 'lucide-react';
import { Button } from '@/app/components/ui/Button';

export default function SupportPage() {
    const router = useRouter();
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
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <header className="bg-white p-4 shadow-sm sticky top-0 z-10 flex items-center gap-4">
                <button
                    onClick={() => router.back()}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ArrowLeft size={20} className="text-gray-600" />
                </button>
                <h1 className="text-lg font-bold text-gray-800">Help & Support</h1>
            </header>

            <main className="p-4 max-w-2xl mx-auto space-y-6">

                {/* Contact Options */}
                <section className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                    <h2 className="text-base font-semibold text-gray-800 mb-4">Contact Us</h2>
                    <div className="space-y-3">
                        <a href="mailto:support@shopeasy.com" className="flex items-center gap-4 p-3 rounded-lg border border-gray-100 hover:bg-blue-50 transition-colors group">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-200">
                                <Mail size={20} />
                            </div>
                            <div className="flex-1">
                                <p className="font-medium text-gray-900">Email Support</p>
                                <p className="text-sm text-gray-500">support@shopeasy.com</p>
                            </div>
                        </a>

                        <a href="tel:+919876543210" className="flex items-center gap-4 p-3 rounded-lg border border-gray-100 hover:bg-green-50 transition-colors group">
                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 group-hover:bg-green-200">
                                <Phone size={20} />
                            </div>
                            <div className="flex-1">
                                <p className="font-medium text-gray-900">Call Us</p>
                                <p className="text-sm text-gray-500">+91 98765 43210</p>
                            </div>
                        </a>

                        <div className="bg-blue-50 p-4 rounded-lg mt-4 flex items-start gap-3">
                            <MessageCircle size={20} className="text-blue-600 mt-1 shrink-0" />
                            <p className="text-sm text-blue-800">
                                For urgent issues with an ongoing order, please contact the Retailer directly from the Order Details page.
                            </p>
                        </div>
                    </div>
                </section>

                {/* FAQs */}
                <section>
                    <h2 className="text-base font-semibold text-gray-800 mb-4 px-1">Frequently Asked Questions</h2>
                    <div className="space-y-2">
                        {faqs.map((faq, index) => (
                            <div key={index} className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
                                <button
                                    onClick={() => toggleFaq(index)}
                                    className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                                >
                                    <span className="font-medium text-gray-700">{faq.question}</span>
                                    {openFaq === index ? (
                                        <ChevronUp size={18} className="text-gray-400" />
                                    ) : (
                                        <ChevronDown size={18} className="text-gray-400" />
                                    )}
                                </button>
                                {openFaq === index && (
                                    <div className="px-4 pb-4 pt-0 text-sm text-gray-600 leading-relaxed border-t border-gray-50 mt-2 pt-3">
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
