const ALLOWED_DOMAINS: string[] = [];
const ALLOWED_EMAILS = ['salomaostudart@gmail.com', 'gabrielstudart0@gmail.com', 'paulorodriges1912@gmail.com'];

export function isEmailAllowed(email: string): boolean {
  if (!email) return false;
  const domain = email.split('@')[1]?.toLowerCase();
  return ALLOWED_DOMAINS.includes(domain) || ALLOWED_EMAILS.includes(email.toLowerCase());
}

export function redirectToLogin(returnPath?: string): void {
  const redirect = returnPath || window.location.pathname;
  window.location.replace('/login' + (redirect !== '/' ? '?redirect=' + encodeURIComponent(redirect) : ''));
}
