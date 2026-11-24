const assert = require('assert');
const { chromium, devices } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

async function swipe(page, from, to) {
  const session = await page.context().newCDPSession(page);
  try {
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 190, y: from }] });
    for (let step = 1; step <= 15; step++) {
      await session.send('Input.dispatchTouchEvent', {
        type: 'touchMove', touchPoints: [{ x: 190, y: from + (to - from) * step / 15 }],
      });
      await new Promise(resolve => setTimeout(resolve, 20));
    }
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    // Let the SDK's scroll inertia and navbar transition settle before measuring.
    await page.waitForTimeout(500);
  } finally {
    await session.detach();
  }
}

async function run() {
  const browser = await chromium.launch({ executablePath: process.env.CHROME_EXECUTABLE || undefined, headless: true });
  try {
    // The unfixed control proves that the gesture reaches the original auto-hide path.
    for (const pinToolbar of [false, true]) {
      const context = await browser.newContext({ ...devices['iPhone 14 Pro Max'], viewport: { width: 390, height: 844 } });
      try {
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.goto(process.env.PREVIEW_URL || 'http://localhost:3001');
        await page.getByRole('status').getByText('已就绪', { exact: true }).waitFor({ timeout: 45000 });
        await page.evaluate(async enabled => {
          function find(vm) {
            return vm.$options.name === 'VueOfficePreview' ? vm : vm.$children.map(find).find(Boolean);
          }
          const preview = find(document.querySelector('main').__vue__);
          if (preview.option.pinToolbar !== enabled) {
            await new Promise(resolve => { preview.$once('ready', resolve); preview.option.pinToolbar = enabled; });
          }
        }, pinToolbar);
        const frame = page.frames().find(item => item.url().includes('/documenteditor/'));
        await frame.getByText(/文件加载中/).waitFor({ state: 'hidden' });
        const standardView = frame.locator('.icon-standard-view');
        if (await standardView.count()) await standardView.click();
        await frame.locator('.icon-mobile-view').waitFor();
        const toolbar = frame.locator('#editor-navbar .subnavbar');
        const before = await toolbar.evaluate(el => el.getBoundingClientRect().top);
        const contentBefore = await frame.locator('#id_viewer').screenshot();
        await swipe(page, 650, 300);
        const after = await toolbar.evaluate(el => el.getBoundingClientRect().top);
        if (!pinToolbar) {
          assert.ok(after < 0, 'control must reproduce the toolbar disappearing');
          console.log('PASS: unfixed control reproduces the hidden toolbar');
          continue;
        }
        assert.ok(after >= 0 && Math.abs(after - before) < 1, 'toolbar must stay at its original position');
        assert.notDeepStrictEqual(await frame.locator('#id_viewer').screenshot(), contentBefore, 'document must still scroll');
        await swipe(page, 300, 650);
        assert.ok(Math.abs(await toolbar.evaluate(el => el.getBoundingClientRect().top) - before) < 1);
        await page.getByRole('button', { name: '专注阅读', exact: true }).click();
        await swipe(page, 650, 300);
        assert.ok(await toolbar.evaluate(el => el.getBoundingClientRect().top) >= 0);
        await page.setViewportSize({ width: 844, height: 390 });
        await swipe(page, 280, 150);
        assert.ok(await toolbar.evaluate(el => el.getBoundingClientRect().top) >= 0);
        await frame.locator('#btn-settings').tap();
        await frame.locator('.settings-popup.modal-in, #settings-popover.modal-in').waitFor();
        assert.deepStrictEqual(errors, []);
        console.log('PASS: pinned toolbar, real document scrolling, focus mode, landscape and settings');
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }
}
run().catch(error => { console.error(error); process.exitCode = 1; });
