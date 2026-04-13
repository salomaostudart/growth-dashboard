import { test, expect } from '@playwright/test';

const pages = [
  { path: '/web-performance', title: 'Web Performance', kpis: 6, charts: ['wp-traffic-chart', 'wp-device-chart'] },
  { path: '/seo', title: 'SEO', kpis: 4, charts: ['seo-queries-chart', 'seo-position-chart'] },
  { path: '/email', title: 'Email', kpis: 5, charts: ['email-campaigns-chart', 'email-heatmap-chart'] },
  { path: '/social', title: 'Social', kpis: 4, charts: ['social-followers-chart', 'social-referral-chart'] },
  { path: '/crm-pipeline', title: 'CRM', kpis: 5, charts: ['crm-funnel-chart', 'crm-velocity-chart'] },
  { path: '/martech-health', title: 'Martech', kpis: 6, charts: ['martech-uptime-chart', 'martech-automation-chart'] },
];

for (const pg of pages) {
  test.describe(`${pg.title} Page`, () => {
    test('loads without errors', async ({ page }) => {
      const errors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') errors.push(msg.text());
      });
      await page.goto(pg.path);
      await expect(page).toHaveTitle(/Growth Dashboard/);
      expect(errors).toEqual([]);
    });

    test(`renders ${pg.kpis} KPI cards`, async ({ page }) => {
      await page.goto(pg.path);
      const cards = page.locator('.metric-card');
      await expect(cards).toHaveCount(pg.kpis);
    });

    test('renders charts', async ({ page }) => {
      await page.goto(pg.path);
      for (const chartId of pg.charts) {
        const chart = page.locator(`#${chartId} canvas`);
        await expect(chart).toBeVisible({ timeout: 10000 });
      }
    });

    test('has correct nav active state', async ({ page }) => {
      await page.goto(pg.path);
      const activeLink = page.locator('.nav-link.active');
      await expect(activeLink).toBeVisible();
    });

    test('renders data tables', async ({ page }) => {
      await page.goto(pg.path);
      const tables = page.locator('.data-table');
      expect(await tables.count()).toBeGreaterThan(0);
    });
  });
}
