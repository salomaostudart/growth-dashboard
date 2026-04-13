import { describe, it, expect } from 'vitest';
import { checkThresholds, dispatchWebhook, DEFAULT_THRESHOLDS } from '../../src/utils/webhook-alerts';

describe('Webhook Alerts — checkThresholds', () => {
  it('triggers alert when metric is above threshold', () => {
    const alerts = checkThresholds({ bounceRate: 60 });
    const found = alerts.find(a => a.metric === 'bounceRate');
    expect(found).toBeDefined();
    expect(found!.condition).toBe('above');
    expect(found!.currentValue).toBe(60);
  });

  it('does not trigger when metric is within threshold', () => {
    const alerts = checkThresholds({ bounceRate: 40 });
    const found = alerts.find(a => a.metric === 'bounceRate');
    expect(found).toBeUndefined();
  });

  it('triggers alert when metric is below threshold', () => {
    const alerts = checkThresholds({ conversionRate: 1.0 });
    const found = alerts.find(a => a.metric === 'conversionRate');
    expect(found).toBeDefined();
    expect(found!.condition).toBe('below');
  });

  it('ignores undefined metrics', () => {
    const alerts = checkThresholds({});
    expect(alerts).toEqual([]);
  });

  it('supports custom thresholds', () => {
    const alerts = checkThresholds(
      { customMetric: 100 },
      [{ metric: 'customMetric', condition: 'above', value: 50, message: 'Too high' }]
    );
    expect(alerts).toHaveLength(1);
    expect(alerts[0].alert).toBe('Too high');
  });

  it('includes dashboard URL in payload', () => {
    const alerts = checkThresholds({ bounceRate: 60 });
    expect(alerts[0].dashboard).toBe('https://growth.sal.dev.br');
  });

  it('includes ISO timestamp', () => {
    const alerts = checkThresholds({ bounceRate: 60 });
    expect(alerts[0].timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('DEFAULT_THRESHOLDS has 6 entries', () => {
    expect(DEFAULT_THRESHOLDS).toHaveLength(6);
  });
});

describe('Webhook Alerts — dispatchWebhook', () => {
  it('returns false with empty URL', async () => {
    const result = await dispatchWebhook('', [{ timestamp: '', alert: '', metric: '', currentValue: 0, threshold: 0, condition: '', dashboard: '' }]);
    expect(result).toBe(false);
  });

  it('returns false with empty alerts array', async () => {
    const result = await dispatchWebhook('https://hooks.example.com', []);
    expect(result).toBe(false);
  });
});
