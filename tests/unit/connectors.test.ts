import { describe, expect, it } from 'vitest';
import {
  CrmMetricsSchema,
  EmailMetricsSchema,
  MartechHealthSchema,
  SeoMetricsSchema,
  SocialMetricsSchema,
  WebMetricsSchema,
} from '../../src/connectors/base/connector.schema';
import {
  generateCrmMetrics,
  generateEmailMetrics,
  generateMartechHealth,
  generateSeoMetrics,
  generateSocialMetrics,
  generateWebMetrics,
} from '../../src/utils/mock-generator';

// Schema-to-key mapping for validation in fetch() tests
const schemaMap: Record<string, any> = {
  web: WebMetricsSchema,
  seo: SeoMetricsSchema,
  email: EmailMetricsSchema,
  social: SocialMetricsSchema,
  crm: CrmMetricsSchema,
  martech: MartechHealthSchema,
};

describe('Connector Schemas — validate mock data shapes', () => {
  it('WebMetrics mock passes Zod validation', () => {
    const result = WebMetricsSchema.safeParse(generateWebMetrics());
    expect(result.success).toBe(true);
  });

  it('SeoMetrics mock passes Zod validation', () => {
    const result = SeoMetricsSchema.safeParse(generateSeoMetrics());
    expect(result.success).toBe(true);
  });

  it('EmailMetrics mock passes Zod validation', () => {
    const result = EmailMetricsSchema.safeParse(generateEmailMetrics());
    expect(result.success).toBe(true);
  });

  it('SocialMetrics mock passes Zod validation', () => {
    const result = SocialMetricsSchema.safeParse(generateSocialMetrics());
    expect(result.success).toBe(true);
  });

  it('CrmMetrics mock passes Zod validation', () => {
    const result = CrmMetricsSchema.safeParse(generateCrmMetrics());
    expect(result.success).toBe(true);
  });

  it('MartechHealth mock passes Zod validation', () => {
    const result = MartechHealthSchema.safeParse(generateMartechHealth());
    expect(result.success).toBe(true);
  });

  it('generators produce consistent results across calls (RNG isolation)', () => {
    const a = generateWebMetrics();
    const b = generateWebMetrics();
    expect(a.sessions).toBe(b.sessions);
  });
});

describe('Live Connectors — snapshot-based', () => {
  it('WebLiveConnector reads and validates snapshot JSON', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');

    // Create a temporary snapshot with valid mock data
    const snapshotDir = path.resolve('src/data/snapshots');
    const snapshotPath = path.join(snapshotDir, 'ga4-snapshot.json');
    fs.mkdirSync(snapshotDir, { recursive: true });

    const mockData = generateWebMetrics();
    fs.writeFileSync(
      snapshotPath,
      JSON.stringify({ fetchedAt: new Date().toISOString(), data: mockData }),
    );

    try {
      const { WebLiveConnector } = await import('../../src/connectors/ga4/ga4.connector');
      const connector = new WebLiveConnector();

      expect(connector.name).toBe('Google Analytics 4');
      expect(connector.source).toBe('live');

      const result = await connector.fetch({ start: new Date(), end: new Date(), range: '30d' });
      expect(result.source).toBe('live');
      expect(result.data.sessions).toBe(mockData.sessions);

      const validation = WebMetricsSchema.safeParse(result.data);
      expect(validation.success).toBe(true);
    } finally {
      fs.unlinkSync(snapshotPath);
    }
  });

  it('SeoLiveConnector reads and validates snapshot JSON', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');

    const snapshotDir = path.resolve('src/data/snapshots');
    const snapshotPath = path.join(snapshotDir, 'gsc-snapshot.json');
    fs.mkdirSync(snapshotDir, { recursive: true });

    const mockData = generateSeoMetrics();
    fs.writeFileSync(
      snapshotPath,
      JSON.stringify({ fetchedAt: new Date().toISOString(), data: mockData }),
    );

    try {
      const { SeoLiveConnector } = await import(
        '../../src/connectors/search-console/gsc.connector'
      );
      const connector = new SeoLiveConnector();

      expect(connector.name).toBe('Google Search Console');
      expect(connector.source).toBe('live');

      const result = await connector.fetch({ start: new Date(), end: new Date(), range: '90d' });
      expect(result.source).toBe('live');
      expect(result.data.impressions).toBe(mockData.impressions);

      const validation = SeoMetricsSchema.safeParse(result.data);
      expect(validation.success).toBe(true);
    } finally {
      fs.unlinkSync(snapshotPath);
    }
  });

  it('WebLiveConnector health() reports degraded when snapshot is missing', async () => {
    const { WebLiveConnector } = await import('../../src/connectors/ga4/ga4.connector');
    const connector = new WebLiveConnector();
    const health = await connector.health();
    // Snapshot was cleaned up, so it should be down
    expect(['down', 'degraded']).toContain(health.status);
  });
});

describe('Connector Registry', () => {
  it('returns mock connectors by default', async () => {
    const { getConnector } = await import('../../src/connectors/registry');
    const web = getConnector('web');
    expect(web.source).toBe('mock');
    expect(web.name).toContain('Mock');
  });

  it('all 6 connector keys are registered', async () => {
    const { getConnector } = await import('../../src/connectors/registry');
    const keys = ['web', 'seo', 'email', 'social', 'crm', 'martech'] as const;
    for (const key of keys) {
      const connector = getConnector(key);
      expect(connector).toBeDefined();
      expect(connector.source).toBe('mock');
      expect(connector.name).toBeTruthy();
    }
  });

  it('all connectors fetch() returns data validated by Zod schema', async () => {
    const { getAllConnectors } = await import('../../src/connectors/registry');
    const connectors = getAllConnectors();
    const dateRange = { start: new Date(), end: new Date(), range: '30d' as const };

    for (const [key, connector] of Object.entries(connectors)) {
      const result = await connector.fetch(dateRange);
      expect(result.source).toBe('mock');
      expect(result.fetchedAt).toBeInstanceOf(Date);
      expect(result.errors).toEqual([]);
      expect(result.data).toBeDefined();

      // Validate data against the corresponding Zod schema
      const schema = schemaMap[key];
      if (schema) {
        const validation = schema.safeParse(result.data);
        expect(validation.success, `Schema validation failed for connector "${key}"`).toBe(true);
      }
    }
  });

  it('all connectors respond to health()', async () => {
    const { getAllConnectors } = await import('../../src/connectors/registry');
    const connectors = getAllConnectors();

    for (const [_key, connector] of Object.entries(connectors)) {
      const health = await connector.health();
      expect(health.status).toBe('healthy');
      expect(health.lastCheck).toBeInstanceOf(Date);
    }
  });
});
