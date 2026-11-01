'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Flag, X } from 'lucide-react';
import toast from '@/lib/toast';
import { apiService } from '@/services/api';
import {
    buildReportPayload,
    REPORT_TEXT_MAX,
    reportErrorMessage,
    reportReasons,
    reportSuccessMessage,
    validateReport,
    type ReportReason,
} from '@/lib/reportForm';
import styles from './ReportButton.module.css';

interface Props {
    retailerId: number | string;
    /** Report this product; leave out to report the shop. */
    productId?: number | null;
    label?: string;
}

/** Small "Report" link that opens a sheet. Reports go to the OrderEasy team for review. */
export function ReportButton({ retailerId, productId, label }: Props) {
    const router = useRouter();
    const target = productId ? 'product' : 'shop';
    const [open, setOpen] = useState(false);
    const [reason, setReason] = useState<ReportReason | ''>('');
    const [text, setText] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [sending, setSending] = useState(false);

    const sheet = useRef<HTMLDivElement>(null);
    const opener = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
        window.addEventListener('keydown', onKey);
        // Keep the page behind the sheet from scrolling, and move focus into the sheet.
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        sheet.current?.focus();
        const trigger = opener.current;
        return () => {
            window.removeEventListener('keydown', onKey);
            document.body.style.overflow = previousOverflow;
            trigger?.focus();
        };
    }, [open]);

    const start = () => {
        if (!apiService.isAuthenticated()) {
            toast.info('Log in to report.');
            const back = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/';
            router.push(`/login?redirect=${encodeURIComponent(back)}`);
            return;
        }
        setReason('');
        setText('');
        setError(null);
        setOpen(true);
    };

    const send = async () => {
        const problem = validateReport(target, reason, text);
        if (problem) {
            setError(problem);
            return;
        }
        setSending(true);
        setError(null);
        try {
            const data = await apiService.reportRetailer(retailerId, buildReportPayload(reason as ReportReason, text, productId));
            toast.success(reportSuccessMessage(data));
            setOpen(false);
        } catch (err) {
            setError(reportErrorMessage(err));
        } finally {
            setSending(false);
        }
    };

    return (
        <>
            <button ref={opener} type="button" className={styles.trigger} onClick={start} data-testid={`report-${target}`}>
                <Flag size={13} /> {label || (target === 'product' ? 'Report this product' : 'Report this shop')}
            </button>
            {open && (
                <div className={styles.backdrop} onClick={() => !sending && setOpen(false)} data-testid="report-sheet">
                    <div
                        ref={sheet}
                        tabIndex={-1}
                        className={styles.sheet}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="report-title"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className={styles.head}>
                            <h2 id="report-title" className={styles.title}>
                                {target === 'product' ? 'Report this product' : 'Report this shop'}
                            </h2>
                            <button type="button" className={styles.close} onClick={() => setOpen(false)} aria-label="Close">
                                <X size={18} />
                            </button>
                        </div>
                        <p className={styles.note}>Our team checks every report. It stays private; the shop does not see who sent it.</p>
                        <fieldset className={styles.reasons}>
                            <legend className={styles.legend}>What is wrong?</legend>
                            {reportReasons(target).map((r) => (
                                <label key={r.value} className={`${styles.reason} ${reason === r.value ? styles.reasonOn : ''}`}>
                                    <input
                                        type="radio"
                                        name="report-reason"
                                        value={r.value}
                                        checked={reason === r.value}
                                        onChange={() => setReason(r.value)}
                                        data-testid={`report-reason-${r.value}`}
                                    />
                                    {r.label}
                                </label>
                            ))}
                        </fieldset>
                        <label className={styles.legend} htmlFor="report-text">Details (optional)</label>
                        <textarea
                            id="report-text"
                            className={styles.text}
                            rows={3}
                            maxLength={REPORT_TEXT_MAX}
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Tell us what happened"
                            data-testid="report-text"
                        />
                        <div className={styles.count}>{text.length}/{REPORT_TEXT_MAX}</div>
                        {error && <p className={styles.error} role="alert" data-testid="report-error">{error}</p>}
                        <button type="button" className={styles.send} onClick={send} disabled={sending || !reason} data-testid="report-send">
                            {sending ? 'Sending…' : 'Send report'}
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}

export default ReportButton;
