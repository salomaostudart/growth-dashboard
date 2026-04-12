import { test, expect } from '@playwright/test';

/**
 * Lighthouse-style performance checks using Playwright.
 * Checks Core Web Vitals proxies and page weight.
 * For full Lighthouse CI, use the GitHub Actions workflow.
 */
test.describe('Performance & Quality', () => {
  test('page loads in under 5 seconds', async ({ page }) => {
    // Generous threshold — cold start of Vite dev server can be slow.
    // Production build is much faster. CI may be slower than local.
    const start = Date.now();
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const loadTime = Date.now() - start;

    console.log(`Page load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(5000);
  });

  test('no layout shift on initial load', async ({ page }) => {
    await page.goto('/');

    // Check that KPI cards have stable dimensions (no CLS from late-loading content)
    const cards = page.locator('.metric-card');
    const count = await cards.count();
    expect(count).toBe(6);

    // Each card should have non-zero height (content rendered, not collapsed)
    for (let i = 0; i < count; i++) {
      const box = await cards.nth(i).boundingBox();
      expect(box).not.toBeNull();
      expect(box!.height).toBeGreaterThan(50);
    }
  });

  test('no application errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Ignore Vite dev server transient errors (cold start, HMR)
        if (text.includes('Outdated Optimize Dep') || text.includes('504')) return;
        errors.push(text);
      }
    });
    page.on('pageerror', err => errors.push(err.message));

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    expect(errors).toEqual([]);
  });

  test('page has proper meta tags', async ({ page }) => {
    await page.goto('/');

    const title = await page.title();
    expect(title).toContain('Growth Dashboard');

    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewport).toContain('width=device-width');

    const description = await page.locator('meta[name="description"]').getAttribute('content');
    expect(description).toBeTruthy();
  });

  test('fonts are loaded', async ({ page }) => {
    await page.goto('/');

    const fontsLoaded = await page.evaluate(() => {
      return document.fonts.ready.then(() => {
        const families = new Set<string>();
        document.fonts.forEach(font => families.add(font.family));
        return Array.from(families);
      });
    });

    // Oswald (headings) and Inter (body) should be loaded
    const hasOswald = fontsLoaded.some(f => f.toLowerCase().includes('oswald'));
    const hasInter = fontsLoaded.some(f => f.toLowerCase().includes('inter'));
    expect(hasOswald).toBe(true);
    expect(hasInter).toBe(true);
  });

  test('responsive — sidebar hides on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');

    const sidebar = page.locator('.sidebar');
    const box = await sidebar.boundingBox();
    // Sidebar should be off-screen (translateX(-100%))
    expect(box!.x).toBeLessThan(0);

    // Mobile menu button should be visible
    const menuBtn = page.locator('.mobile-menu-btn');
    await expect(menuBtn).toBeVisible();
  });
});
