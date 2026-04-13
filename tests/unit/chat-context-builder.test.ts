import { describe, it, expect } from 'vitest';
import { buildChatContext, estimateTokens } from '../../src/utils/chat-context-builder';
import { generateWebMetrics, generateSeoMetrics, generateEmailMetrics, generateCrmMetrics, generateMartechHealth } from '../../src/utils/mock-generator';

const data = {
  web: generateWebMetrics(),
  seo: generateSeoMetrics(),
  email: generateEmailMetrics(),
  crm: generateCrmMetrics(),
  martech: generateMartechHealth(),
};

describe('buildChatContext', () => {
  it('returns a non-empty string', () => {
    const ctx = buildChatContext(data, 'admin');
    expect(ctx).toBeTruthy();
    expect(typeof ctx).toBe('string');
  });

  it('includes all section tags', () => {
    const ctx = buildChatContext(data, 'admin');
    expect(ctx).toContain('[WEB]');
    expect(ctx).toContain('[SEO]');
    expect(ctx).toContain('[EMAIL]');
    expect(ctx).toContain('[CRM]');
    expect(ctx).toContain('[MARTECH]');
  });

  it('includes session and user counts', () => {
    const ctx = buildChatContext(data, 'admin');
    expect(ctx).toContain('Sessions:');
    expect(ctx).toContain('Users:');
  });

  it('includes channel mix percentages', () => {
    const ctx = buildChatContext(data, 'admin');
    expect(ctx).toContain('organic');
    expect(ctx).toContain('direct');
    expect(ctx).toContain('%');
  });

  it('includes CRM funnel stages', () => {
    const ctx = buildChatContext(data, 'admin');
    expect(ctx).toContain('leads');
    expect(ctx).toContain('MQL');
    expect(ctx).toContain('won');
  });

  it('hides revenue data from viewers', () => {
    const viewerCtx = buildChatContext(data, 'viewer');
    const adminCtx = buildChatContext(data, 'admin');

    expect(adminCtx).toContain('CAC');
    expect(adminCtx).toContain('Win rate');
    expect(viewerCtx).not.toContain('CAC');
    expect(viewerCtx).not.toContain('Win rate');
  });

  it('stays under 2000 tokens', () => {
    const ctx = buildChatContext(data, 'admin');
    const tokens = estimateTokens(ctx);
    expect(tokens).toBeLessThan(2000);
  });
});

describe('estimateTokens', () => {
  it('estimates roughly 1 token per 4 chars', () => {
    expect(estimateTokens('abcd')).toBe(1);
    expect(estimateTokens('12345678')).toBe(2);
    expect(estimateTokens('')).toBe(0);
  });
});
