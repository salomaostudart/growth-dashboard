/**
 * Mock responses for the AI chat when Claude API is not configured.
 * Uses real dashboard data to generate contextual answers.
 */

export interface MockResponse {
  pattern: RegExp;
  generate: (context: string) => string;
}

function extractValue(context: string, label: string): string {
  const match = context.match(new RegExp(`${label}:\\s*([^|\\n]+)`));
  return match?.[1]?.trim() || 'N/A';
}

function extractSection(context: string, tag: string): string {
  return context.split('\n').filter(l => l.startsWith(`[${tag}]`)).join('\n');
}

export const MOCK_RESPONSES: MockResponse[] = [
  {
    pattern: /top.*(channel|performing|canal)/i,
    generate: (ctx) => {
      const web = extractSection(ctx, 'WEB');
      const channels = web.match(/Channels:(.+)/)?.[1] || '';
      return `**Top performing channel: Organic Search**\n\nBased on current data:\n${channels.trim()}\n\nOrganic search drives the highest share of traffic. To maintain this, focus on content optimization and technical SEO improvements.`;
    },
  },
  {
    pattern: /email|mailchimp|newsletter/i,
    generate: (ctx) => {
      const openRate = extractValue(ctx, 'Open');
      const clickRate = extractValue(ctx, 'Click');
      const subs = extractValue(ctx, 'Subs');
      return `**Email Marketing Performance**\n\n- Open Rate: ${openRate}\n- Click Rate: ${clickRate}\n- Subscribers: ${subs}\n\nOpen rates are within industry benchmarks (20-25%). Consider A/B testing subject lines to push above 30%.`;
    },
  },
  {
    pattern: /concern|problem|issue|worry|preocupa/i,
    generate: (ctx) => {
      const bounce = extractValue(ctx, 'Bounce');
      const martech = extractSection(ctx, 'MARTECH');
      return `**Main Concerns**\n\n1. **Bounce Rate at ${bounce}** — consider improving page load times and content relevance\n2. **Martech Health** — ${martech.includes('degraded') ? 'Some systems showing degraded status' : 'All systems healthy'}\n3. **Channel diversification** — heavy reliance on organic could be risky if algorithm changes occur\n\nRecommendation: prioritize Core Web Vitals optimization and diversify traffic sources.`;
    },
  },
  {
    pattern: /summary|executive|overview|resumo|geral/i,
    generate: (ctx) => {
      const sessions = extractValue(ctx, 'Sessions');
      const users = extractValue(ctx, 'Users');
      const bounce = extractValue(ctx, 'Bounce');
      const conv = extractValue(ctx, 'Conv');
      const leads = ctx.match(/(\d+)\s*leads/)?.[1] || 'N/A';
      const won = ctx.match(/(\d+)\s*won/)?.[1] || 'N/A';
      return `**Executive Summary — Last 30 Days**\n\n| Metric | Value |\n|---|---|\n| Sessions | ${sessions} |\n| Users | ${users} |\n| Bounce Rate | ${bounce} |\n| Conversion | ${conv} |\n| Leads | ${leads} |\n| Deals Won | ${won} |\n\n**Key takeaway:** Traffic is healthy with steady conversion. Focus areas: reduce bounce rate and improve MQL→SQL conversion.`;
    },
  },
  {
    pattern: /seo|search|position|ranking/i,
    generate: (ctx) => {
      const impressions = extractValue(ctx, 'Impressions');
      const clicks = extractValue(ctx, 'Clicks');
      const ctr = extractValue(ctx, 'CTR');
      const pos = extractValue(ctx, 'Avg Position');
      return `**SEO Performance**\n\n- Impressions: ${impressions}\n- Clicks: ${clicks}\n- CTR: ${ctr}\n- Avg Position: ${pos}\n\nFocus on queries in positions 4-10 — these have the highest potential for quick wins with content optimization.`;
    },
  },
  {
    pattern: /pipeline|crm|funnel|funil|lead/i,
    generate: (ctx) => {
      const funnel = ctx.match(/Funnel:(.+)/)?.[1] || '';
      return `**CRM Pipeline**\n\n${funnel.trim()}\n\nThe biggest drop-off is typically Leads→MQL. Consider implementing lead scoring and nurture sequences to improve qualification rates.`;
    },
  },
  {
    pattern: /social|linkedin|twitter|instagram/i,
    generate: (ctx) => {
      const web = extractSection(ctx, 'WEB');
      const socialPct = web.match(/social\s+([\d.]+)%/)?.[1] || 'N/A';
      return `**Social Media Impact**\n\nSocial channels drive ${socialPct}% of total traffic. LinkedIn typically leads for B2B with highest engagement rates.\n\nRecommendation: increase posting frequency on LinkedIn and repurpose top-performing content across platforms.`;
    },
  },
];

export function getMockResponse(question: string, context: string): string {
  for (const mock of MOCK_RESPONSES) {
    if (mock.pattern.test(question)) {
      return mock.generate(context);
    }
  }

  // Default response
  const sessions = extractValue(context, 'Sessions');
  const leads = context.match(/(\d+)\s*leads/)?.[1] || 'N/A';
  return `Based on the current dashboard data (${sessions} sessions, ${leads} leads in the last 30 days), I can help you analyze:\n\n- **"What's our top channel?"** — Traffic source analysis\n- **"How is email doing?"** — Email marketing metrics\n- **"Executive summary"** — Quick overview of all KPIs\n- **"Main concerns?"** — Identify issues to address\n- **"SEO performance"** — Search rankings and visibility\n- **"Pipeline status"** — CRM funnel analysis\n\nTry asking one of these questions!`;
}
