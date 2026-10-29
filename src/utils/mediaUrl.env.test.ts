import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

describe('API_ORIGIN from NEXT_PUBLIC_API_BASE_URL', () => {
    it('uses the env base (trailing slash trimmed) for the API origin and media URLs', async () => {
        process.env.NEXT_PUBLIC_API_BASE_URL = 'http://127.0.0.1:8100/';
        // Fresh module instance so the env value is read at import time.
        const { API_ORIGIN, resolveMediaUrl } = await import('./mediaUrl.ts?env-base');
        assert.equal(API_ORIGIN, 'http://127.0.0.1:8100');
        assert.equal(resolveMediaUrl('/media/shop.png'), 'http://127.0.0.1:8100/media/shop.png');
        delete process.env.NEXT_PUBLIC_API_BASE_URL;
    });
});
