import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { resolveMediaUrl } from './mediaUrl.ts';

describe('resolveMediaUrl', () => {
    it('returns null for empty values', () => {
        assert.equal(resolveMediaUrl(undefined), null);
        assert.equal(resolveMediaUrl(null), null);
        assert.equal(resolveMediaUrl(''), null);
    });

    it('keeps absolute URLs untouched', () => {
        assert.equal(resolveMediaUrl('https://images.ordereasy.win/a.png'), 'https://images.ordereasy.win/a.png');
    });

    it('prefixes relative paths with the media host', () => {
        assert.equal(resolveMediaUrl('/media/shop.png'), 'https://api.ordereasy.win/media/shop.png');
        assert.equal(resolveMediaUrl('media/shop.png'), 'https://api.ordereasy.win/media/shop.png');
    });
});
