/**
 * Auth utilities.
 * Access control is managed via Supabase invite-only mode — no client-side allowlist needed.
 */

export function redirectToLogin(returnPath?: string): void {
  const redirect = returnPath || window.location.pathname;
  window.location.replace(
    `/login${redirect !== '/' ? `?redirect=${encodeURIComponent(redirect)}` : ''}`,
  );
}
