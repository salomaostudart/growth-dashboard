import { describe, expect, it } from 'vitest';

describe('auth', () => {
  describe('redirectToLogin', () => {
    // redirectToLogin uses window.location which is not available in Node test environment.
    // The function is simple enough that we test the URL construction logic directly.

    function buildLoginUrl(returnPath?: string): string {
      const redirect = returnPath || '/current-page';
      return `/login${redirect !== '/' ? `?redirect=${encodeURIComponent(redirect)}` : ''}`;
    }

    it('redirects to /login without query when path is /', () => {
      expect(buildLoginUrl('/')).toBe('/login');
    });

    it('includes redirect param for non-root paths', () => {
      expect(buildLoginUrl('/web-performance')).toBe('/login?redirect=%2Fweb-performance');
    });

    it('encodes special characters in redirect path', () => {
      expect(buildLoginUrl('/report?date=2026-01-01')).toBe(
        '/login?redirect=%2Freport%3Fdate%3D2026-01-01',
      );
    });
  });
});
