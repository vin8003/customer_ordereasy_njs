/** Run with: npm test (node --test, TypeScript stripped at runtime). */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { getVisibleInvoicePdfUrl } from './orderInvoicePdfUrl.ts';

describe('getVisibleInvoicePdfUrl', () => {
    it('returns the trimmed top-level invoice_pdf_url when it is a non-empty string', () => {
        assert.equal(
            getVisibleInvoicePdfUrl({ invoice_pdf_url: 'https://example.com/dummy-invoice.pdf' }),
            'https://example.com/dummy-invoice.pdf'
        );
        assert.equal(
            getVisibleInvoicePdfUrl({ invoice_pdf_url: '  https://example.com/invoices/101.pdf  ' }),
            'https://example.com/invoices/101.pdf'
        );
        assert.equal(
            getVisibleInvoicePdfUrl({ invoice_pdf_url: '/dummy/invoices/101.pdf' }),
            '/dummy/invoices/101.pdf'
        );
    });

    it('returns null when invoice_pdf_url is omitted, null, blank, or not a string', () => {
        for (const order of [
            {},
            { invoice_pdf_url: undefined },
            { invoice_pdf_url: null },
            { invoice_pdf_url: '' },
            { invoice_pdf_url: '   ' },
            { invoice_pdf_url: 12 as unknown as string },
            { invoice_pdf_url: true as unknown as string },
            { invoice_pdf_url: { href: 'https://example.com/hidden.pdf' } as unknown as string },
        ]) {
            assert.equal(getVisibleInvoicePdfUrl(order), null, JSON.stringify(order));
        }
        assert.equal(getVisibleInvoicePdfUrl(undefined), null);
        assert.equal(getVisibleInvoicePdfUrl(null), null);
    });

    it('does not invent a link from invoice_id, invoice_number, or a nested invoice object', () => {
        assert.equal(
            getVisibleInvoicePdfUrl({
                invoice_id: 99,
                invoice_number: 'INV-1001',
                invoice: { url: 'https://example.com/nested.pdf', pdf_url: 'https://example.com/nested-pdf.pdf' },
            }),
            null
        );
        assert.equal(
            getVisibleInvoicePdfUrl({
                invoice_pdf_url: null,
                invoice_number: 'INV-1001',
                invoice: { url: 'https://example.com/nested.pdf' },
            }),
            null
        );
        assert.equal(
            getVisibleInvoicePdfUrl({
                invoice_pdf_url: '   ',
                invoice: { pdf_url: 'https://example.com/nested-pdf.pdf' },
            }),
            null
        );
        assert.equal(
            getVisibleInvoicePdfUrl({
                invoice_pdf_url: 'https://example.com/visible.pdf',
                invoice: { pdf_url: 'https://example.com/other.pdf' },
            }),
            'https://example.com/visible.pdf'
        );
    });

    it('rejects javascript:, data:, and vbscript: values so they are never used as href', () => {
        assert.equal(getVisibleInvoicePdfUrl({ invoice_pdf_url: 'javascript:alert(1)' }), null);
        assert.equal(getVisibleInvoicePdfUrl({ invoice_pdf_url: '  DATA:text/html,hi  ' }), null);
        assert.equal(getVisibleInvoicePdfUrl({ invoice_pdf_url: 'vbscript:msgbox(1)' }), null);
    });
});
