/**
 * Build-time configuration resolved from environment variables.
 * PUBLIC_* vars are safe to embed in the client bundle (no secrets).
 */

// Google Analytics 4 tracking ID
// biome-ignore lint/suspicious/noExplicitAny: import.meta.env not typed in plain .ts files outside Astro frontmatter
export const GA4_ID: string = (import.meta as any).env?.PUBLIC_GA4_ID || 'G-LGNLCC6DYD';
