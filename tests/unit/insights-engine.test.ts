import { describe, it, expect } from 'vitest';
import { generateInsights } from '../../src/utils/insights-engine';
import type { WebMetrics, SeoMetrics, EmailMetrics, CrmMetrics, MartechHealth } from '../../src/connectors/base/connector.schema';
import {
  generateWebMetrics,
  generateSeoMetrics,
  generateEmailMetrics,
  generateCrmMetrics,
  generateMartechHealth,
} from '../../src/utils/mock-generator';

// Helpers to create minimal valid data
function makeWeb(overrides: Partial<WebMetrics> = {}): WebMetrics {
  return { ...generateWebMetrics(), ...overrides };
}
function makeSeo(overrides: Partial<SeoMetrics> = {}): SeoMetrics {
  return { ...generateSeoMetrics(), ...overrides };
}
function makeEmail(overrides: Partial<EmailMetrics> = {}): EmailMetrics {
  return { ...generateEmailMetrics(), ...overrides };
}
function makeCrm(overrides: Partial<CrmMetrics> = {}): CrmMetrics {
  return { ...generateCrmMetrics(), ...overrides };
}
function makeMartech(overrides: Partial<MartechHealth> = {}): MartechHealth {
  return { ...generateMartechHealth(), ...overrides };
}

describe('Insights Engine', () => {
  it('returns empty array with no data', () => {
    expect(generateInsights({})).toEqual([]);
  });

  it('returns insights with full mock data', () => {
    const insights = generateInsights({
      web: generateWebMetrics(),
      seo: generateSeoMetrics(),
      email: generateEmailMetrics(),
      crm: generateCrmMetrics(),
      martech: generateMartechHealth(),
    });
    expect(insights.length).toBeGreaterThan(0);
    insights.forEach(i => {
      expect(['positive', 'negative', 'neutral']).toContain(i.type);
      expect(i.category).toBeTruthy();
      expect(i.title).toBeTruthy();
      expect(i.description).toBeTruthy();
    });
  });

  // Web insights
  it('flags high bounce rate', () => {
    const insights = generateInsights({ web: makeWeb({ bounceRate: 60 }) });
    const found = insights.find(i => i.title.includes('bounce rate') && i.type === 'negative');
    expect(found).toBeDefined();
  });

  it('flags excellent bounce rate', () => {
    const insights = generateInsights({ web: makeWeb({ bounceRate: 30 }) });
    const found = insights.find(i => i.title.includes('bounce rate') && i.type === 'positive');
    expect(found).toBeDefined();
  });

  it('flags mobile-heavy traffic', () => {
    const insights = generateInsights({
      web: makeWeb({ deviceBreakdown: { desktop: 30, mobile: 60, tablet: 10 } }),
    });
    const found = insights.find(i => i.title.includes('Mobile'));
    expect(found).toBeDefined();
  });

  it('flags low session duration', () => {
    const insights = generateInsights({ web: makeWeb({ avgSessionDuration: 30 }) });
    const found = insights.find(i => i.title.includes('session duration') && i.type === 'negative');
    expect(found).toBeDefined();
  });

  it('flags strong engagement', () => {
    const insights = generateInsights({ web: makeWeb({ avgSessionDuration: 300 }) });
    const found = insights.find(i => i.title.includes('engagement') && i.type === 'positive');
    expect(found).toBeDefined();
  });

  // SEO insights
  it('flags strong search position', () => {
    const insights = generateInsights({ seo: makeSeo({ avgPosition: 3 }) });
    const found = insights.find(i => i.title.includes('search position') && i.type === 'positive');
    expect(found).toBeDefined();
  });

  it('flags weak search position', () => {
    const insights = generateInsights({ seo: makeSeo({ avgPosition: 25 }) });
    const found = insights.find(i => i.title.includes('search position') && i.type === 'negative');
    expect(found).toBeDefined();
  });

  // Email insights
  it('flags above-average open rate', () => {
    const insights = generateInsights({ email: makeEmail({ openRate: 35 }) });
    const found = insights.find(i => i.title.includes('open rate') && i.type === 'positive');
    expect(found).toBeDefined();
  });

  it('flags low open rate', () => {
    const insights = generateInsights({ email: makeEmail({ openRate: 15 }) });
    const found = insights.find(i => i.title.includes('open rate') && i.type === 'negative');
    expect(found).toBeDefined();
  });

  it('flags high unsubscribe rate', () => {
    const insights = generateInsights({ email: makeEmail({ unsubscribeRate: 0.8 }) });
    const found = insights.find(i => i.title.includes('unsubscribe') && i.type === 'negative');
    expect(found).toBeDefined();
  });

  // CRM insights
  it('flags low lead-to-MQL rate', () => {
    const insights = generateInsights({
      crm: makeCrm({ funnel: { leads: 1000, mql: 200, sql: 100, pipeline: 50, won: 20 } }),
    });
    const found = insights.find(i => i.title.includes('MQL') && i.type === 'negative');
    expect(found).toBeDefined();
  });

  it('does not crash with zero leads', () => {
    const insights = generateInsights({
      crm: makeCrm({ funnel: { leads: 0, mql: 0, sql: 0, pipeline: 0, won: 0 } }),
    });
    expect(Array.isArray(insights)).toBe(true);
  });

  // Martech insights
  it('flags degraded systems', () => {
    const insights = generateInsights({
      martech: makeMartech({
        systems: [
          { name: 'Test', status: 'degraded', uptime: 98, lastSync: new Date().toISOString(), latencyMs: 200, monthlyCost: 0 },
        ],
      }),
    });
    const found = insights.find(i => i.title.includes('not healthy') && i.type === 'negative');
    expect(found).toBeDefined();
  });

  it('handles empty systems array', () => {
    const insights = generateInsights({
      martech: makeMartech({ systems: [], automationLog: [] }),
    });
    expect(Array.isArray(insights)).toBe(true);
  });

  it('flags high automation failure rate', () => {
    const insights = generateInsights({
      martech: makeMartech({
        systems: [],
        automationLog: Array.from({ length: 10 }, (_, i) => ({
          name: `Auto ${i}`,
          status: i < 3 ? 'success' as const : 'failed' as const,
          timestamp: new Date().toISOString(),
          durationMs: 100,
          recordsProcessed: 10,
        })),
      }),
    });
    const found = insights.find(i => i.title.includes('failure') && i.type === 'negative');
    expect(found).toBeDefined();
  });
});
