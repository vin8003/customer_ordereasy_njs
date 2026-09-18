/** Run with: npm test (node --test, TypeScript stripped at runtime). */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
    formatVisibleOrderListEtaMinutes,
    visibleOrderListEtaMinutes,
} from './orderListEtaMinutes.ts';

describe('formatVisibleOrderListEtaMinutes', () => {
    it('returns ETA copy for a present finite minute count greater than 0', () => {
        assert.equal(formatVisibleOrderListEtaMinutes(25), 'ETA 25 min');
        assert.equal(formatVisibleOrderListEtaMinutes('40'), 'ETA 40 min');
        assert.equal(formatVisibleOrderListEtaMinutes(' 15 '), 'ETA 15 min');
        assert.equal(formatVisibleOrderListEtaMinutes(12.5), 'ETA 12.5 min');
        assert.equal(formatVisibleOrderListEtaMinutes('7.5'), 'ETA 7.5 min');
    });

    it('hides missing, null, blank, non-numeric, zero, and non-positive values', () => {
        for (const value of [
            undefined,
            null,
            '',
            '   ',
            0,
            '0',
            '0.00',
            -5,
            '-3',
            'abc',
            '25 min',
            '₹10',
            NaN,
            Infinity,
            -Infinity,
            true,
            false,
            {},
            [],
            { eta_minutes: 20 },
        ]) {
            assert.equal(formatVisibleOrderListEtaMinutes(value), null, String(value));
        }
    });
});

describe('visibleOrderListEtaMinutes — order list row ETA', () => {
    it('reads only top-level eta_minutes when it is a present positive count', () => {
        assert.equal(visibleOrderListEtaMinutes({ eta_minutes: 25 }), 'ETA 25 min');
        assert.equal(visibleOrderListEtaMinutes({ eta_minutes: ' 30 ' }), 'ETA 30 min');
    });

    it('renders nothing for null, blank, or absent eta_minutes', () => {
        assert.equal(visibleOrderListEtaMinutes({ eta_minutes: null }), null);
        assert.equal(visibleOrderListEtaMinutes({ eta_minutes: '' }), null);
        assert.equal(visibleOrderListEtaMinutes({}), null);
        assert.equal(visibleOrderListEtaMinutes(undefined), null);
        assert.equal(visibleOrderListEtaMinutes(null), null);
    });

    it('does not invent ETA from courier ISO time, prep minutes, or OE-322 fees', () => {
        assert.equal(
            visibleOrderListEtaMinutes({
                estimated_delivery_time: '2026-09-18T16:00:00Z',
                delivery_info: { estimated_delivery_time: '2026-09-18T16:00:00Z' },
                preparation_time_minutes: 20,
                delivery_fee: '30.00',
                discount_amount: 5,
            }),
            null
        );
        assert.equal(
            visibleOrderListEtaMinutes({
                eta_minutes: null,
                estimated_delivery_time: '2026-09-18T16:00:00Z',
                preparation_time_minutes: 45,
                delivery_fee: '15.00',
            }),
            null
        );
        assert.equal(
            visibleOrderListEtaMinutes({
                eta_minutes: 18,
                estimated_delivery_time: '2026-09-18T16:00:00Z',
                delivery_fee: '30.00',
            }),
            'ETA 18 min'
        );
    });
});
