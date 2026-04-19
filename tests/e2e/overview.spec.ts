import { expect, test } from '@playwright/test';

test.describe('Overview Page', () => {
  test('loads without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/');
    await expect(page).toHaveTitle(/Growth Dashboard/);
    expect(errors).toEqual([]);
  });

  test('renders all 6 KPI cards', async ({ page }) => {
    await page.goto('/');
    const cards = page.locator('.metric-card');
    await expect(cards).toHaveCount(6);
  });

  test('renders traffic trend chart', async ({ page }) => {
    await page.goto('/');
    const chart = page.locator('#traffic-trend-chart canvas');
    await expect(chart).toBeVisible();
  });

  test('renders channel mix chart', async ({ page }) => {
    await page.goto('/');
    const chart = page.locator('#channel-mix-chart canvas');
    await expect(chart).toBeVisible();
  });

  test('sidebar navigation has 7 links', async ({ page }) => {
    await page.goto('/');
    const navLinks = page.locator('.nav-link');
    await expect(navLinks).toHaveCount(7);
  });

  test('Command Center nav is active', async ({ page }) => {
    await page.goto('/');
    const activeLink = page.locator('.nav-link.active');
    await expect(activeLink).toHaveText(/Command Center/);
  });

  test('data source status strip is visible', async ({ page }) => {
    await page.goto('/');
    const strip = page.locator('.status-strip');
    await expect(strip).toBeVisible();
  });

  test('date range selector works', async ({ page }) => {
    await page.goto('/');
    const btn7d = page.locator('.range-btn[data-range="7d"]');
    await btn7d.click();
    await expect(btn7d).toHaveClass(/active/);
  });
});
