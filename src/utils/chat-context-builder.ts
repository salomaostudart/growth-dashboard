/**
 * Builds a compact context string from dashboard data for the AI chat.
 * Serializes all connector data into a structured, token-efficient format.
 */
import type {
  WebMetrics, SeoMetrics, EmailMetrics,
  SocialMetrics, CrmMetrics, MartechHealth,
} from '../connectors/base/connector.schema';
import type { Role } from './rbac';
import { formatNumber, formatPercent, formatCurrency } from './formatters';

export interface DashboardContext {
  web: WebMetrics;
  seo: SeoMetrics;
  email: EmailMetrics;
  crm: CrmMetrics;
  martech: MartechHealth;
}

export function buildChatContext(data: DashboardContext, role: Role): string {
  const { web, seo, email, crm, martech } = data;
  const sections: string[] = [];

  // Web
  sections.push(`[WEB] Sessions: ${formatNumber(web.sessions)} | Users: ${formatNumber(web.users)} | Bounce: ${formatPercent(web.bounceRate)} | Conv: ${formatPercent(web.conversionRate)}`);
  sections.push(`[WEB] Channels: organic ${web.channelMix.organic}% | direct ${web.channelMix.direct}% | social ${web.channelMix.social}% | email ${web.channelMix.email}% | paid ${web.channelMix.paid}% | referral ${web.channelMix.referral}%`);
  sections.push(`[WEB] Top pages: ${web.topPages.slice(0, 5).map(p => `${p.path} (${formatNumber(p.views)})`).join(', ')}`);

  // SEO
  sections.push(`[SEO] Impressions: ${formatNumber(seo.impressions)} | Clicks: ${formatNumber(seo.clicks)} | CTR: ${formatPercent(seo.ctr)} | Avg Position: ${seo.avgPosition.toFixed(1)}`);
  sections.push(`[SEO] Top queries: ${seo.topQueries.slice(0, 5).map(q => `"${q.query}" (pos ${q.position.toFixed(1)}, ${q.clicks} clicks)`).join(', ')}`);

  // Email
  sections.push(`[EMAIL] Open: ${formatPercent(email.openRate)} | Click: ${formatPercent(email.clickRate)} | Subs: ${formatNumber(email.totalSubscribers)} | Growth: ${formatPercent(email.listGrowthRate)}`);
  sections.push(`[EMAIL] Recent campaigns: ${email.campaigns.slice(0, 3).map(c => `"${c.name}" (open ${formatPercent(c.openRate)})`).join(', ')}`);

  // Social
  const social = data as any; // SocialMetrics is on a different connector
  // We include what's available in the CRM for cross-channel
  sections.push(`[CRM] Funnel: ${crm.funnel.leads} leads → ${crm.funnel.mql} MQL → ${crm.funnel.sql} SQL → ${crm.funnel.pipeline} pipeline → ${crm.funnel.won} won`);

  // Revenue-sensitive data: hide from viewers
  if (role !== 'viewer') {
    const winRate = crm.funnel.pipeline > 0 ? (crm.funnel.won / crm.funnel.pipeline * 100) : 0;
    sections.push(`[CRM] Win rate: ${formatPercent(winRate)}`);
    sections.push(`[CRM] Attribution: ${crm.channelAttribution.map(ch => `${ch.channel}: ${ch.leads} leads, CAC ${formatCurrency(ch.cac)}`).join(' | ')}`);
  }

  // Martech
  const healthy = martech.systems.filter(s => s.status === 'healthy').length;
  sections.push(`[MARTECH] ${healthy}/${martech.systems.length} healthy | Systems: ${martech.systems.map(s => `${s.name} (${s.status})`).join(', ')}`);

  return sections.join('\n');
}

/** Estimate token count (rough: 1 token ≈ 4 chars) */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
