/** Optional top-level `invoice_pdf_url` on customer order detail. Display only. */

export type OptionalInvoicePdfUrl = string | null | undefined;

export interface OrderDetailOptionalInvoicePdf {
    invoice_pdf_url?: OptionalInvoicePdfUrl;
    /** Allowed on payloads / tests; never used to invent a PDF link. */
    invoice_id?: number | string | null;
    invoice_number?: string | null;
    invoice?: { url?: string | null; pdf_url?: string | null } | null;
}

const UNSAFE_HREF_PROTOCOL = /^(javascript|data|vbscript):/i;

function optionalTrimmedText(raw: unknown): string | null {
    if (typeof raw !== 'string') return null;
    const trimmed = raw.trim();
    return trimmed ? trimmed : null;
}

/**
 * Invoice PDF href from top-level `invoice_pdf_url` only.
 * Absent / undefined / null / blank / non-string → do not show.
 * Never derived from invoice_id, invoice_number, or a nested `invoice` object.
 * javascript: / data: / vbscript: values stay hidden so they are never used as href.
 */
export function getVisibleInvoicePdfUrl(order: unknown): string | null {
    if (!order || typeof order !== 'object') return null;
    const href = optionalTrimmedText((order as OrderDetailOptionalInvoicePdf).invoice_pdf_url);
    if (!href || UNSAFE_HREF_PROTOCOL.test(href)) return null;
    return href;
}
