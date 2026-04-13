/**
 * Report Generator — creates structured markdown executive reports
 * from all connector data. Used by MCP tool `generate_report`.
 */
import type {
  WebMetrics, SeoMetrics, EmailMetrics,
  SocialMetrics, CrmMetrics, MartechHealth,
} from '../connectors/base/connector.schema';
import { formatNumber, formatPercent, formatCurrency, formatDuration, formatLatency } from './formatters';
import { generateInsights, type Insight } from './insights-engine';

export interface ReportData {
  web: WebMetrics;
  seo: SeoMetrics;
  email: EmailMetrics;
  social: SocialMetrics;
  crm: CrmMetrics;
  martech: MartechHealth;
}

export function generateExecutiveReport(data: ReportData): string {
  const { web, seo, email, social, crm, martech } = data;
  const insights = generateInsights(data);
  const now = new Date().toISOString().split('T')[0];

  const sections: string[] = [];

  // Header
  sections.push(`# GrowthHQ Executive Report — ${now}\n`);
  sections.push('Period: Last 30 days\n');

  // Web Performance
  sections.push('## Web Performance');
  sections.push(`| Metric | Value |`);
  sections.push(`|---|---|`);
  sections.push(`| Sessions | ${formatNumber(web.sessions)} |`);
  sections.push(`| Users | ${formatNumber(web.users)} |`);
  sections.push(`| Pageviews | ${formatNumber(web.pageviews)} |`);
  sections.push(`| Bounce Rate | ${formatPercent(web.bounceRate)} |`);
  sections.push(`| Avg Session | ${formatDuration(web.avgSessionDuration)} |`);
  sections.push(`| Conversion Rate | ${formatPercent(web.conversionRate)} |`);
  sections.push('');

  // Channel Mix
  sections.push('### Channel Mix');
  sections.push('| Channel | Share |');
  sections.push('|---|---|');
  for (const [ch, pct] of Object.entries(web.channelMix)) {
    sections.push(`| ${ch} | ${formatPercent(pct as number)} |`);
  }
  sections.push('');

  // SEO
  sections.push('## SEO Performance');
  sections.push(`| Metric | Value |`);
  sections.push(`|---|---|`);
  sections.push(`| Impressions | ${formatNumber(seo.impressions)} |`);
  sections.push(`| Clicks | ${formatNumber(seo.clicks)} |`);
  sections.push(`| CTR | ${formatPercent(seo.ctr)} |`);
  sections.push(`| Avg Position | ${seo.avgPosition.toFixed(1)} |`);
  sections.push('');

  sections.push('### Top 5 Queries');
  sections.push('| Query | Clicks | Position |');
  sections.push('|---|---|---|');
  seo.topQueries.slice(0, 5).forEach(q => {
    sections.push(`| ${q.query} | ${q.clicks} | ${q.position.toFixed(1)} |`);
  });
  sections.push('');

  // Email
  sections.push('## Email Marketing');
  sections.push(`| Metric | Value |`);
  sections.push(`|---|---|`);
  sections.push(`| Open Rate | ${formatPercent(email.openRate)} |`);
  sections.push(`| Click Rate | ${formatPercent(email.clickRate)} |`);
  sections.push(`| Subscribers | ${formatNumber(email.totalSubscribers)} |`);
  sections.push(`| List Growth | ${formatPercent(email.listGrowthRate)} |`);
  sections.push('');

  // Social
  sections.push('## Social Media');
  sections.push('| Platform | Followers | Engagement | Referral Traffic |');
  sections.push('|---|---|---|---|');
  social.platforms.forEach(p => {
    sections.push(`| ${p.name} | ${formatNumber(p.followers)} | ${formatPercent(p.engagementRate)} | ${formatNumber(p.referralTraffic)} |`);
  });
  sections.push('');

  // Pipeline
  sections.push('## CRM Pipeline');
  sections.push(`| Stage | Count |`);
  sections.push(`|---|---|`);
  sections.push(`| Leads | ${formatNumber(crm.funnel.leads)} |`);
  sections.push(`| MQL | ${formatNumber(crm.funnel.mql)} |`);
  sections.push(`| SQL | ${formatNumber(crm.funnel.sql)} |`);
  sections.push(`| Pipeline | ${formatNumber(crm.funnel.pipeline)} |`);
  sections.push(`| Won | ${formatNumber(crm.funnel.won)} |`);
  const winRate = crm.funnel.pipeline > 0 ? (crm.funnel.won / crm.funnel.pipeline * 100) : 0;
  sections.push(`| Win Rate | ${formatPercent(winRate)} |`);
  sections.push('');

  // Channel Attribution
  sections.push('### Channel Attribution');
  sections.push('| Channel | Leads | Won | CAC |');
  sections.push('|---|---|---|---|');
  crm.channelAttribution.forEach(ch => {
    sections.push(`| ${ch.channel} | ${ch.leads} | ${ch.won} | ${formatCurrency(ch.cac)} |`);
  });
  sections.push('');

  // Martech Health
  sections.push('## Martech Health');
  const healthy = martech.systems.filter(s => s.status === 'healthy').length;
  sections.push(`Status: ${healthy}/${martech.systems.length} systems healthy\n`);
  sections.push('| System | Status | Uptime | Latency | Cost/mo |');
  sections.push('|---|---|---|---|---|');
  martech.systems.forEach(s => {
    sections.push(`| ${s.name} | ${s.status} | ${formatPercent(s.uptime)} | ${formatLatency(s.latencyMs)} | ${formatCurrency(s.monthlyCost)} |`);
  });
  sections.push('');

  // Insights
  if (insights.length > 0) {
    sections.push('## Key Insights');
    const negatives = insights.filter(i => i.type === 'negative');
    const positives = insights.filter(i => i.type === 'positive');
    const neutrals = insights.filter(i => i.type === 'neutral');

    if (negatives.length > 0) {
      sections.push('### Concerns');
      negatives.forEach(i => sections.push(`- **${i.title}**: ${i.description}`));
    }
    if (positives.length > 0) {
      sections.push('### Wins');
      positives.forEach(i => sections.push(`- **${i.title}**: ${i.description}`));
    }
    if (neutrals.length > 0) {
      sections.push('### Observations');
      neutrals.forEach(i => sections.push(`- **${i.title}**: ${i.description}`));
    }
    sections.push('');
  }

  sections.push('---');
  sections.push('*Generated by GrowthHQ — Digital Growth Command Center*');

  return sections.join('\n');
}
