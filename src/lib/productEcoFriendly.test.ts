/** Run with: npm test (node --test, TypeScript stripped at runtime). */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
    ECO_FRIENDLY_BADGE_LABEL,
    visibleProductEcoFriendlyBadge,
} from './productEcoFriendly.ts';

describe('visibleProductEcoFriendlyBadge — product eco-friendly badge', () => {
    it('returns the Eco-friendly label when top-level eco_friendly is true', () => {
        assert.equal(
            visibleProductEcoFriendlyBadge({ eco_friendly: true }),
            ECO_FRIENDLY_BADGE_LABEL
        );
        assert.equal(visibleProductEcoFriendlyBadge({ eco_friendly: true }), 'Eco-friendly');
    });

    it('renders nothing for false, null, or absent eco_friendly', () => {
        assert.equal(visibleProductEcoFriendlyBadge({ eco_friendly: false }), null);
        assert.equal(visibleProductEcoFriendlyBadge({ eco_friendly: null }), null);
        assert.equal(visibleProductEcoFriendlyBadge({}), null);
        assert.equal(visibleProductEcoFriendlyBadge(undefined), null);
        assert.equal(visibleProductEcoFriendlyBadge(null), null);
    });

    it('does not invent a badge from nested objects, sibling flags, or non-boolean values', () => {
        assert.equal(
            visibleProductEcoFriendlyBadge({
                is_eco_friendly: true,
            } as { eco_friendly?: boolean | null }),
            null
        );
        assert.equal(
            visibleProductEcoFriendlyBadge({
                eco: { friendly: true },
            } as { eco_friendly?: boolean | null }),
            null
        );
        assert.equal(
            visibleProductEcoFriendlyBadge({
                tags: ['eco_friendly'],
            } as { eco_friendly?: boolean | null }),
            null
        );
        assert.equal(
            visibleProductEcoFriendlyBadge({
                eco_friendly: 'true',
            } as unknown as { eco_friendly?: boolean | null }),
            null
        );
        assert.equal(
            visibleProductEcoFriendlyBadge({
                eco_friendly: 1,
            } as unknown as { eco_friendly?: boolean | null }),
            null
        );
        assert.equal(
            visibleProductEcoFriendlyBadge({
                eco_friendly: false,
                eco: { friendly: true },
                tags: ['eco_friendly'],
            } as { eco_friendly?: boolean | null }),
            null
        );
        assert.equal(
            visibleProductEcoFriendlyBadge({
                eco_friendly: true,
                eco: { friendly: false },
                tags: ['plastic'],
            } as { eco_friendly?: boolean | null }),
            ECO_FRIENDLY_BADGE_LABEL
        );
    });
});
