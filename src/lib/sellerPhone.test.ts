/** Run with: npm test (node --test, TypeScript stripped at runtime). */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { visibleSellerPhone } from './sellerPhone.ts';

describe('visibleSellerPhone — store/header phone line', () => {
    it('returns a trimmed top-level seller_phone when it is non-empty', () => {
        assert.equal(visibleSellerPhone({ seller_phone: '  9876543210  ' }), '9876543210');
        assert.equal(visibleSellerPhone({ seller_phone: '+91 98765 43210' }), '+91 98765 43210');
    });

    it('renders nothing for null, blank, or absent seller_phone', () => {
        assert.equal(visibleSellerPhone({ seller_phone: null }), null);
        assert.equal(visibleSellerPhone({ seller_phone: '' }), null);
        assert.equal(visibleSellerPhone({ seller_phone: '   ' }), null);
        assert.equal(visibleSellerPhone({}), null);
        assert.equal(visibleSellerPhone(undefined), null);
        assert.equal(visibleSellerPhone(null), null);
    });

    it('does not invent a phone from retailer_phone, phone, or nested fields', () => {
        assert.equal(
            visibleSellerPhone({
                retailer_phone: '1111111111',
            } as { seller_phone?: string | null }),
            null
        );
        assert.equal(
            visibleSellerPhone({
                seller_phone: '   ',
                phone: '2222222222',
                phone_number: '3333333333',
                retailer_phone: '4444444444',
            } as { seller_phone?: string | null }),
            null
        );
        assert.equal(
            visibleSellerPhone({
                seller_phone: '9876543210',
                retailer_phone: '0000000000',
            } as { seller_phone?: string | null }),
            '9876543210'
        );
    });

    it('does not invent a phone from non-string top-level values', () => {
        assert.equal(visibleSellerPhone({ seller_phone: 9876543210 as unknown as string }), null);
        assert.equal(
            visibleSellerPhone({ seller_phone: { number: '9876543210' } as unknown as string }),
            null
        );
    });
});
