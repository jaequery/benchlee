// Optional browser acceptance check against the isolated read-only fixture server.
// Set PLAYWRIGHT_MODULE to a local Playwright module when it is not installed here.
import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.BENCHLEE_PREVIEW_URL || 'http://localhost:3017';
const browser = await chromium.launch({ headless: true });
const pages = ['/', '/tasks', '/tasks/saas-pricing', '/models', '/models/claude-opus-5', '/a/fixture-artifact-1-1', '/compare', '/leaderboard', '/methodology', '/benchmark/11111111-1111-4111-8111-111111111111', '/missing-page'];
try {
  for (const width of [390, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 1000 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const route of pages) {
      const response = await page.goto(base + route, { waitUntil: 'networkidle' });
      assert.equal(response.status(), route === '/missing-page' ? 404 : 200, route);
      assert.equal(await page.locator('a[href^="/arena"], a[href="/benchmark"], form').count(), 0, route);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
      assert.equal(overflow, false, `${width}px horizontal overflow: ${route}`);
      for (const details of await page.locator('main details').all()) {
        const summary = details.locator(':scope > summary');
        await summary.focus();
        const wasOpen = await details.evaluate(el => el.open);
        await page.keyboard.press('Enter');
        assert.equal(await details.evaluate(el => el.open), !wasOpen, `Keyboard disclosure: ${route}`);
        await page.keyboard.press('Enter');
      }
      for (const frame of await page.locator('main iframe').all()) assert.equal(await frame.getAttribute('sandbox'), 'allow-scripts');
      if (route === '/') {
        const menu = page.locator('header details');
        if (width < 768) {
          await menu.locator('summary').click();
          for (const link of await menu.locator('nav a').all()) assert.ok(await link.isVisible());
          await menu.locator('summary').click();
        }
        for (const frame of await page.locator('main iframe').all()) {
          await frame.scrollIntoViewIfNeeded();
          await page.waitForFunction(id => {
            const frame = document.querySelector(`iframe[src="${id}"]`);
            return frame && getComputedStyle(frame).opacity === '1';
          }, await frame.getAttribute('src'));
        }
        await page.evaluate(() => { document.activeElement?.blur(); window.scrollTo({ top: 0, behavior: "instant" }); });
        assert.ok(await page.locator('main iframe').count() > 0);
        await page.screenshot({ path: `/tmp/benchlee-home-${width}.png`, fullPage: true, style: "nextjs-portal { display: none; }" });
      }
      console.log(`${width}px ${route}: status, navigation, overflow, disclosure and sandbox passed`);
    }
    assert.deepEqual(errors, []);
    await page.close();
  }
  const request = await browser.newContext();
  for (const route of ['/api/vote', '/api/benchmark']) {
    const response = await request.request.post(base + route, { data: {} });
    assert.equal(response.status(), 410);
    console.log(`POST ${route}: 410`);
  }
  for (const [route, destination] of [['/arena?task=saas-pricing', '/compare?task=saas-pricing'], ['/benchmark', '/tasks']]) {
    const response = await request.request.get(base + route, { maxRedirects: 0 });
    assert.equal(response.status(), 307);
    assert.equal(response.headers().location, destination);
    console.log(`${route}: redirects to ${destination}`);
  }
} finally { await browser.close(); }
