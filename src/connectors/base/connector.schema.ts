/**
 * Shared Zod schemas for all connectors.
 * Validates data shapes at runtime — catches API changes before they break the UI.
 */
import { z } from 'zod';

// Shared target/goal schema
const TargetSchema = z.object({
  target: z.number(),
  period: z.string(),
  direction: z.enum(['higher', 'lower']).optional(),
}).optional();

const TargetsSchema = z.record(z.string(), TargetSchema).optional();

// Forecast schema
const ForecastSchema = z.array(z.object({
  date: z.string(),
  projected: z.number(),
  confidence: z.tuple([z.number(), z.number()]),
})).optional();

// Website / GA4 metrics
export const WebMetricsSchema = z.object({
  sessions: z.number(),
  users: z.number(),
  pageviews: z.number(),
  bounceRate: z.number(),
  avgSessionDuration: z.number(),
  conversionRate: z.number(),
  topPages: z.array(z.object({
    path: z.string(),
    views: z.number(),
    avgTime: z.number(),
  })),
  deviceBreakdown: z.object({
    desktop: z.number(),
    mobile: z.number(),
    tablet: z.number(),
  }),
  trafficByDay: z.array(z.object({
    date: z.string(),
    sessions: z.number(),
    users: z.number(),
  })),
  channelMix: z.object({
    organic: z.number(),
    direct: z.number(),
    social: z.number(),
    email: z.number(),
    paid: z.number(),
    referral: z.number(),
  }),
  targets: TargetsSchema,
  forecast: ForecastSchema,
});

// SEO / Search Console
export const SeoMetricsSchema = z.object({
  impressions: z.number(),
  clicks: z.number(),
  ctr: z.number(),
  avgPosition: z.number(),
  topQueries: z.array(z.object({
    query: z.string(),
    impressions: z.number(),
    clicks: z.number(),
    ctr: z.number(),
    position: z.number(),
    positionHistory: z.array(z.number()),
  })),
  pagePerformance: z.array(z.object({
    page: z.string(),
    impressions: z.number(),
    clicks: z.number(),
    ctr: z.number(),
    position: z.number(),
  })),
  targets: TargetsSchema,
});

// Email marketing
export const EmailMetricsSchema = z.object({
  openRate: z.number(),
  clickRate: z.number(),
  unsubscribeRate: z.number(),
  listGrowthRate: z.number(),
  totalSubscribers: z.number(),
  campaigns: z.array(z.object({
    name: z.string(),
    sentDate: z.string(),
    sent: z.number(),
    opens: z.number(),
    clicks: z.number(),
    openRate: z.number(),
    clickRate: z.number(),
  })),
  automations: z.array(z.object({
    name: z.string(),
    status: z.enum(['active', 'paused', 'draft']),
    lastTriggered: z.string(),
    successRate: z.number(),
    totalRuns: z.number(),
  })),
  bestSendTimes: z.array(z.object({
    day: z.number(),
    hour: z.number(),
    engagement: z.number(),
  })),
  targets: TargetsSchema,
});

// Social media
export const SocialMetricsSchema = z.object({
  platforms: z.array(z.object({
    name: z.string(),
    followers: z.number(),
    followerGrowth: z.number(),
    engagementRate: z.number(),
    referralTraffic: z.number(),
    posts: z.number(),
  })),
  topPosts: z.array(z.object({
    platform: z.string(),
    content: z.string(),
    date: z.string(),
    engagement: z.number(),
    reach: z.number(),
    clicks: z.number(),
  })),
  referralByDay: z.array(z.object({
    date: z.string(),
    sessions: z.number(),
    platform: z.string(),
  })),
});

// CRM / Pipeline
export const CrmMetricsSchema = z.object({
  funnel: z.object({
    leads: z.number(),
    mql: z.number(),
    sql: z.number(),
    pipeline: z.number(),
    won: z.number(),
  }),
  leadVelocity: z.array(z.object({
    date: z.string(),
    leads: z.number(),
  })),
  channelAttribution: z.array(z.object({
    channel: z.string(),
    leads: z.number(),
    mql: z.number(),
    sql: z.number(),
    pipeline: z.number(),
    won: z.number(),
    cac: z.number(),
  })),
  pipelineByStage: z.array(z.object({
    stage: z.string(),
    value: z.number(),
    count: z.number(),
    confidence: z.enum(['high', 'medium', 'low']),
  })),
  targets: TargetsSchema,
});

// Martech health
export const MartechHealthSchema = z.object({
  systems: z.array(z.object({
    name: z.string(),
    status: z.enum(['healthy', 'degraded', 'down', 'unknown']),
    uptime: z.number(),
    lastSync: z.string(),
    latencyMs: z.number(),
    monthlyCost: z.number(),
  })),
  automationLog: z.array(z.object({
    name: z.string(),
    status: z.enum(['success', 'failed', 'partial']),
    timestamp: z.string(),
    durationMs: z.number(),
    recordsProcessed: z.number(),
  })),
});

// Export types
export type WebMetrics = z.infer<typeof WebMetricsSchema>;
export type SeoMetrics = z.infer<typeof SeoMetricsSchema>;
export type EmailMetrics = z.infer<typeof EmailMetricsSchema>;
export type SocialMetrics = z.infer<typeof SocialMetricsSchema>;
export type CrmMetrics = z.infer<typeof CrmMetricsSchema>;
export type MartechHealth = z.infer<typeof MartechHealthSchema>;
