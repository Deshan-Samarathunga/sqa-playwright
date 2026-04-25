// playwright.config.js
// ────────────────────────────────────────────────────────────────────────────
// Playwright configuration for the PixelsSuite Crop-JPG test suite.
// • Chromium only, headed mode so you can watch the tests run.
// • HTML report generated automatically after each run.
// • Screenshots captured on failure, video recorded on failure,
//   and a full trace is kept on the first retry for debugging.
// ────────────────────────────────────────────────────────────────────────────

const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  /* ── Global settings ─────────────────────────────────────────────────── */
  testDir: './tests',                // folder that contains *.spec.js files
  timeout: 60_000,                   // 60 s per test (uploads may be slow)
  retries: 1,                        // retry once on failure (trace captured)
  workers: 1,                        // run tests sequentially for stability

  /* ── Reporter ────────────────────────────────────────────────────────── */
  reporter: [['html', { open: 'never' }]], // generates playwright-report/index.html

  /* ── Shared browser settings ─────────────────────────────────────────── */
  use: {
    headless: false,                 // headed mode – browser window visible
    screenshot: 'only-on-failure',   // auto-capture screenshot on failure
    video: 'retain-on-failure',      // keep video recording only on failure
    trace: 'on-first-retry',         // full trace on first retry for debugging
  },

  /* ── Projects (Chromium only) ────────────────────────────────────────── */
  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
      },
    },
  ],
});
