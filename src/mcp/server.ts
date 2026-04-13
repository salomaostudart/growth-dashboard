#!/usr/bin/env node
/**
 * GrowthHQ MCP Server — AI interface for the dashboard.
 * Exposes 9 read-only tools for Claude Code to query metrics, alerts, and insights.
 *
 * Usage:
 *   npx tsx src/mcp/server.ts
 *
 * Register in .mcp.json:
 *   { "mcpServers": { "growth-dashboard": { "command": "npx", "args": ["tsx", "src/mcp/server.ts"] } } }
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

import { getConnector, getAllConnectors } from '../connectors/registry.js';
import { generateInsights } from '../utils/insights-engine.js';
import { formatNumber, formatPercent, formatDuration, formatCurrency, formatLatency } from '../utils/formatters.js';
import { generateExecutiveReport } from '../utils/report-generator.js';
import * as fs from 'node:fs';

const server = new McpServer({
  name: 'growth-dashboard',
  version: '0.1.0',
});

const dateRange = { start: new Date(Date.now() - 30 * 86400000), end: new Date(), range: '30d' as const };

// Tool 1: Web Metrics
server.tool(
  'get_web_metrics',
  'Get website traffic metrics from GA4: sessions, users, pageviews, bounce rate, conversion rate, top pages, device breakdown, channel mix',
  {},
  async () => {
    const result = await getConnector('web').fetch(dateRange);
    const w = result.data;
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          source: result.source,
          sessions: w.sessions,
          users: w.users,
          pageviews: w.pageviews,
          bounceRate: `${w.bounceRate.toFixed(1)}%`,
          avgSessionDuration: `${Math.round(w.avgSessionDuration)}s`,
          conversionRate: `${w.conversionRate.toFixed(1)}%`,
          topPages: w.topPages.slice(0, 5).map(p => ({ path: p.path, views: p.views })),
          deviceBreakdown: w.deviceBreakdown,
          channelMix: w.channelMix,
        }, null, 2),
      }],
    };
  }
);

// Tool 2: SEO Metrics
server.tool(
  'get_seo_metrics',
  'Get SEO metrics from Search Console: impressions, clicks, CTR, average position, top queries with position history',
  {},
  async () => {
    const result = await getConnector('seo').fetch(dateRange);
    const s = result.data;
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          source: result.source,
          impressions: s.impressions,
          clicks: s.clicks,
          ctr: `${s.ctr.toFixed(1)}%`,
          avgPosition: s.avgPosition.toFixed(1),
          topQueries: s.topQueries.slice(0, 10).map(q => ({
            query: q.query,
            impressions: q.impressions,
            clicks: q.clicks,
            position: q.position.toFixed(1),
          })),
          pagePerformance: s.pagePerformance,
        }, null, 2),
      }],
    };
  }
);

// Tool 3: Email Metrics
server.tool(
  'get_email_metrics',
  'Get email marketing metrics from Mailchimp: open rate, click rate, subscribers, campaigns, automations',
  {},
  async () => {
    const result = await getConnector('email').fetch(dateRange);
    const e = result.data;
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          source: result.source,
          openRate: `${e.openRate.toFixed(1)}%`,
          clickRate: `${e.clickRate.toFixed(1)}%`,
          unsubscribeRate: `${e.unsubscribeRate.toFixed(2)}%`,
          listGrowthRate: `${e.listGrowthRate.toFixed(1)}%`,
          totalSubscribers: e.totalSubscribers,
          recentCampaigns: e.campaigns.slice(0, 5).map(c => ({
            name: c.name,
            sent: c.sent,
            openRate: `${c.openRate.toFixed(1)}%`,
            clickRate: `${c.clickRate.toFixed(1)}%`,
          })),
          automations: e.automations.map(a => ({
            name: a.name,
            status: a.status,
            successRate: `${a.successRate.toFixed(1)}%`,
          })),
        }, null, 2),
      }],
    };
  }
);

// Tool 4: Social Metrics
server.tool(
  'get_social_metrics',
  'Get social media metrics: followers, engagement, referral traffic by platform (LinkedIn, Twitter/X, YouTube, Instagram)',
  {},
  async () => {
    const result = await getConnector('social').fetch(dateRange);
    const s = result.data;
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          source: result.source,
          platforms: s.platforms.map(p => ({
            name: p.name,
            followers: p.followers,
            growth: `${p.followerGrowth.toFixed(1)}%`,
            engagement: `${p.engagementRate.toFixed(2)}%`,
            referralTraffic: p.referralTraffic,
          })),
          topPosts: s.topPosts.slice(0, 5).map(p => ({
            platform: p.platform,
            content: p.content.slice(0, 80),
            engagement: p.engagement,
            reach: p.reach,
          })),
        }, null, 2),
      }],
    };
  }
);

// Tool 5: CRM Metrics
server.tool(
  'get_crm_metrics',
  'Get CRM pipeline metrics from HubSpot: funnel (leads→MQL→SQL→pipeline→won), lead velocity, channel attribution with CAC',
  {},
  async () => {
    const result = await getConnector('crm').fetch(dateRange);
    const c = result.data;
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          source: result.source,
          funnel: c.funnel,
          channelAttribution: c.channelAttribution.map(ch => ({
            channel: ch.channel,
            leads: ch.leads,
            won: ch.won,
            cac: `$${ch.cac}`,
          })),
          pipelineByStage: c.pipelineByStage.map(s => ({
            stage: s.stage,
            value: formatCurrency(s.value),
            count: s.count,
            confidence: s.confidence,
          })),
        }, null, 2),
      }],
    };
  }
);

// Tool 6: Martech Health
server.tool(
  'get_martech_health',
  'Get martech stack health: system status, uptime, latency, monthly cost, automation success rates',
  {},
  async () => {
    const result = await getConnector('martech').fetch(dateRange);
    const m = result.data;
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          source: result.source,
          systems: m.systems.map(s => ({
            name: s.name,
            status: s.status,
            uptime: `${s.uptime.toFixed(2)}%`,
            latency: formatLatency(s.latencyMs),
            monthlyCost: formatCurrency(s.monthlyCost),
          })),
          recentAutomations: m.automationLog.slice(0, 5).map(l => ({
            name: l.name,
            status: l.status,
            records: l.recordsProcessed,
          })),
        }, null, 2),
      }],
    };
  }
);

// Tool 7: Alerts
server.tool(
  'get_alerts',
  'Get active alerts across all channels: bounce rate warnings, degraded systems, failed automations',
  {},
  async () => {
    const web = (await getConnector('web').fetch(dateRange)).data;
    const martech = (await getConnector('martech').fetch(dateRange)).data;

    const alerts: Array<{ severity: string; source: string; message: string }> = [];

    if (web.bounceRate > 50) {
      alerts.push({ severity: 'warning', source: 'GA4', message: `Bounce rate is ${web.bounceRate.toFixed(1)}% (threshold: 50%)` });
    }

    martech.systems.filter(s => s.status !== 'healthy').forEach(s => {
      alerts.push({ severity: 'danger', source: 'Martech', message: `${s.name} is ${s.status} (uptime: ${s.uptime.toFixed(2)}%)` });
    });

    const failedAutos = martech.automationLog.filter(l => l.status === 'failed');
    if (failedAutos.length > 0) {
      alerts.push({ severity: 'warning', source: 'Martech', message: `${failedAutos.length} failed automation(s) in recent log` });
    }

    return {
      content: [{
        type: 'text',
        text: alerts.length > 0
          ? JSON.stringify(alerts, null, 2)
          : 'No active alerts. All systems healthy.',
      }],
    };
  }
);

// Tool 8: Insights
server.tool(
  'get_insights',
  'Get automated insights from the rule-based engine: trends, anomalies, opportunities across all channels',
  {},
  async () => {
    const web = (await getConnector('web').fetch(dateRange)).data;
    const seo = (await getConnector('seo').fetch(dateRange)).data;
    const email = (await getConnector('email').fetch(dateRange)).data;
    const crm = (await getConnector('crm').fetch(dateRange)).data;
    const martech = (await getConnector('martech').fetch(dateRange)).data;

    const insights = generateInsights({ web, seo, email, crm, martech });

    return {
      content: [{
        type: 'text',
        text: insights.length > 0
          ? JSON.stringify(insights.map(i => ({
              type: i.type,
              category: i.category,
              title: i.title,
              description: i.description,
            })), null, 2)
          : 'No insights to report. All metrics within normal ranges.',
      }],
    };
  }
);

// Tool 9: Executive Summary
server.tool(
  'get_summary',
  'Get executive summary across all channels: key metrics, health status, top insights — designed for quick briefings',
  {},
  async () => {
    const web = (await getConnector('web').fetch(dateRange)).data;
    const seo = (await getConnector('seo').fetch(dateRange)).data;
    const email = (await getConnector('email').fetch(dateRange)).data;
    const crm = (await getConnector('crm').fetch(dateRange)).data;
    const martech = (await getConnector('martech').fetch(dateRange)).data;

    const healthySystems = martech.systems.filter(s => s.status === 'healthy').length;
    const insights = generateInsights({ web, seo, email, crm, martech });
    const negativeInsights = insights.filter(i => i.type === 'negative');
    const positiveInsights = insights.filter(i => i.type === 'positive');

    const summary = {
      period: '30 days',
      web: {
        sessions: formatNumber(web.sessions),
        users: formatNumber(web.users),
        bounceRate: formatPercent(web.bounceRate),
        conversionRate: formatPercent(web.conversionRate),
      },
      seo: {
        impressions: formatNumber(seo.impressions),
        clicks: formatNumber(seo.clicks),
        avgPosition: seo.avgPosition.toFixed(1),
      },
      email: {
        openRate: formatPercent(email.openRate),
        subscribers: formatNumber(email.totalSubscribers),
      },
      pipeline: {
        leads: crm.funnel.leads,
        won: crm.funnel.won,
        winRate: formatPercent(crm.funnel.pipeline > 0 ? crm.funnel.won / crm.funnel.pipeline * 100 : 0),
      },
      systemHealth: `${healthySystems}/${martech.systems.length} healthy`,
      topConcerns: negativeInsights.slice(0, 3).map(i => i.title),
      topWins: positiveInsights.slice(0, 3).map(i => i.title),
    };

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(summary, null, 2),
      }],
    };
  }
);

// --- WRITE TOOLS ---

// Local alert storage (JSON file alongside MCP server)
const ALERTS_FILE = new URL('./alerts.json', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');

function loadAlerts(): Array<{ metric: string; condition: string; threshold: number; message: string; active: boolean; createdAt: string }> {
  try {
    return JSON.parse(fs.readFileSync(ALERTS_FILE, 'utf-8'));
  } catch { return []; }
}

function saveAlerts(alerts: ReturnType<typeof loadAlerts>) {
  fs.writeFileSync(ALERTS_FILE, JSON.stringify(alerts, null, 2));
}

// Tool 10: Set Alert Threshold
server.tool(
  'set_alert_threshold',
  'Create or update an alert threshold. When the metric crosses the threshold, an alert is triggered. Persists to local JSON.',
  {
    metric: z.string().describe('Metric name, e.g. "bounceRate", "sessions", "ctr", "pipelineWon"'),
    condition: z.enum(['above', 'below']).describe('Trigger when metric is above or below threshold'),
    threshold: z.number().describe('Numeric threshold value'),
    message: z.string().describe('Alert message to display when triggered'),
  },
  async ({ metric, condition, threshold, message }) => {
    const alerts = loadAlerts();
    const existing = alerts.findIndex(a => a.metric === metric && a.condition === condition);

    const entry = { metric, condition, threshold, message, active: true, createdAt: new Date().toISOString() };

    if (existing >= 0) {
      alerts[existing] = entry;
    } else {
      alerts.push(entry);
    }

    saveAlerts(alerts);

    return {
      content: [{
        type: 'text',
        text: `Alert set: ${metric} ${condition} ${threshold} — "${message}". Total active alerts: ${alerts.filter(a => a.active).length}`,
      }],
    };
  }
);

// Tool 11: Clear Alerts
server.tool(
  'clear_alerts',
  'Deactivate all triggered alerts, or a specific metric alert',
  {
    metric: z.string().optional().describe('Optional: clear only alerts for this metric. Omit to clear all.'),
  },
  async ({ metric }) => {
    const alerts = loadAlerts();
    let cleared = 0;

    for (const alert of alerts) {
      if (!metric || alert.metric === metric) {
        if (alert.active) { alert.active = false; cleared++; }
      }
    }

    saveAlerts(alerts);

    return {
      content: [{
        type: 'text',
        text: cleared > 0
          ? `Cleared ${cleared} alert(s).${metric ? ` Metric: ${metric}` : ''}`
          : 'No active alerts to clear.',
      }],
    };
  }
);

// Tool 12: Generate Report
server.tool(
  'generate_report',
  'Generate a comprehensive executive markdown report with all metrics, insights, and channel data',
  {},
  async () => {
    const web = (await getConnector('web').fetch(dateRange)).data;
    const seo = (await getConnector('seo').fetch(dateRange)).data;
    const email = (await getConnector('email').fetch(dateRange)).data;
    const social = (await getConnector('social').fetch(dateRange)).data;
    const crm = (await getConnector('crm').fetch(dateRange)).data;
    const martech = (await getConnector('martech').fetch(dateRange)).data;

    const report = generateExecutiveReport({ web, seo, email, social, crm, martech });

    return {
      content: [{
        type: 'text',
        text: report,
      }],
    };
  }
);

// Tool 13: Manage Users (read-only via MCP — actual role changes require Supabase admin)
server.tool(
  'manage_users',
  'List user roles and permissions. Role changes require Supabase admin access.',
  {
    action: z.enum(['list', 'describe_role']).describe('"list" to show all roles, "describe_role" to show permissions for a role'),
    role: z.enum(['admin', 'analyst', 'viewer']).optional().describe('Role to describe (for describe_role action)'),
  },
  async ({ action, role }) => {
    if (action === 'describe_role') {
      const r = role || 'viewer';
      const perms: Record<string, Record<string, boolean>> = {
        admin: { viewDashboards: true, viewRevenue: true, manageAlerts: true, manageUsers: true, useChat: true, exportData: true, viewAuditLog: true },
        analyst: { viewDashboards: true, viewRevenue: true, manageAlerts: true, manageUsers: false, useChat: true, exportData: true, viewAuditLog: false },
        viewer: { viewDashboards: true, viewRevenue: false, manageAlerts: false, manageUsers: false, useChat: false, exportData: false, viewAuditLog: false },
      };
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ role: r, permissions: perms[r] }, null, 2),
        }],
      };
    }

    // list
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          roles: [
            { role: 'admin', description: 'Full access — manage users, alerts, audit log, all data' },
            { role: 'analyst', description: 'Data access — view revenue, manage alerts, use chat, export' },
            { role: 'viewer', description: 'Read-only — dashboards only, no revenue or chat' },
          ],
          note: 'To change a user role, update the profiles table in Supabase dashboard or via SQL: UPDATE profiles SET role = \'analyst\' WHERE email = \'user@example.com\'',
        }, null, 2),
      }],
    };
  }
);

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
