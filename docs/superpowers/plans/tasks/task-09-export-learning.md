# Task 9: 生成器-导出学习版

**依赖：** Task 5
**并行组：** generator-content
**估时：** 0.5 天

**Files:**
- Create: `src/generator/exporter.js`（导出逻辑，浏览器 ESM）
- Create: `tests/exporter.test.js`（单元测试，使用 jsdom mock localStorage + URL）
- Create: `src/learning.template.html`（学习版入口模板，导出时拼接）
- Modify: `诗云-生成器.html`（在 Step 4 接入 `exporter.exportLearningHtml` 并触发下载）

## 任务目标

把生成器累积的诗词数据 + 所有 AI 生成内容 + 学习版源码（HTML + CSS + JS + 拼音库）拼成一个**单 HTML 文件**，所有图片/音频以 base64 dataURL 内嵌，触发浏览器下载，文件名 `诗云-学习版.html`。

## 接口约定

`src/generator/exporter.js` 必须导出：

```javascript
// 把 POEMS_META + 各项 AI 生成内容合并为完整 Poem[]
export function collectPoemsData() { ... }
// 单文件 fetch 读取（在生成器环境使用 fetch，导出时嵌入）
export async function loadAssetText(url) { ... }
// 拼装单 HTML 字符串
export function buildLearningHtml({ poemsJson, learningTemplate, assets }) { ... }
// 触发浏览器下载（返回 blob URL）
export function downloadLearningHtml(html) { ... }
```

`assets` 形参：`{ mainCss: string, printCss: string, pinyinPro: string, dataJs: string, storageJs: string, srsJs: string, routerJs: string, audioJs: string, printJs: string, uiScripts: { home, learn, review, quiz, print, progress } }`。

## 嵌入策略

| 学习版文件 | 嵌入方式 |
|-----------|---------|
| `src/learning.html` | 字符串模板（`src/learning.template.html`），里面 `<!-- @@STYLES-->` 等占位符替换 |
| `src/css/main.css` | `<style>` 内嵌 |
| `src/css/print.css` | `<style media="print">` 内嵌 |
| `src/lib/pinyin-pro.min.js` | `<script>` 内嵌 |
| `src/js/*.js` | `<script>` 内嵌（多个） |
| `src/data/poems.json` | `<script>window.__SHIYUN_POEMS__ = ${poemsJson}</script>` |

这样学习版完全离线、无外部依赖、双击即用。

## Step 1: 写失败的测试

```javascript
// tests/exporter.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { collectPoemsData, buildLearningHtml, downloadLearningHtml } from '../src/generator/exporter.js';

describe('collectPoemsData', () => {
  beforeEach(() => localStorage.clear());

  it('应返回空数组若没有任何持久化数据', () => {
    expect(collectPoemsData()).toEqual([]);
  });

  it('应合并元数据与 text/image/audio 持久化记录', () => {
    // 假设 POEMS_META 已经加载（通过学习版的 import）
    // 这里直接往 localStorage 写完整三件套
    localStorage.setItem('shiyun_gen_text_g1-01', JSON.stringify({
      translation: '月光洒在床上', background: '李白思乡', annotations: {}, theme: '思乡',
      keywords: ['月'], keySentences: [{ line: 0, chars: ['床'], blanks: [0] }], pinyin: ['chuáng'],
    }));
    localStorage.setItem('shiyun_gen_image_g1-01', 'data:image/png;base64,IMG');
    localStorage.setItem('shiyun_gen_audio_g1-01', 'data:audio/mp3;base64,AUD');

    // 通过动态 import POEMS_META
    return import('../src/data/poems-meta.js').then(({ POEMS_META }) => {
      const poems = collectPoemsData(POEMS_META);
      const g1 = poems.find(p => p.id === 'g1-01');
      expect(g1).toBeDefined();
      expect(g1.translation).toBe('月光洒在床上');
      expect(g1.image).toBe('data:image/png;base64,IMG');
      expect(g1.audio).toBe('data:audio/mp3;base64,AUD');
      // 缺失的诗应只含元数据
      const g2 = poems.find(p => p.id === 'g1-02');
      expect(g2.translation).toBeUndefined();
      expect(g2.image).toBe('');
    });
  });
});

describe('buildLearningHtml', () => {
  const fakeTemplate = `<!DOCTYPE html><html lang="zh-CN"><head>
    <meta charset="UTF-8">
    <title>诗云 · 学习版</title>
    <!-- @@STYLES -->
    <!-- @@DATA -->
  </head><body>
    <div id="app"></div>
    <!-- @@SCRIPTS -->
  </body></html>`;

  const fakeAssets = {
    mainCss: 'body { background: #f5f7fa; }',
    printCss: '@media print { body { font-size: 12pt; } }',
    pinyinPro: '/* pinyin-pro stub */',
    dataJs: 'export const poems = new Map();',
    storageJs: 'export const storage = {};',
    srsJs: 'export function calcNext() {}',
    routerJs: 'export const router = {};',
    audioJs: 'export const audio = {};',
    printJs: 'export const print = {};',
    uiScripts: {
      home: '/* home */',
      learn: '/* learn */',
      review: '/* review */',
      quiz: '/* quiz */',
      print: '/* print ui */',
      progress: '/* progress */',
    },
  };

  it('应把所有 assets 嵌入到模板占位符处', () => {
    const poemsJson = JSON.stringify([{ id: 'g1-01', title: '静夜思' }]);
    const html = buildLearningHtml({ poemsJson, learningTemplate: fakeTemplate, assets: fakeAssets });

    // CSS 应嵌入 <style>
    expect(html).toContain('background: #f5f7fa');
    expect(html).toContain('font-size: 12pt');
    // 数据应嵌入
    expect(html).toContain('window.__SHIYUN_POEMS__');
    expect(html).toContain('静夜思');
    // JS 应嵌入
    expect(html).toContain('pinyin-pro stub');
    expect(html).toContain('export const storage');
    expect(html).toContain('home ui stub');
  });

  it('输出应为合法 HTML 字符串（非 null）', () => {
    const html = buildLearningHtml({ poemsJson: '[]', learningTemplate: fakeTemplate, assets: fakeAssets });
    expect(typeof html).toBe('string');
    expect(html).toMatch(/^<!DOCTYPE html>/i);
  });

  it('输出大小应在合理范围（< 200MB 警戒线）', () => {
    // 模拟 112 首诗，每首图音频按 ~200KB 算 → 总 22MB
    const poemsJson = JSON.stringify(
      Array.from({ length: 112 }, (_, i) => ({
        id: 'g' + (i % 6 + 1) + '-' + String(i).padStart(2, '0'),
        title: 'P' + i,
        author: 'A', dynasty: '唐', grade: (i % 6) + 1, type: '五言绝句',
        sequence: i + 1, content: ['床前明月光'], pinyin: ['chuáng'],
        image: 'data:image/png;base64,' + 'A'.repeat(100 * 1024), // ~100KB
        audio: 'data:audio/mp3;base64,' + 'B'.repeat(100 * 1024), // ~100KB
      }))
    );
    const html = buildLearningHtml({ poemsJson, learningTemplate: fakeTemplate, assets: fakeAssets });
    expect(html.length).toBeLessThan(200 * 1024 * 1024); // < 200MB
  });
});

describe('downloadLearningHtml', () => {
  beforeEach(() => {
    // jsdom 没有真实下载，但 URL.createObjectURL 存在
    if (!global.URL.createObjectURL) {
      global.URL.createObjectURL = vi.fn(() => 'blob:fake');
      global.URL.revokeObjectURL = vi.fn();
    }
    // mock <a>.click
    document.body.innerHTML = '';
  });

  it('应创建 Blob 并触发点击下载', () => {
    const clickSpy = vi.fn();
    const origCreate = document.createElement.bind(document);
    const createSpy = vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      const el = origCreate(tag);
      if (tag === 'a') el.click = clickSpy;
      return el;
    });

    downloadLearningHtml('<html>x</html>');

    expect(createSpy).toHaveBeenCalledWith('a');
    expect(clickSpy).toHaveBeenCalled();

    createSpy.mockRestore();
  });
});
```

## Step 2: 运行测试验证失败

```bash
cd C:/tjf/github/诗云
npm test -- tests/exporter.test.js
```

Expected: FAIL with "Cannot find module '../src/generator/exporter.js'"

## Step 3: 实现最小代码

### `src/generator/exporter.js`

```javascript
/**
 * 学习版导出器
 * - 读取 POEMS_META + localStorage 中的 text/image/audio
 * - 合并为完整 Poem 数组
 * - 拼接学习版 HTML 模板 + 内嵌所有 CSS/JS/数据
 * - 触发浏览器下载
 */

import { POEMS_META } from '../data/poems-meta.js';
import { loadPoemPiece } from './state.js';

/**
 * 把元数据 + 三类持久化内容合并
 * - 即使没生成完也导出（学习版允许缺图缺音）
 */
export function collectPoemsData(metaList = POEMS_META) {
  return metaList.map(meta => {
    const text = loadPoemPiece(meta.id, 'text');
    const image = loadPoemPiece(meta.id, 'image') || '';
    const audio = loadPoemPiece(meta.id, 'audio') || '';
    const pinyin = (text && Array.isArray(text.pinyin)) ? text.pinyin : [];
    const keySentences = (text && Array.isArray(text.keySentences)) ? text.keySentences : [];
    return {
      ...meta,
      translation: text?.translation || '',
      background: text?.background || '',
      annotations: text?.annotations || {},
      theme: text?.theme || '',
      keywords: text?.keywords || [],
      keySentences,
      pinyin,
      image,
      audio,
    };
  });
}

/**
 * 用 fetch 读取外部资产（在生成器 HTML 中通过相对路径访问）
 */
export async function loadAssetText(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error('读取 ' + url + ' 失败：' + res.status);
  return await res.text();
}

/**
 * 把所有资产塞进模板
 */
export function buildLearningHtml({ poemsJson, learningTemplate, assets }) {
  const styles = [
    '<style>',
    '/* === main.css === */',
    assets.mainCss,
    '</style>',
    '<style media="print">',
    '/* === print.css === */',
    assets.printCss,
    '</style>',
  ].join('\n');

  const dataScript = [
    '<script>',
    'window.__SHIYUN_POEMS__ = ' + poemsJson + ';',
    '</script>',
  ].join('\n');

  const scripts = [
    '<script>',
    '/* === pinyin-pro === */',
    assets.pinyinPro,
    '</script>',
    '<script type="module">',
    '/* === data.js (runtime, reads window.__SHIYUN_POEMS__) === */',
    assets.dataJs,
    '</script>',
    '<script type="module">',
    '/* === storage.js === */',
    assets.storageJs,
    '</script>',
    '<script type="module">',
    '/* === srs.js === */',
    assets.srsJs,
    '</script>',
    '<script type="module">',
    '/* === router.js === */',
    assets.routerJs,
    '</script>',
    '<script type="module">',
    '/* === audio.js === */',
    assets.audioJs,
    '</script>',
    '<script type="module">',
    '/* === print.js === */',
    assets.printJs,
    '</script>',
    '<script type="module">',
    '/* === UI scripts === */',
    assets.uiScripts.home,
    assets.uiScripts.learn,
    assets.uiScripts.review,
    assets.uiScripts.quiz,
    assets.uiScripts.print,
    assets.uiScripts.progress,
    '</script>',
  ].join('\n');

  return learningTemplate
    .replace('<!-- @@STYLES -->', styles)
    .replace('<!-- @@DATA -->', dataScript)
    .replace('<!-- @@SCRIPTS -->', scripts);
}

/**
 * 触发浏览器下载
 */
export function downloadLearningHtml(html, filename = '诗云-学习版.html') {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * 一站式：从生成器 HTML 调用此函数即可导出
 * - 自动读取所有源码与持久化数据
 */
export async function exportLearningHtml() {
  // 学习版源码文件路径（相对生成器 HTML）
  const baseUrl = 'src/';
  const [
    learningTemplate,
    mainCss,
    printCss,
    pinyinPro,
    dataJs,
    storageJs,
    srsJs,
    routerJs,
    audioJs,
    printJs,
    homeJs,
    learnJs,
    reviewJs,
    quizJs,
    printUiJs,
    progressJs,
  ] = await Promise.all([
    loadAssetText('src/learning.template.html'),
    loadAssetText(baseUrl + 'css/main.css'),
    loadAssetText(baseUrl + 'css/print.css'),
    loadAssetText(baseUrl + 'lib/pinyin-pro.min.js'),
    loadAssetText(baseUrl + 'js/data.js'),
    loadAssetText(baseUrl + 'js/storage.js'),
    loadAssetText(baseUrl + 'js/srs.js'),
    loadAssetText(baseUrl + 'js/router.js'),
    loadAssetText(baseUrl + 'js/audio.js'),
    loadAssetText(baseUrl + 'js/print.js'),
    loadAssetText(baseUrl + 'js/ui/home.js'),
    loadAssetText(baseUrl + 'js/ui/learn.js'),
    loadAssetText(baseUrl + 'js/ui/review.js'),
    loadAssetText(baseUrl + 'js/ui/quiz.js'),
    loadAssetText(baseUrl + 'js/ui/print.js'),
    loadAssetText(baseUrl + 'js/ui/progress.js'),
  ]);

  const poems = collectPoemsData();
  const poemsJson = JSON.stringify(poems);

  const html = buildLearningHtml({
    poemsJson,
    learningTemplate,
    assets: {
      mainCss, printCss, pinyinPro, dataJs, storageJs, srsJs, routerJs, audioJs, printJs,
      uiScripts: {
        home: homeJs, learn: learnJs, review: reviewJs,
        quiz: quizJs, print: printUiJs, progress: progressJs,
      },
    },
  });

  downloadLearningHtml(html);
  return html.length;
}
```

### `src/learning.template.html`

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>诗云 · 学习版</title>
  <!-- @@STYLES -->
  <!-- @@DATA -->
</head>
<body>
  <div id="app"></div>
  <noscript>本应用需要 JavaScript 支持</noscript>
  <!-- @@SCRIPTS -->
</body>
</html>
```

### `诗云-生成器.html`（修改）

在 `<head>` 中追加：
```html
<script type="module" src="src/generator/exporter.js"></script>
```

把 `initStep4` 中的 `btn-export` 点击替换为：
```javascript
$('btn-export').addEventListener('click', async () => {
  $('export-info').textContent = '正在打包学习版...';
  $('btn-export').disabled = true;
  try {
    const size = await exportLearningHtml();
    $('export-info').textContent = `已下载（${(size / 1024 / 1024).toFixed(1)} MB）。把文件放到桌面/孩子设备，双击即可使用。`;
  } catch (e) {
    $('export-info').textContent = '导出失败：' + e.message;
    console.error(e);
  } finally {
    $('btn-export').disabled = false;
  }
});
```

## Step 4: 运行测试验证通过

```bash
cd C:/tjf/github/诗云
npm test -- tests/exporter.test.js
```

Expected: PASS（5 个测试用例全部通过）

## Step 5: 提交

```bash
cd C:/tjf/github/诗云
git add src/generator/exporter.js src/learning.template.html tests/exporter.test.js 诗云-生成器.html
git commit -m "feat(generator): 学习版导出（拼接单 HTML + base64 嵌入）"
```

## 完成标志

```bash
cd C:/tjf/github/诗云
echo done > .tasks/done/09
```

## 关键说明

1. **fetch 相对路径**：生成器 HTML 与 src/ 在同一目录，所以 `loadAssetText('src/learning.template.html')` 直接可行。如生成器 HTML 被部署到子目录，baseUrl 需相应调整
2. **CORS 问题**：本地双击 HTML（`file://`）下，`fetch('src/...')` 会失败（CORS 限制）。两个解决方案：
   - **方案 A（推荐）**：让用户用 `python -m http.server` 起本地服务（README 说明）
   - **方案 B**：把所有源码以 `<script>` 内嵌到生成器 HTML 里，exporter 直接从 `<script>` 取内容
   本任务先用方案 A，更轻量
3. **生成器 HTML 仍可双击运行**：UI 本身不依赖 fetch（仅导出时需要）。UI 与导出解耦
4. **缺图缺音的容错**：`collectPoemsData` 即使某首没生成完也会导出（image/audio 为空字符串），学习版 UI 在显示时降级为占位
5. **大文件警告**：112 首诗全部含图+音约 22MB，已加 size 断言。导出后 UI 提示用户"放到桌面/孩子设备"
6. **学习版源码依赖**：本任务假设 `src/css/`、`src/lib/`、`src/js/` 等已经在 Task 10+ 中实现并存在。**实施本任务前需先确保这些路径下文件存在**（即使是占位文件也可以）
7. **文件名编码**：中文文件名 `诗云-学习版.html` 在现代浏览器都支持；老旧 Edge 可能乱码但不影响内容
8. **复用 Task 5 state.js**：直接 `import { loadPoemPiece }` 读持久化内容