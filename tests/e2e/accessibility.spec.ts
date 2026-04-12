import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility — WCAG 2.1 AA', () => {
  test('Overview page has no critical violations', async ({ page }) => {
    await page.goto('/');
    // Wait for charts to render
    await page.waitForSelector('#traffic-trend-chart canvas', { timeout: 5000 });

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .exclude('.chart-body') // ECharts canvas — not auditable by axe
      .analyze();

    const critical = results.violations.filter(v => v.impact === 'critical' || v.impact === 'serious');

    if (critical.length > 0) {
      const summary = critical.map(v =>
        `[${v.impact}] ${v.id}: ${v.description} (${v.nodes.length} instances)`
      ).join('\n');
      console.log('Accessibility violations:\n' + summary);
    }

    expect(critical).toEqual([]);
  });
});
