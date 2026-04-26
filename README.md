# SQA Playwright - Crop JPG Automation

This project contains Playwright automation tests for the PixelsSuite **Crop JPG** workflow.

## Website Under Test

- https://www.pixelssuite.com/crop-jpg

## Prerequisites

- Node.js (LTS)
- npm

## Setup

```bash
npm install
npx playwright install
```

## Run Tests

Run all tests:

```bash
npx playwright test
```

Run only the Crop JPG spec:

```bash
npx playwright test tests/crop_jpg_playwright.spec.js
```

Run with UI mode:

```bash
npx playwright test --ui
```

## View HTML Report

```bash
npx playwright show-report
```

## Main Test File

- `tests/crop_jpg_playwright.spec.js`
