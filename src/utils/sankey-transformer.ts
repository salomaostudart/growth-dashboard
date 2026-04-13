/**
 * Transforms channel mix (GA4) + channel attribution (CRM) data
 * into ECharts Sankey format: { nodes, links }.
 *
 * Flow: Channel → Sessions → Leads → MQL → SQL → Pipeline → Won
 * channelMix values are percentages — multiplied by total sessions.
 */
import type { WebMetrics, CrmMetrics } from '../connectors/base/connector.schema';

export interface SankeyNode {
  name: string;
}

export interface SankeyLink {
  source: string;
  target: string;
  value: number;
}

export interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}

/** Map GA4 channelMix keys → CRM channelAttribution names */
export const CHANNEL_MAP: Record<string, string> = {
  organic: 'Organic Search',
  direct: 'Direct',
  social: 'Social Media',
  email: 'Email',
  paid: 'Paid Search',
  referral: 'Referral',
};

export function buildSankeyData(web: WebMetrics, crm: CrmMetrics): SankeyData {
  const mix = web.channelMix;
  const totalSessions = web.sessions;
  const attrByChannel = new Map(crm.channelAttribution.map(a => [a.channel, a]));

  const nodes: SankeyNode[] = [];
  const nodeSet = new Set<string>();
  const links: SankeyLink[] = [];

  function addNode(name: string) {
    if (!nodeSet.has(name)) {
      nodeSet.add(name);
      nodes.push({ name });
    }
  }

  // Channel nodes → "Sessions" aggregate node
  addNode('Sessions');

  for (const [key, channelName] of Object.entries(CHANNEL_MAP)) {
    const pct = mix[key as keyof typeof mix] ?? 0;
    const sessions = Math.round(totalSessions * pct / 100);

    if (sessions <= 0) continue;

    addNode(channelName);
    links.push({ source: channelName, target: 'Sessions', value: sessions });
  }

  // Sessions → Leads: sum of all channel leads from CRM attribution
  const totalLeads = crm.funnel.leads;
  if (totalLeads > 0) {
    addNode('Leads');
    links.push({ source: 'Sessions', target: 'Leads', value: totalLeads });

    // Non-converting sessions
    const nonConverting = totalSessions - totalLeads;
    if (nonConverting > 0) {
      addNode('Bounced / No Conversion');
      links.push({ source: 'Sessions', target: 'Bounced / No Conversion', value: nonConverting });
    }
  }

  // Funnel stages: Leads → MQL → SQL → Pipeline → Won
  const funnel = crm.funnel;
  const funnelSteps: [string, string, number][] = [
    ['Leads', 'MQL', funnel.mql],
    ['MQL', 'SQL', funnel.sql],
    ['SQL', 'Pipeline', funnel.pipeline],
    ['Pipeline', 'Won', funnel.won],
  ];

  for (const [source, target, value] of funnelSteps) {
    if (value > 0) {
      addNode(target);
      links.push({ source, target, value });
    }
  }

  // Drop-off at each funnel stage
  const losses: [string, string, number][] = [
    ['Leads', 'Lost at Leads', funnel.leads - funnel.mql],
    ['MQL', 'Lost at MQL', funnel.mql - funnel.sql],
    ['SQL', 'Lost at SQL', funnel.sql - funnel.pipeline],
    ['Pipeline', 'Lost at Pipeline', funnel.pipeline - funnel.won],
  ];

  for (const [source, lostName, lost] of losses) {
    if (lost > 0) {
      addNode(lostName);
      links.push({ source, target: lostName, value: lost });
    }
  }

  return { nodes, links };
}

/** Summary stats for KPI cards */
export interface CrossChannelSummary {
  totalSessions: number;
  totalLeads: number;
  overallConversionRate: number;
  topChannel: { name: string; sessions: number };
  bestConvertingChannel: { name: string; rate: number } | null;
  totalWon: number;
  winRate: number;
}

export function buildCrossChannelSummary(web: WebMetrics, crm: CrmMetrics): CrossChannelSummary {
  const mix = web.channelMix;
  const totalSessions = web.sessions;
  const totalLeads = crm.funnel.leads;
  const overallConversionRate = totalSessions > 0 ? (totalLeads / totalSessions) * 100 : 0;

  // Top channel by absolute sessions
  let topKey = 'organic';
  let topVal = 0;
  for (const [key, pct] of Object.entries(mix) as [string, number][]) {
    const abs = Math.round(totalSessions * pct / 100);
    if (abs > topVal) { topKey = key; topVal = abs; }
  }
  const topChannel = { name: CHANNEL_MAP[topKey] || topKey, sessions: topVal };

  // Best converting channel (leads / channel sessions)
  let bestConvertingChannel: { name: string; rate: number } | null = null;
  for (const [key, channelName] of Object.entries(CHANNEL_MAP)) {
    const pct = mix[key as keyof typeof mix] ?? 0;
    const sessions = Math.round(totalSessions * pct / 100);
    const attr = crm.channelAttribution.find(a => a.channel === channelName);
    if (sessions > 0 && attr && attr.leads > 0) {
      const rate = (attr.leads / sessions) * 100;
      if (!bestConvertingChannel || rate > bestConvertingChannel.rate) {
        bestConvertingChannel = { name: channelName, rate };
      }
    }
  }

  const winRate = crm.funnel.pipeline > 0 ? (crm.funnel.won / crm.funnel.pipeline) * 100 : 0;

  return {
    totalSessions,
    totalLeads,
    overallConversionRate,
    topChannel,
    bestConvertingChannel,
    totalWon: crm.funnel.won,
    winRate,
  };
}
