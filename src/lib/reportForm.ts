/**
 * Customer "Report" form logic (backend POST /api/retailer/<shop_id>/report/).
 * A report never hides anything by itself; the OrderEasy team reviews it.
 */

export type ReportReason = 'misleading' | 'offensive' | 'illegal' | 'wrong_price' | 'not_delivered' | 'other';
export type ReportTarget = 'product' | 'shop';

export const REPORT_TEXT_MAX = 1000;

const ALL: { value: ReportReason; label: string; targets: ReportTarget[] }[] = [
    { value: 'misleading', label: 'Fake or misleading', targets: ['product', 'shop'] },
    { value: 'offensive', label: 'Offensive content', targets: ['product', 'shop'] },
    { value: 'illegal', label: 'Illegal or restricted item', targets: ['product', 'shop'] },
    { value: 'wrong_price', label: 'Wrong price', targets: ['product'] },
    { value: 'not_delivered', label: 'Order never delivered', targets: ['shop'] },
    { value: 'other', label: 'Other', targets: ['product', 'shop'] },
];

export function reportReasons(target: ReportTarget): { value: ReportReason; label: string }[] {
    return ALL.filter((r) => r.targets.includes(target)).map(({ value, label }) => ({ value, label }));
}

/** Returns an error to show, or null when the form can be sent. */
export function validateReport(target: ReportTarget, reason: string, text: string): string | null {
    if (!reason) return 'Choose a reason.';
    if (!reportReasons(target).some((r) => r.value === reason)) return 'Choose a reason from the list.';
    if ((text || '').length > REPORT_TEXT_MAX) return `Keep the details under ${REPORT_TEXT_MAX} characters.`;
    return null;
}

export function buildReportPayload(reason: ReportReason, text: string, productId?: number | null) {
    const payload: { reason: ReportReason; text: string; product_id?: number } = {
        reason,
        text: (text || '').trim(),
    };
    if (productId) payload.product_id = productId;
    return payload;
}

/** Message after a successful call. A repeat report is a 200 with created=false. */
export function reportSuccessMessage(data: { created?: boolean; message?: string } | null | undefined): string {
    if (data?.message) return data.message;
    return data?.created === false
        ? 'You already reported this. Our team will look into it.'
        : 'Thanks. Our team will look into it.';
}

type ApiError = { response?: { status?: number; data?: Record<string, unknown> } };

/** Plain message for a failed report. */
export function reportErrorMessage(err: unknown): string {
    const res = (err as ApiError)?.response;
    const status = res?.status;
    const data = res?.data || {};
    if (status === 401 || status === 403) return 'Log in to send a report.';
    if (status === 404) return 'This shop is not available any more.';
    if (status === 429) return 'You have sent many reports today. Please try again tomorrow.';
    if (status === 400) {
        if (typeof data.error === 'string') return data.error;
        for (const key of ['reason', 'text', 'product_id']) {
            const v = data[key];
            if (Array.isArray(v) && typeof v[0] === 'string') return v[0];
        }
    }
    return 'Could not send the report. Please try again.';
}
