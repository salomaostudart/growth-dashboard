import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const pages = [
  { path: '/', name: 'Overview', waitFor: '#traffic-trend-chart canvas' },
  { path: '/web-performance', name: 'Web Performance', waitFor: '#wp-traffic-chart canvas' },
  { path: '/seo', name: 'SEO', waitFor: '#seo-queries-chart canvas' },
  { path: '/email', name: 'Email', waitFor: '#email-campaigns-chart canvas' },
  { path: '/social', name: 'Social', waitFor: '#social-followers-chart canvas' },
  { path: '/crm-pipeline', name: 'CRM Pipeline', waitFor: '#crm-funnel-chart canvas' },
  { path: '/martech-health', name: 'Martech Health', waitFor: '#martech-uptime-chart canvas' },
  { path: '/about', name: 'About', waitFor: '.about' },
];

test.describe('Accessibility — WCAG 2.1 AA', () => {
  for (const pg of pages) {
    test(`${pg.name} page has no critical violations`, async ({ page }) => {
      await page.goto(pg.path);
      await page.waitForSelector(pg.waitFor, { timeout: 10000 });

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .exclude('.chart-body') // ECharts canvas — not auditable by axe
        .analyze();

      const critical = results.violations.filter(
        (v) => v.impact === 'critical' || v.impact === 'serious',
      );

      if (critical.length > 0) {
        const summary = critical
          .map((v) => `[${v.impact}] ${v.id}: ${v.description} (${v.nodes.length} instances)`)
          .join('\n');
        console.log(`Accessibility violations on ${pg.name}:\n${summary}`);
      }

      expect(critical).toEqual([]);
    });
  }
});
