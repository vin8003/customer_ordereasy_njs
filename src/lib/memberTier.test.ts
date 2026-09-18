/** Run with: npm test (node --test, TypeScript stripped at runtime). */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { getVisibleMemberTier } from './memberTier.ts';

describe('getVisibleMemberTier', () => {
    it('returns the trimmed top-level member_tier when the API sent a non-empty string', () => {
        assert.equal(getVisibleMemberTier({ member_tier: 'Gold' }), 'Gold');
        assert.equal(getVisibleMemberTier({ member_tier: '  Silver  ' }), 'Silver');
    });

    it('returns null when member_tier is omitted, null, blank, or not a string', () => {
        for (const profile of [
            {},
            { member_tier: undefined },
            { member_tier: null },
            { member_tier: '' },
            { member_tier: '   ' },
            { member_tier: 2 as unknown as string },
            { member_tier: true as unknown as string },
            { member_tier: { name: 'Gold' } as unknown as string },
        ]) {
            assert.equal(getVisibleMemberTier(profile), null, JSON.stringify(profile));
        }
    });

    it('does not invent a tier from nested membership, loyalty, or alias fields', () => {
        assert.equal(
            getVisibleMemberTier({
                membership: { tier: 'Platinum' },
                tier: 'Platinum',
                loyalty_tier: 'Gold',
            }),
            null
        );
        assert.equal(
            getVisibleMemberTier({
                member_tier: null,
                membership: { tier: 'Platinum' },
                loyalty_tier: 'Gold',
            }),
            null
        );
        assert.equal(
            getVisibleMemberTier({
                member_tier: '   ',
                membership: { tier: 'Platinum' },
            }),
            null
        );
        assert.equal(
            getVisibleMemberTier({
                member_tier: 'Gold',
                membership: { tier: 'Other' },
                loyalty_tier: 'Silver',
                tier: 'Bronze',
            }),
            'Gold'
        );
    });
});
