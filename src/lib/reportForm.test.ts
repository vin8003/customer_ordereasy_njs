/** Run with: npm test (node --test, TypeScript stripped at runtime). */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
    buildReportPayload,
    REPORT_TEXT_MAX,
    reportErrorMessage,
    reportReasons,
    reportSuccessMessage,
    validateReport,
} from './reportForm.ts';

describe('reportReasons', () => {
    it('matches the backend reason codes', () => {
        const all = new Set([...reportReasons('product'), ...reportReasons('shop')].map((r) => r.value));
        assert.deepEqual([...all].sort(), ['illegal', 'misleading', 'not_delivered', 'offensive', 'other', 'wrong_price']);
    });

    it('offers delivery problems only for shops and price only for products', () => {
        assert.ok(reportReasons('shop').some((r) => r.value === 'not_delivered'));
        assert.ok(!reportReasons('product').some((r) => r.value === 'not_delivered'));
        assert.ok(reportReasons('product').some((r) => r.value === 'wrong_price'));
        assert.ok(!reportReasons('shop').some((r) => r.value === 'wrong_price'));
    });
});

describe('validateReport', () => {
    it('accepts a valid reason with or without details', () => {
        assert.equal(validateReport('product', 'misleading', ''), null);
        assert.equal(validateReport('shop', 'not_delivered', 'Paid but nothing came'), null);
        assert.equal(validateReport('product', 'other', 'x'.repeat(REPORT_TEXT_MAX)), null);
    });

    it('refuses a missing, unknown or wrong-target reason', () => {
        assert.equal(validateReport('product', '', ''), 'Choose a reason.');
        assert.equal(validateReport('product', 'spam', ''), 'Choose a reason from the list.');
        assert.equal(validateReport('product', 'not_delivered', ''), 'Choose a reason from the list.');
    });

    it('refuses details over the limit', () => {
        assert.match(validateReport('shop', 'other', 'x'.repeat(REPORT_TEXT_MAX + 1)) || '', /under 1000/);
    });
});

describe('buildReportPayload', () => {
    it('trims details and adds product_id only for a product', () => {
        assert.deepEqual(buildReportPayload('misleading', '  fake  ', 12), { reason: 'misleading', text: 'fake', product_id: 12 });
        assert.deepEqual(buildReportPayload('offensive', '', null), { reason: 'offensive', text: '' });
        assert.deepEqual(buildReportPayload('offensive', '', 0), { reason: 'offensive', text: '' });
    });
});

describe('report messages', () => {
    it('uses the server message, then falls back by created flag', () => {
        assert.equal(reportSuccessMessage({ message: 'Server says hi' }), 'Server says hi');
        assert.match(reportSuccessMessage({ created: false }), /already reported/);
        assert.match(reportSuccessMessage({ created: true }), /^Thanks/);
        assert.match(reportSuccessMessage(undefined), /^Thanks/);
    });

    it('maps each failure to a plain message', () => {
        const err = (status: number, data: Record<string, unknown> = {}) => ({ response: { status, data } });
        assert.match(reportErrorMessage(err(401)), /Log in/);
        assert.match(reportErrorMessage(err(404)), /not available/);
        assert.match(reportErrorMessage(err(429)), /many reports/);
        assert.equal(reportErrorMessage(err(400, { error: 'You cannot report your own shop.' })), 'You cannot report your own shop.');
        assert.equal(reportErrorMessage(err(400, { product_id: ['Product not found in this shop.'] })), 'Product not found in this shop.');
        assert.match(reportErrorMessage(err(500)), /try again/);
        assert.match(reportErrorMessage(new Error('Network Error')), /try again/);
        assert.match(reportErrorMessage(undefined), /try again/);
    });
});
