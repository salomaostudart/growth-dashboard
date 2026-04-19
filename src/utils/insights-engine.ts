/**
 * Insights Engine — rule-based automatic insights from connector data.
 * No LLM — pure threshold/trend/comparison rules.
 */

import type {
  CrmMetrics,
  EmailMetrics,
  MartechHealth,
  SeoMetrics,
  WebMetrics,
} from '../connectors/base/connector.schema';

export interface Insight {
  type: 'positive' | 'negative' | 'neutral';
  category: string;
  title: string;
  description: string;
  metric?: string;
  value?: string;
}

export function generateInsights(data: {
  web?: WebMetrics;
  seo?: SeoMetrics;
  email?: EmailMetrics;
  crm?: CrmMetrics;
  martech?: MartechHealth;
}): Insight[] {
  const insights: Insight[] = [];

  if (data.web) {
    const w = data.web;

    // Bounce rate
    if (w.bounceRate > 55) {
      insights.push({
        type: 'negative',
        category: 'Web',
        title: 'High bounce rate',
        description: `Bounce rate is ${w.bounceRate.toFixed(1)}% — above the 55% threshold. Consider reviewing landing page relevance and load times.`,
        metric: 'Bounce Rate',
        value: `${w.bounceRate.toFixed(1)}%`,
      });
    } else if (w.bounceRate < 35) {
      insights.push({
        type: 'positive',
        category: 'Web',
        title: 'Excellent bounce rate',
        description: `Bounce rate is ${w.bounceRate.toFixed(1)}% — well below average. Users are engaging with content.`,
        metric: 'Bounce Rate',
        value: `${w.bounceRate.toFixed(1)}%`,
      });
    }

    // Mobile vs desktop
    if (w.deviceBreakdown.mobile > 40) {
      insights.push({
        type: 'neutral',
        category: 'Web',
        title: 'Mobile-heavy traffic',
        description: `${w.deviceBreakdown.mobile.toFixed(0)}% of sessions are mobile. Ensure mobile UX and Core Web Vitals are optimized.`,
        metric: 'Mobile %',
        value: `${w.deviceBreakdown.mobile.toFixed(0)}%`,
      });
    }

    // Channel concentration
    const channels = w.channelMix;
    const maxChannel = Object.entries(channels).sort((a, b) => b[1] - a[1])[0];
    if (maxChannel && maxChannel[1] > 55) {
      insights.push({
        type: 'negative',
        category: 'Web',
        title: 'Channel concentration risk',
        description: `${maxChannel[1].toFixed(0)}% of traffic comes from ${maxChannel[0]}. Diversify acquisition to reduce dependency.`,
        metric: maxChannel[0],
        value: `${maxChannel[1].toFixed(0)}%`,
      });
    }

    // Session duration
    if (w.avgSessionDuration < 60) {
      insights.push({
        type: 'negative',
        category: 'Web',
        title: 'Low session duration',
        description: `Average session is ${Math.round(w.avgSessionDuration)}s. Users may not be finding relevant content.`,
        metric: 'Avg Duration',
        value: `${Math.round(w.avgSessionDuration)}s`,
      });
    } else if (w.avgSessionDuration > 240) {
      insights.push({
        type: 'positive',
        category: 'Web',
        title: 'Strong engagement',
        description: `Average session is ${Math.round(w.avgSessionDuration / 60)}m ${Math.round(w.avgSessionDuration % 60)}s — users are spending quality time.`,
        metric: 'Avg Duration',
        value: `${Math.round(w.avgSessionDuration / 60)}m`,
      });
    }

    // Traffic trend (compare last 7 days vs previous 7 days)
    const recent = w.trafficByDay.slice(-7);
    const prev = w.trafficByDay.slice(-14, -7);
    if (recent.length >= 7 && prev.length >= 7) {
      const recentAvg = recent.reduce((a, d) => a + d.sessions, 0) / 7;
      const prevAvg = prev.reduce((a, d) => a + d.sessions, 0) / 7;
      const change = prevAvg > 0 ? ((recentAvg - prevAvg) / prevAvg) * 100 : 0;
      if (change > 15) {
        insights.push({
          type: 'positive',
          category: 'Web',
          title: 'Traffic surge',
          description: `Sessions up ${change.toFixed(0)}% week-over-week. Investigate what's driving the spike.`,
          metric: 'WoW Change',
          value: `+${change.toFixed(0)}%`,
        });
      } else if (change < -15) {
        insights.push({
          type: 'negative',
          category: 'Web',
          title: 'Traffic decline',
          description: `Sessions down ${Math.abs(change).toFixed(0)}% week-over-week. Check for technical issues or campaign pauses.`,
          metric: 'WoW Change',
          value: `${change.toFixed(0)}%`,
        });
      }
    }
  }

  if (data.seo) {
    const s = data.seo;

    // Average position
    if (s.avgPosition <= 5) {
      insights.push({
        type: 'positive',
        category: 'SEO',
        title: 'Strong search position',
        description: `Average position is ${s.avgPosition.toFixed(1)} — top 5. Maintain content freshness.`,
      });
    } else if (s.avgPosition > 20) {
      insights.push({
        type: 'negative',
        category: 'SEO',
        title: 'Weak search position',
        description: `Average position is ${s.avgPosition.toFixed(1)}. Focus on content optimization and backlinks.`,
      });
    }

    // CTR vs position benchmark
    if (s.ctr < 2 && s.avgPosition <= 10) {
      insights.push({
        type: 'negative',
        category: 'SEO',
        title: 'Low CTR for position',
        description: `CTR is ${s.ctr.toFixed(1)}% despite top-10 position. Improve title tags and meta descriptions.`,
      });
    }

    // Top query opportunity
    const lowPosHighImp = s.topQueries.filter((q) => q.position > 10 && q.impressions > 200);
    if (lowPosHighImp.length > 0) {
      insights.push({
        type: 'neutral',
        category: 'SEO',
        title: `${lowPosHighImp.length} keyword opportunities`,
        description: `${lowPosHighImp.length} queries with 200+ impressions rank below position 10. Optimize content for: ${lowPosHighImp
          .slice(0, 3)
          .map((q) => `"${q.query}"`)
          .join(', ')}.`,
      });
    }
  }

  if (data.email) {
    const e = data.email;

    if (e.openRate > 30) {
      insights.push({
        type: 'positive',
        category: 'Email',
        title: 'Above-average open rate',
        description: `Open rate is ${e.openRate.toFixed(1)}% — industry average is ~21%. Subject lines are working.`,
      });
    } else if (e.openRate < 18) {
      insights.push({
        type: 'negative',
        category: 'Email',
        title: 'Low open rate',
        description: `Open rate is ${e.openRate.toFixed(1)}% — below industry average. Test subject lines and send times.`,
      });
    }

    if (e.unsubscribeRate > 0.5) {
      insights.push({
        type: 'negative',
        category: 'Email',
        title: 'High unsubscribe rate',
        description: `${e.unsubscribeRate.toFixed(2)}% unsubscribe rate — above 0.5% threshold. Review email frequency and relevance.`,
      });
    }

    const pausedAutomations = e.automations.filter((a) => a.status === 'paused');
    if (pausedAutomations.length > 0) {
      insights.push({
        type: 'neutral',
        category: 'Email',
        title: `${pausedAutomations.length} paused automation(s)`,
        description: `${pausedAutomations.map((a) => a.name).join(', ')} — consider reactivating or removing.`,
      });
    }
  }

  if (data.crm) {
    const c = data.crm;

    // Funnel drop-offs
    const mqlRate = c.funnel.leads > 0 ? (c.funnel.mql / c.funnel.leads) * 100 : 0;
    const sqlRate = c.funnel.mql > 0 ? (c.funnel.sql / c.funnel.mql) * 100 : 0;

    if (mqlRate < 30) {
      insights.push({
        type: 'negative',
        category: 'CRM',
        title: 'Low lead-to-MQL rate',
        description: `Only ${mqlRate.toFixed(0)}% of leads qualify as MQL. Review lead scoring criteria or acquisition quality.`,
      });
    }
    if (sqlRate < 25) {
      insights.push({
        type: 'negative',
        category: 'CRM',
        title: 'MQL-to-SQL bottleneck',
        description: `${sqlRate.toFixed(0)}% MQL-to-SQL conversion. Sales and marketing alignment may need attention.`,
      });
    }

    // Best/worst channel by CAC
    const sorted = [...c.channelAttribution].sort((a, b) => a.cac - b.cac);
    if (sorted.length >= 2) {
      insights.push({
        type: 'neutral',
        category: 'CRM',
        title: 'CAC spread across channels',
        description: `Best CAC: ${sorted[0].channel} ($${sorted[0].cac}). Worst: ${sorted[sorted.length - 1].channel} ($${sorted[sorted.length - 1].cac}). Consider reallocating budget.`,
      });
    }
  }

  if (data.martech) {
    const m = data.martech;

    const degraded = m.systems.filter((s) => s.status !== 'healthy');
    if (degraded.length > 0) {
      insights.push({
        type: 'negative',
        category: 'Martech',
        title: `${degraded.length} system(s) not healthy`,
        description: `${degraded.map((s) => `${s.name} (${s.status})`).join(', ')}. Check integrations.`,
      });
    }

    const failedAutomations = m.automationLog.filter((l) => l.status === 'failed');
    const failRate =
      m.automationLog.length > 0 ? (failedAutomations.length / m.automationLog.length) * 100 : 0;
    if (failRate > 15) {
      insights.push({
        type: 'negative',
        category: 'Martech',
        title: 'High automation failure rate',
        description: `${failRate.toFixed(0)}% of recent automations failed. Review error logs and retry policies.`,
      });
    }

    const highLatency = m.systems.filter((s) => s.latencyMs > 500);
    if (highLatency.length > 0) {
      insights.push({
        type: 'neutral',
        category: 'Martech',
        title: 'High latency systems',
        description: `${highLatency.map((s) => s.name).join(', ')} have latency > 500ms. May affect data freshness.`,
      });
    }
  }

  return insights;
}
