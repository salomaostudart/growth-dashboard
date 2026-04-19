import { describe, expect, it } from 'vitest';
import type { CrmMetrics, WebMetrics } from '../../src/connectors/base/connector.schema';
import {
  CHANNEL_MAP,
  buildCrossChannelSummary,
  buildSankeyData,
} from '../../src/utils/sankey-transformer';

// Minimal fixtures matching the Zod schemas
const mockWeb: WebMetrics = {
  sessions: 10000,
  users: 7000,
  pageviews: 25000,
  bounceRate: 45,
  avgSessionDuration: 180,
  conversionRate: 3.0,
  topPages: [{ path: '/', views: 5000, avgTime: 60 }],
  deviceBreakdown: { desktop: 60, mobile: 30, tablet: 10 },
  trafficByDay: [{ date: '2026-04-01', sessions: 350, users: 250 }],
  channelMix: {
    organic: 40, // 4000 sessions
    direct: 25, // 2500
    social: 12, // 1200
    email: 8, // 800
    paid: 10, // 1000
    referral: 5, // 500
  },
};

const mockCrm: CrmMetrics = {
  funnel: { leads: 500, mql: 300, sql: 150, pipeline: 80, won: 30 },
  leadVelocity: [{ date: '2026-04-01', leads: 18 }],
  channelAttribution: [
    { channel: 'Organic Search', leads: 180, mql: 100, sql: 50, pipeline: 25, won: 10, cac: 80 },
    { channel: 'Direct', leads: 60, mql: 30, sql: 15, pipeline: 8, won: 3, cac: 10 },
    { channel: 'Social Media', leads: 50, mql: 25, sql: 12, pipeline: 6, won: 2, cac: 150 },
    { channel: 'Email', leads: 100, mql: 70, sql: 40, pipeline: 22, won: 8, cac: 40 },
    { channel: 'Paid Search', leads: 70, mql: 45, sql: 23, pipeline: 12, won: 5, cac: 200 },
    { channel: 'Referral', leads: 40, mql: 30, sql: 10, pipeline: 7, won: 2, cac: 30 },
  ],
  pipelineByStage: [{ stage: 'Discovery', value: 50000, count: 20, confidence: 'low' as const }],
};

describe('buildSankeyData', () => {
  it('creates nodes for all channels, funnel stages, and drop-off', () => {
    const result = buildSankeyData(mockWeb, mockCrm);

    // 6 channels + Sessions + Bounced + Leads + MQL + SQL + Pipeline + Won + 4 lost nodes = 17
    const nodeNames = result.nodes.map((n) => n.name);
    expect(nodeNames).toContain('Sessions');
    expect(nodeNames).toContain('Leads');
    expect(nodeNames).toContain('MQL');
    expect(nodeNames).toContain('Won');
    expect(nodeNames).toContain('Organic Search');
    expect(nodeNames).toContain('Bounced / No Conversion');
    expect(nodeNames).toContain('Lost at Leads');
  });

  it('converts channelMix percentages to absolute sessions', () => {
    const result = buildSankeyData(mockWeb, mockCrm);

    const organicLink = result.links.find(
      (l) => l.source === 'Organic Search' && l.target === 'Sessions',
    );
    expect(organicLink).toBeDefined();
    expect(organicLink?.value).toBe(4000); // 40% of 10000

    const emailLink = result.links.find((l) => l.source === 'Email' && l.target === 'Sessions');
    expect(emailLink?.value).toBe(800); // 8% of 10000
  });

  it('has Sessions → Leads link with total leads', () => {
    const result = buildSankeyData(mockWeb, mockCrm);
    const link = result.links.find((l) => l.source === 'Sessions' && l.target === 'Leads');
    expect(link).toBeDefined();
    expect(link?.value).toBe(500);
  });

  it('adds bounced/no-conversion link', () => {
    const result = buildSankeyData(mockWeb, mockCrm);
    const link = result.links.find((l) => l.target === 'Bounced / No Conversion');
    expect(link).toBeDefined();
    expect(link?.value).toBe(9500); // 10000 - 500
  });

  it('creates funnel progression links', () => {
    const result = buildSankeyData(mockWeb, mockCrm);

    const leadsToMql = result.links.find((l) => l.source === 'Leads' && l.target === 'MQL');
    expect(leadsToMql?.value).toBe(300);

    const pipelineToWon = result.links.find((l) => l.source === 'Pipeline' && l.target === 'Won');
    expect(pipelineToWon?.value).toBe(30);
  });

  it('creates drop-off links for each funnel stage', () => {
    const result = buildSankeyData(mockWeb, mockCrm);

    const lostAtLeads = result.links.find((l) => l.target === 'Lost at Leads');
    expect(lostAtLeads?.value).toBe(200); // 500 - 300

    const lostAtPipeline = result.links.find((l) => l.target === 'Lost at Pipeline');
    expect(lostAtPipeline?.value).toBe(50); // 80 - 30
  });

  it('skips channels with 0% sessions', () => {
    const zeroWeb = { ...mockWeb, channelMix: { ...mockWeb.channelMix, referral: 0 } };
    const result = buildSankeyData(zeroWeb, mockCrm);
    const refLink = result.links.find((l) => l.source === 'Referral');
    expect(refLink).toBeUndefined();
  });

  it('produces no duplicate nodes', () => {
    const result = buildSankeyData(mockWeb, mockCrm);
    const names = result.nodes.map((n) => n.name);
    expect(names.length).toBe(new Set(names).size);
  });
});

describe('buildCrossChannelSummary', () => {
  it('computes total sessions from web.sessions', () => {
    const summary = buildCrossChannelSummary(mockWeb, mockCrm);
    expect(summary.totalSessions).toBe(10000);
  });

  it('computes overall conversion rate', () => {
    const summary = buildCrossChannelSummary(mockWeb, mockCrm);
    expect(summary.overallConversionRate).toBe(5); // 500/10000 * 100
  });

  it('identifies top channel by absolute sessions', () => {
    const summary = buildCrossChannelSummary(mockWeb, mockCrm);
    expect(summary.topChannel.name).toBe('Organic Search');
    expect(summary.topChannel.sessions).toBe(4000);
  });

  it('identifies best converting channel', () => {
    const summary = buildCrossChannelSummary(mockWeb, mockCrm);
    // Email: 100 leads / 800 sessions = 12.5%
    expect(summary.bestConvertingChannel).toBeDefined();
    expect(summary.bestConvertingChannel?.name).toBe('Email');
    expect(summary.bestConvertingChannel?.rate).toBe(12.5);
  });

  it('computes win rate', () => {
    const summary = buildCrossChannelSummary(mockWeb, mockCrm);
    expect(summary.winRate).toBe(37.5); // 30/80 * 100
  });
});

describe('CHANNEL_MAP', () => {
  it('maps all 6 GA4 channelMix keys', () => {
    expect(Object.keys(CHANNEL_MAP)).toEqual([
      'organic',
      'direct',
      'social',
      'email',
      'paid',
      'referral',
    ]);
  });
});
