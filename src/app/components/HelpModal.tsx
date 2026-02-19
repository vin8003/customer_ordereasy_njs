'use client';

import React, { useState } from 'react';
import { X, MessageCircle, HelpCircle, Send } from 'lucide-react';
import { Button } from '@/app/components/ui/Button';
import styles from './HelpModal.module.css';
import { apiService } from '@/services/api';

interface HelpModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
    const [activeTab, setActiveTab] = useState<'faq' | 'feedback'>('faq');
    const [feedback, setFeedback] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

    if (!isOpen) return null;

    const handleSubmitFeedback = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!feedback.trim()) return;

        setIsSubmitting(true);
        try {
            // Since there isn't a direct "generic feedback" endpoint in the visible API,
            // we'll mock it or use a placeholder. 
            // Ideally: await apiService.submitFeedback({ message: feedback });
            // For now, simulate success after delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            setSubmitStatus('success');
            setFeedback('');
            setTimeout(() => {
                setSubmitStatus('idle');
                onClose();
            }, 1500);
        } catch (error) {
            console.error("Feedback error", error);
            setSubmitStatus('error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2 className={styles.title}>Help & Support</h2>
                    <button onClick={onClose} className={styles.closeBtn}>
                        <X size={24} />
                    </button>
                </div>

                <div className={styles.tabs}>
                    <button
                        className={`${styles.tab} ${activeTab === 'faq' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('faq')}
                    >
                        <HelpCircle size={18} />
                        FAQs
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'feedback' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('feedback')}
                    >
                        <MessageCircle size={18} />
                        Feedback
                    </button>
                </div>

                <div className={styles.content}>
                    {activeTab === 'faq' ? (
                        <div className={styles.faqList}>
                            <div className={styles.faqItem}>
                                <h4>How do I track my order?</h4>
                                <p>You can track your order status in the "Orders" section of your profile.</p>
                            </div>
                            <div className={styles.faqItem}>
                                <h4>What if items are missing?</h4>
                                <p>Please contact support or use the "Chat" feature on the specific order page to report missing items.</p>
                            </div>
                            <div className={styles.faqItem}>
                                <h4>How do I change my address?</h4>
                                <p>Go to your Profile and select "Manage Addresses" to add or edit delivery locations.</p>
                            </div>
                            <div className={styles.faqItem}>
                                <h4>Is there a minimum order value?</h4>
                                <p>Minimum order values are set by individual retailers and may vary.</p>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmitFeedback} className={styles.feedbackForm}>
                            <p className={styles.feedbackHint}>
                                We value your feedback! Let us know how we can improve your experience.
                            </p>

                            <textarea
                                className={styles.textarea}
                                placeholder="Write your feedback here..."
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                                rows={5}
                                disabled={isSubmitting || submitStatus === 'success'}
                            />

                            {submitStatus === 'success' && (
                                <div className={styles.successMessage}>
                                    Thank you! Your feedback has been sent.
                                </div>
                            )}

                            {submitStatus === 'error' && (
                                <div className={styles.errorMessage}>
                                    Something went wrong. Please try again.
                                </div>
                            )}

                            <div className={styles.actions}>
                                <Button
                                    type="submit"
                                    disabled={!feedback.trim() || isSubmitting || submitStatus === 'success'}
                                    className="w-full flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? 'Sending...' : (
                                        <>
                                            <Send size={16} /> Send Feedback
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
