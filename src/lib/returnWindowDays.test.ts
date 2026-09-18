/** Run with: npm test (node --test, TypeScript stripped at runtime). */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { formatVisibleReturnWindowDays, getVisibleReturnWindowDays } from './returnWindowDays.ts';

describe('getVisibleReturnWindowDays', () => {
    it('returns the parsed days when the API sent a present numeric value other than 0', () => {
        assert.equal(getVisibleReturnWindowDays({ return_window_days: 7 }), 7);
        assert.equal(getVisibleReturnWindowDays({ return_window_days: '14' }), 14);
        assert.equal(getVisibleReturnWindowDays({ return_window_days: ' 3 ' }), 3);
        assert.equal(getVisibleReturnWindowDays({ return_window_days: 1 }), 1);
    });

    it('returns null when return_window_days is missing, null, blank, zero, or non-numeric', () => {
        for (const order of [
            {},
            { return_window_days: undefined },
            { return_window_days: null },
            { return_window_days: '' },
            { return_window_days: '   ' },
            { return_window_days: 0 },
            { return_window_days: '0' },
            { return_window_days: '0.00' },
            { return_window_days: 'abc' },
            { return_window_days: '7 days' },
            { return_window_days: true as unknown as number },
            { return_window_days: { days: 7 } as unknown as number },
            { return_window_days: [7] as unknown as number },
            { return_window_days: NaN },
            { return_window_days: Infinity },
        ]) {
            assert.equal(getVisibleReturnWindowDays(order), null, JSON.stringify(order));
        }
    });

    it('does not invent days from refund or item-level return fields', () => {
        assert.equal(
            getVisibleReturnWindowDays({
                refund_amount: '50.00',
                returned_quantity: 2,
                items: [{ returned_quantity: 1 }],
            }),
            null
        );
        assert.equal(
            getVisibleReturnWindowDays({
                return_window_days: null,
                refund_amount: '50.00',
                items: [{ returned_quantity: 3 }],
            }),
            null
        );
        assert.equal(
            getVisibleReturnWindowDays({
                return_window_days: '  ',
                refund_amount: 10,
                returned_quantity: 1,
            }),
            null
        );
        assert.equal(
            getVisibleReturnWindowDays({
                return_window_days: 7,
                refund_amount: '50.00',
                items: [{ returned_quantity: 1 }],
            }),
            7
        );
    });
});

describe('formatVisibleReturnWindowDays', () => {
    it('returns a compact day/days label when the window should show', () => {
        assert.equal(formatVisibleReturnWindowDays({ return_window_days: 7 }), '7 days');
        assert.equal(formatVisibleReturnWindowDays({ return_window_days: '1' }), '1 day');
        assert.equal(formatVisibleReturnWindowDays({ return_window_days: ' 14 ' }), '14 days');
    });

    it('returns null instead of inventing a placeholder', () => {
        for (const order of [
            {},
            { return_window_days: null },
            { return_window_days: 0 },
            { return_window_days: 'nope' },
            { refund_amount: '20', items: [{ returned_quantity: 1 }] },
        ]) {
            assert.equal(formatVisibleReturnWindowDays(order), null, JSON.stringify(order));
        }
    });
});
