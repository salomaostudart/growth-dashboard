const ALLOWED_DOMAINS: string[] = ((import.meta as any).env?.PUBLIC_ALLOWED_DOMAINS || '')
  .split(',').map((d: string) => d.trim().toLowerCase()).filter(Boolean);

const ALLOWED_EMAILS: string[] = ((import.meta as any).env?.PUBLIC_ALLOWED_EMAILS || '')
  .split(',').map((e: string) => e.trim().toLowerCase()).filter(Boolean);

export function isEmailAllowed(email: string): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  const domain = normalized.split('@')[1];
  if (!domain) return false;
  return ALLOWED_DOMAINS.includes(domain) || ALLOWED_EMAILS.includes(normalized);
}

export function redirectToLogin(returnPath?: string): void {
  const redirect = returnPath || window.location.pathname;
  window.location.replace('/login' + (redirect !== '/' ? '?redirect=' + encodeURIComponent(redirect) : ''));
}
