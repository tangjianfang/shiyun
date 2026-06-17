# 诗云 · 自动化 E2E 测试（未来规划）

> **当前状态**：本期使用手动测试清单（manual-test.md）。
> **本文件**：说明未来如何接入 Playwright / Cypress 进行自动化。

## 为什么不用 Playwright？

- 本项目双击 HTML 即可使用（无服务器）
- 学习版是 `file://` 协议，Playwright 需特殊配置
- 测试对象主要是 UI 渲染和交互，Vitest 单元测试 + 手动测试已覆盖大部分场景
- 个人项目，自动化 ROI 较低

## 何时引入自动化

- 团队规模 ≥ 3 人时
- CI/CD 流水线要求时
- 频繁回归时

## 推荐方案：Playwright

### 安装

```bash
npm install -D @playwright/test
npx playwright install chromium
```

### 配置 `playwright.config.js`

```javascript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e/automated',
  use: {
    baseURL: 'file:///' + __dirname + '/../dist/诗云-学习版.html',
    headless: true,
    screenshot: 'only-on-failure',
  },
});
```

### 示例测试 `tests/e2e/automated/home.spec.js`

```javascript
import { test, expect } from '@playwright/test';
import path from 'path';

const APP_URL = 'file:///' + path.resolve(__dirname, '../../../dist/诗云-学习版.html').replace(/\\/g, '/');

test.beforeEach(async ({ context }) => {
  // 清空 localStorage
  await context.addInitScript(() => {
    localStorage.clear();
  });
});

test('首页应显示创建用户入口', async ({ page }) => {
  await page.goto(APP_URL);
  await expect(page.locator('.user-card')).toBeVisible();
  await expect(page.locator('#us-btn-new')).toBeVisible();
});

test('创建用户流程', async ({ page }) => {
  await page.goto(APP_URL);
  await page.click('#us-trigger');
  await page.click('#us-btn-new');
  await page.fill('#dlg-name', '测试小明');
  await page.selectOption('#dlg-grade', '3');
  await page.click('.avatar-btn[data-emoji="🐯"]');
  await page.click('#dlg-save');
  await expect(page.locator('.us-name')).toContainText('测试小明');
});

test('学新诗 → 详情页 → 朗读', async ({ page }) => {
  // 先创建用户
  // ...
  await page.click('text=学新诗');
  await expect(page.locator('.poem-list')).toBeVisible();
  await page.locator('.poem-card').first().click();
  await expect(page.locator('.poem-detail')).toBeVisible();
  // 验证有朗读按钮
  await expect(page.locator('button:has-text("朗读")')).toBeVisible();
});

test('进度页加载 4 张统计卡', async ({ page }) => {
  // ...
  await page.click('text=进度');
  await expect(page.locator('.stat-card')).toHaveCount(4);
});
```

### CI 集成

```yaml
# .github/workflows/e2e.yml
name: E2E
on: [push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with: { node-version: 18 }
      - run: npm ci
      - run: npm run build
      - run: npx playwright install --with-deps chromium
      - run: npx playwright test
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

## 推荐方案：Cypress（备选）

```bash
npm install -D cypress
npx cypress open
```

`cypress.config.js`：
```javascript
module.exports = {
  e2e: {
    baseUrl: 'file:///' + __dirname + '/dist/诗云-学习版.html',
    specPattern: 'tests/e2e/cypress/**/*.spec.js',
  },
};
```

## 决策建议

- 优先 Playwright（更快、现代）
- 团队熟悉 Cypress 可选
- 单人项目用手动清单足够
