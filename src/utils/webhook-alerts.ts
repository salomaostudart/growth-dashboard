/**
 * Webhook Alerts — dispatches alerts when thresholds are crossed.
 * Runs server-side during build or via MCP.
 * Webhook URL configured via WEBHOOK_URL env var.
 */

export interface AlertThreshold {
  metric: string;
  condition: 'above' | 'below';
  value: number;
  message: string;
}

export interface AlertPayload {
  timestamp: string;
  alert: string;
  metric: string;
  currentValue: number;
  threshold: number;
  condition: string;
  dashboard: string;
}

export const DEFAULT_THRESHOLDS: AlertThreshold[] = [
  { metric: 'bounceRate', condition: 'above', value: 55, message: 'Bounce rate above 55%' },
  {
    metric: 'conversionRate',
    condition: 'below',
    value: 1.5,
    message: 'Conversion rate below 1.5%',
  },
  {
    metric: 'avgSessionDuration',
    condition: 'below',
    value: 60,
    message: 'Avg session duration below 60s',
  },
  { metric: 'emailOpenRate', condition: 'below', value: 18, message: 'Email open rate below 18%' },
  {
    metric: 'unsubscribeRate',
    condition: 'above',
    value: 0.5,
    message: 'Unsubscribe rate above 0.5%',
  },
  { metric: 'systemsDown', condition: 'above', value: 0, message: 'Martech systems not healthy' },
];

export function checkThresholds(
  metrics: Record<string, number>,
  thresholds: AlertThreshold[] = DEFAULT_THRESHOLDS,
): AlertPayload[] {
  const alerts: AlertPayload[] = [];

  for (const t of thresholds) {
    const current = metrics[t.metric];
    if (current === undefined) continue;

    const triggered =
      (t.condition === 'above' && current > t.value) ||
      (t.condition === 'below' && current < t.value);

    if (triggered) {
      alerts.push({
        timestamp: new Date().toISOString(),
        alert: t.message,
        metric: t.metric,
        currentValue: current,
        threshold: t.value,
        condition: t.condition,
        dashboard: 'https://growth.sal.dev.br',
      });
    }
  }

  return alerts;
}

export async function dispatchWebhook(
  webhookUrl: string,
  alerts: AlertPayload[],
): Promise<boolean> {
  if (!webhookUrl || alerts.length === 0) return false;

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `🚨 GrowthHQ Alert — ${alerts.length} threshold(s) crossed`,
        blocks: alerts.map((a) => ({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${a.alert}*\n${a.metric}: ${a.currentValue} (threshold: ${a.condition} ${a.threshold})`,
          },
        })),
        alerts,
      }),
    });
    return response.ok;
  } catch {
    return false;
  }
}
