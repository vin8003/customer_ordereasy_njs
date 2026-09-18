/** Run with: npm test (node --test, TypeScript stripped at runtime). */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { visibleProductBadgeText } from './productBadgeText.ts';

describe('visibleProductBadgeText — ProductCard badge_text (OE-316 sibling)', () => {
    it('returns a trimmed top-level badge_text when it is non-empty', () => {
        assert.equal(visibleProductBadgeText({ badge_text: '  New  ' }), 'New');
        assert.equal(visibleProductBadgeText({ badge_text: 'Bestseller' }), 'Bestseller');
    });

    it('renders nothing for null, blank, or absent badge_text', () => {
        assert.equal(visibleProductBadgeText({ badge_text: null }), null);
        assert.equal(visibleProductBadgeText({ badge_text: '' }), null);
        assert.equal(visibleProductBadgeText({ badge_text: '   ' }), null);
        assert.equal(visibleProductBadgeText({}), null);
        assert.equal(visibleProductBadgeText(undefined), null);
        assert.equal(visibleProductBadgeText(null), null);
    });

    it('does not invent a badge from nested objects, offer text, or brand_name', () => {
        assert.equal(
            visibleProductBadgeText({
                badge: { text: 'Hidden Badge' },
            } as { badge_text?: string | null }),
            null
        );
        assert.equal(
            visibleProductBadgeText({
                badge_text: '   ',
                active_offer_text: '20% off',
                brand_name: 'Amul',
            } as { badge_text?: string | null }),
            null
        );
        assert.equal(
            visibleProductBadgeText({
                badge_text: 'Visible',
                active_offer_text: 'Other',
                brand_name: 'Amul',
            } as { badge_text?: string | null }),
            'Visible'
        );
    });
});
