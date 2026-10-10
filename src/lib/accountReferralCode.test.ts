/** Run with: npm test (node --test, TypeScript stripped at runtime). */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { visibleAccountReferralCode } from './accountReferralCode.ts';

describe('visibleAccountReferralCode — account referral line', () => {
    it('returns a trimmed top-level referral_code when it is non-empty', () => {
        assert.equal(visibleAccountReferralCode({ referral_code: ' REF123 ' }), 'REF123');
        assert.equal(visibleAccountReferralCode({ referral_code: 'FRIEND50' }), 'FRIEND50');
    });

    it('renders nothing for null, blank, or absent referral_code', () => {
        assert.equal(visibleAccountReferralCode({ referral_code: null }), null);
        assert.equal(visibleAccountReferralCode({ referral_code: '' }), null);
        assert.equal(visibleAccountReferralCode({ referral_code: ' ' }), null);
        assert.equal(visibleAccountReferralCode({}), null);
        assert.equal(visibleAccountReferralCode(undefined), null);
        assert.equal(visibleAccountReferralCode(null), null);
    });

    it('does not invent a code from non-strings or nested referral objects', () => {
        assert.equal(visibleAccountReferralCode({ referral_code: 10 }), null);
        assert.equal(visibleAccountReferralCode({ referral_code: { code: 'HIDDEN' } }), null);
        const nestedOnly = { referral: { code: 'HIDDEN' } };
        assert.equal(visibleAccountReferralCode(nestedOnly), null);
        const blankWithNested = { referral_code: ' ', referral: { code: 'HIDDEN' } };
        assert.equal(visibleAccountReferralCode(blankWithNested), null);
        const visibleWithNested = { referral_code: 'VISIBLE', referral: { code: 'OTHER' } };
        assert.equal(visibleAccountReferralCode(visibleWithNested), 'VISIBLE');
    });
});
