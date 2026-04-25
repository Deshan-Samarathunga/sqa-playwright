// tests/crop_jpg_playwright.spec.js
// Playwright test suite for PixelsSuite Crop JPG workflow.

const { test, expect } = require('@playwright/test');
const path = require('path');

const PAGE_URL = 'https://www.pixelssuite.com/crop-jpg';
const FIXTURE_FILE = path.resolve(__dirname, 'fixtures', 'sample.jpg');

// Flexible locators first (assignment requirement).
function cropHeading(page) {
  // TODO: switch to a dedicated test id if the app adds one.
  return page
    .getByRole('heading', { name: /^Crop JPG$/i })
    .or(page.getByText('Crop JPG', { exact: true }));
}

function selectFilesButton(page) {
  return page
    .getByRole('button', { name: /^Select files$/i })
    .or(page.getByText('Select files', { exact: true }));
}

function hiddenFileInput(page) {
  return page.locator('input[type="file"]');
}

function clearText(page) {
  return page.getByText('Clear', { exact: true });
}

function originalText(page) {
  return page.getByText(/^Original:/i);
}

function downloadButton(page) {
  return page.getByRole('button', { name: /download/i });
}

function cropValueInputs(page) {
  return page.locator('input:visible:not([type="file"])');
}

function cropImage(page) {
  return page.locator('img[alt="to-crop"]');
}

function previewCanvas(page) {
  return page.locator('canvas.max-w-full.h-auto');
}

function cropSelectionBox(page) {
  // TODO: this style-based locator is robust today, but use a test id if available later.
  return page.locator('div.relative.inline-block > div[style*="cursor: move"]').first();
}

async function openCropPage(page) {
  await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded' });
}

async function uploadFixtureImage(page) {
  await hiddenFileInput(page).first().setInputFiles(FIXTURE_FILE);

  // Screenshot point: upload completed and crop tool is initialized.
  await expect(originalText(page)).toBeVisible({ timeout: 15000 });
  await expect(clearText(page)).toBeVisible();
}

async function getFirstFourVisibleCropInputs(page) {
  const inputs = cropValueInputs(page);
  const count = await inputs.count();
  expect(count).toBeGreaterThanOrEqual(4);

  return {
    xInput: inputs.nth(0),
    yInput: inputs.nth(1),
    widthInput: inputs.nth(2),
    heightInput: inputs.nth(3),
  };
}

async function readCropValues(page) {
  const { xInput, yInput, widthInput, heightInput } = await getFirstFourVisibleCropInputs(page);

  return {
    x: Number(await xInput.inputValue()),
    y: Number(await yInput.inputValue()),
    width: Number(await widthInput.inputValue()),
    height: Number(await heightInput.inputValue()),
  };
}

test('TC_CROP_001 Access Crop JPG page', async ({ page }) => {
  await openCropPage(page);

  // Screenshot point: successful page entry.
  await expect(cropHeading(page)).toBeVisible({ timeout: 15000 });
  await expect(selectFilesButton(page)).toBeVisible();
  await expect(hiddenFileInput(page).first()).toBeAttached();

  // Confirms the expected route loaded.
  await expect(page).toHaveURL(/\/crop-jpg$/i);
});

test('TC_CROP_002 Verify initial UI state', async ({ page }) => {
  await openCropPage(page);

  // Screenshot point: initial/default state before upload.
  await expect(selectFilesButton(page)).toBeVisible();
  await expect(originalText(page)).not.toBeVisible();

  // Empty crop/default state checks without relying only on one exact placeholder text.
  expect(await cropValueInputs(page).count()).toBe(0);
  await expect(cropImage(page)).not.toBeVisible();

  // Preview should still be in default state before upload.
  // Some builds keep a canvas node mounted, so we avoid asserting strict DOM absence.
  await expect(downloadButton(page)).not.toBeVisible();
  await expect(clearText(page)).not.toBeVisible();
});

test('TC_CROP_003 Open file selector', async ({ page }) => {
  await openCropPage(page);

  // Intended to open the operating system file picker dialog.
  // The visible "Select files" label is nested; click its wrapper for reliability.
  await selectFilesButton(page).first().locator('xpath=..').click({ force: true });

  // Minimal stable assertion after click path.
  await expect(hiddenFileInput(page).first()).toBeAttached();

  // TODO: native OS file dialogs are outside Playwright DOM assertions.
  // Upload itself is validated with setInputFiles in later test cases.
});

test('TC_CROP_004 Upload valid JPG image', async ({ page }) => {
  await openCropPage(page);
  await uploadFixtureImage(page);

  // Screenshot point: upload result in crop + preview panes.
  await expect(originalText(page)).toBeVisible();
  await expect(cropImage(page)).toBeVisible();
  await expect(cropSelectionBox(page)).toBeVisible();
  await expect(previewCanvas(page)).toBeVisible();
  await expect(clearText(page)).toBeVisible();
});

test('TC_CROP_005 Verify crop value text boxes after upload', async ({ page }) => {
  await openCropPage(page);
  await uploadFixtureImage(page);

  const { xInput, yInput, widthInput, heightInput } = await getFirstFourVisibleCropInputs(page);

  // Screenshot point: the first four non-file inputs interpreted as X/Y/Width/Height.
  await expect(xInput).toBeVisible();
  await expect(yInput).toBeVisible();
  await expect(widthInput).toBeVisible();
  await expect(heightInput).toBeVisible();

  await expect(xInput).toHaveValue(/.+/);
  await expect(yInput).toHaveValue(/.+/);
  await expect(widthInput).toHaveValue(/.+/);
  await expect(heightInput).toHaveValue(/.+/);
});

test('TC_CROP_006 Edit crop using text boxes', async ({ page }) => {
  await openCropPage(page);
  await uploadFixtureImage(page);

  const { xInput, yInput, widthInput, heightInput } = await getFirstFourVisibleCropInputs(page);

  // Screenshot point: manual crop values edited via text boxes.
  await xInput.fill('5');
  await expect(xInput).toHaveValue('5');

  await yInput.fill('5');
  await expect(yInput).toHaveValue('5');

  await widthInput.fill('70');
  await expect(widthInput).toHaveValue('70');

  await heightInput.fill('50');
  await expect(heightInput).toHaveValue('50');
});

test('TC_CROP_007 Adjust crop region using mouse', async ({ page }) => {
  await openCropPage(page);
  await uploadFixtureImage(page);

  // Reduce selection first so mouse drag can visibly move crop coordinates.
  const { widthInput, heightInput } = await getFirstFourVisibleCropInputs(page);
  await widthInput.fill('70');
  await heightInput.fill('50');

  await expect(cropSelectionBox(page)).toBeVisible();
  const before = await readCropValues(page);

  // TODO: if this move-box locator changes, replace with a dedicated crop selection test id.
  const selectionBox = cropSelectionBox(page);
  const selectionBounds = await selectionBox.boundingBox();
  expect(selectionBounds).toBeTruthy();

  // Screenshot point: moving crop selection with mouse drag.
  await page.mouse.move(
    selectionBounds.x + selectionBounds.width / 2,
    selectionBounds.y + selectionBounds.height / 2
  );
  await page.mouse.down();
  await page.mouse.move(
    selectionBounds.x + selectionBounds.width / 2 + 10,
    selectionBounds.y + selectionBounds.height / 2 + 8,
    { steps: 8 }
  );
  await page.mouse.up();

  const after = await readCropValues(page);
  const didChange =
    after.x !== before.x ||
    after.y !== before.y ||
    after.width !== before.width ||
    after.height !== before.height;

  await expect(previewCanvas(page)).toBeVisible();
  expect(didChange).toBeTruthy();
});

test('TC_CROP_008 Download cropped image', async ({ page }) => {
  await openCropPage(page);
  await uploadFixtureImage(page);

  await expect(downloadButton(page)).toBeVisible();

  // Screenshot point: clicking download and capturing the download event.
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 15000 }),
    downloadButton(page).click(),
  ]);

  expect(download).toBeTruthy();

  // Optional file name check when a name is provided by the browser.
  const suggestedName = download.suggestedFilename();
  expect(suggestedName.length).toBeGreaterThan(0);
});

test('TC_CROP_009 Reset using Clear button', async ({ page }) => {
  await openCropPage(page);
  await uploadFixtureImage(page);

  await expect(clearText(page)).toBeVisible();
  await clearText(page).click();

  // Screenshot point: reset/default state after Clear.
  await expect(originalText(page)).not.toBeVisible();
  expect(await cropValueInputs(page).count()).toBe(0);
  await expect(selectFilesButton(page)).toBeVisible();

  // Secondary assertion only: placeholder text if currently rendered.
  const noImageYet = page.getByText('No image yet', { exact: true });
  if (await noImageYet.count()) {
    await expect(noImageYet.first()).toBeVisible();
  }
});
