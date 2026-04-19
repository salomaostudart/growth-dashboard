/**
 * Auth utilities.
 * Access control is managed via Supabase invite-only mode — no client-side allowlist needed.
 */

export function redirectToLogin(returnPath?: string): void {
  const redirect = returnPath || window.location.pathname;
  // Use trailing slash (/login/) to avoid double-redirect on static Astro hosting
  // (/login → /login/ adds ~300ms on mobile — PSI #56 fix)
  window.location.replace(
    `/login/${redirect !== '/' ? `?redirect=${encodeURIComponent(redirect)}` : ''}`,
  );
}
