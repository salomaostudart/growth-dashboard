import { describe, it, expect } from 'vitest';
import {
  WebMetricsSchema,
  SeoMetricsSchema,
  EmailMetricsSchema,
  SocialMetricsSchema,
  CrmMetricsSchema,
  MartechHealthSchema,
} from '../../src/connectors/base/connector.schema';
import {
  generateWebMetrics,
  generateSeoMetrics,
  generateEmailMetrics,
  generateSocialMetrics,
  generateCrmMetrics,
  generateMartechHealth,
} from '../../src/utils/mock-generator';

describe('Connector Schemas — validate mock data shapes', () => {
  it('WebMetrics mock passes Zod validation', () => {
    const data = generateWebMetrics();
    const result = WebMetricsSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('SeoMetrics mock passes Zod validation', () => {
    const data = generateSeoMetrics();
    const result = SeoMetricsSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('EmailMetrics mock passes Zod validation', () => {
    const data = generateEmailMetrics();
    const result = EmailMetricsSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('SocialMetrics mock passes Zod validation', () => {
    const data = generateSocialMetrics();
    const result = SocialMetricsSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('CrmMetrics mock passes Zod validation', () => {
    const data = generateCrmMetrics();
    const result = CrmMetricsSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('MartechHealth mock passes Zod validation', () => {
    const data = generateMartechHealth();
    const result = MartechHealthSchema.safeParse(data);
    expect(result.success).toBe(true);
  });
});

describe('Connector Registry', () => {
  it('returns mock connectors by default', async () => {
    const { getConnector } = await import('../../src/connectors/registry');
    const web = getConnector('web');
    expect(web.source).toBe('mock');
    expect(web.name).toContain('Mock');
  });

  it('all connectors respond to fetch()', async () => {
    const { getAllConnectors } = await import('../../src/connectors/registry');
    const connectors = getAllConnectors();
    const dateRange = { start: new Date(), end: new Date(), range: '30d' as const };

    for (const [key, connector] of Object.entries(connectors)) {
      const result = await connector.fetch(dateRange);
      expect(result.source).toBe('mock');
      expect(result.fetchedAt).toBeInstanceOf(Date);
      expect(result.errors).toEqual([]);
      expect(result.data).toBeDefined();
    }
  });

  it('all connectors respond to health()', async () => {
    const { getAllConnectors } = await import('../../src/connectors/registry');
    const connectors = getAllConnectors();

    for (const [key, connector] of Object.entries(connectors)) {
      const health = await connector.health();
      expect(health.status).toBe('healthy');
      expect(health.lastCheck).toBeInstanceOf(Date);
    }
  });
});
