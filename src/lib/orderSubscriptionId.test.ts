/** Run with: npm test (node --test, TypeScript stripped at runtime). */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { getVisibleSubscriptionId } from './orderSubscriptionId.ts';

describe('getVisibleSubscriptionId', () => {
    it('returns the trimmed top-level subscription_id when the API sent a non-empty string', () => {
        assert.equal(getVisibleSubscriptionId({ subscription_id: 'sub_abc123' }), 'sub_abc123');
        assert.equal(getVisibleSubscriptionId({ subscription_id: '  8842  ' }), '8842');
        assert.equal(
            getVisibleSubscriptionId({ subscription_id: '550e8400-e29b-41d4-a716-446655440000' }),
            '550e8400-e29b-41d4-a716-446655440000'
        );
    });

    it('returns a finite non-zero numeric subscription_id as a plain string', () => {
        assert.equal(getVisibleSubscriptionId({ subscription_id: 8842 }), '8842');
        assert.equal(getVisibleSubscriptionId({ subscription_id: 12.5 }), '12.5');
    });

    it('returns null when subscription_id is omitted, null, blank, zero, or not a string/number', () => {
        for (const order of [
            {},
            { subscription_id: undefined },
            { subscription_id: null },
            { subscription_id: '' },
            { subscription_id: '   ' },
            { subscription_id: 0 },
            { subscription_id: Number.NaN },
            { subscription_id: Number.POSITIVE_INFINITY },
            { subscription_id: Number.NEGATIVE_INFINITY },
            { subscription_id: true },
            { subscription_id: false },
            { subscription_id: { id: 'nope' } },
            { subscription_id: ['sub_abc123'] },
        ]) {
            assert.equal(getVisibleSubscriptionId(order), null, JSON.stringify(order));
        }
    });

    it('does not invent an id from nested subscription or other order fields', () => {
        assert.equal(
            getVisibleSubscriptionId({
                order_number: 'OE-1001',
                subscription: { id: 99, subscription_id: 'nested' },
                plan_id: 7,
            }),
            null
        );
        assert.equal(
            getVisibleSubscriptionId({
                subscription_id: null,
                subscription: { id: 99 },
                plan_id: 7,
            }),
            null
        );
        assert.equal(
            getVisibleSubscriptionId({
                subscription_id: '   ',
                subscription: { id: 'hidden' },
            }),
            null
        );
        assert.equal(
            getVisibleSubscriptionId({
                subscription_id: 'visible-sub',
                subscription: { id: 'other' },
                order_number: 'OE-1001',
            }),
            'visible-sub'
        );
    });
});
