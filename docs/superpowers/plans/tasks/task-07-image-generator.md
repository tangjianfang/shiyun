# Task 7: 生成器-配图生成

**依赖：** Task 5
**并行组：** generator-content
**估时：** 1 天

**Files:**
- Create: `src/generator/image-generator.js`（生成器逻辑，浏览器 ESM）
- Create: `tests/image-generator.test.js`（单元测试，mock OpenAIClient）
- Modify: `诗云-生成器.html`（在 Step 3 进度面板接入配图生成流程）

## 任务目标

实现为每首诗批量调用 DALL-E 3 生成 512×512 JPEG 配图（base64 dataURL），提示词模板贴合"传统水墨 + 诗词主题"，进度持久化到 localStorage（Task 5 的 state.js），单首可重生成，单首失败不影响其他。

## 接口约定

`src/generator/image-generator.js` 必须导出：

```javascript
export function createImageGenerator({ client, poems, onProgress, concurrency = 2 }) { ... }
// .start() / .cancel() / .regenerateOne(poemId) / .pendingPoemIds() / .stats()
```

接口形态与 Task 6 text-generator **完全一致**，便于 Task 8 直接复用同样的调用模式。

## 提示词模板

```
Traditional Chinese ink-wash painting (水墨画) illustrating the classical poem "{{title}}" by {{author}} ({{dynasty}}).
Theme: {{titleLine}}.
Visual motifs: {{keywordsJoined}}.
Style: minimalist sumi-e brushwork, soft ink gradients, rice paper texture, muted earth tones with occasional splashes of red/gold, no text, no borders, no watermark, square composition.
```

其中 `titleLine` = `poem.content[0] + ' / ' + poem.content[1]`（取前两句作为视觉锚点），`keywordsJoined` = `data.keywords.join(', ')`（若已有文本生成结果则使用，否则用诗的"主题"句）。

输出规格：1024×1024（让 DALL-E 3 出图，浏览器/CSS 自然压到 512×512 展示）。注意：Task 5 设计文档规格是 512×512，但 DALL-E 3 不支持该尺寸；我们用 1024×1024，调用时在 image-generator 内显式声明并配合 `quality: 'standard'` 控制成本。

## Step 1: 写失败的测试

```javascript
// tests/image-generator.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createImageGenerator } from '../src/generator/image-generator.js';

function makePoems() {
  return [
    { id: 'g1-01', title: '静夜思', author: '李白', dynasty: '唐', grade: 1,
      type: '五言绝句', sequence: 1, content: ['床前明月光', '疑是地上霜'] },
    { id: 'g1-02', title: '咏鹅', author: '骆宾王', dynasty: '唐', grade: 1,
      type: '七言绝句', sequence: 2, content: ['鹅鹅鹅', '曲项向天歌'] },
  ];
}

function makeMockClient() {
  // 模拟 OpenAIClient.generateImage 返回 png base64
  return {
    generateImage: vi.fn(async ({ prompt }) => {
      // 用 prompt 决定返回的 dataURL（便于断言）
      return 'data:image/png;base64,fake_' + prompt.slice(0, 10);
    }),
  };
}

describe('createImageGenerator', () => {
  beforeEach(() => localStorage.clear());

  it('pendingPoemIds 应返回尚未生成 image 的诗 ID', () => {
    const gen = createImageGenerator({
      client: makeMockClient(),
      poems: makePoems(),
      onProgress: () => {},
    });
    expect(gen.pendingPoemIds()).toEqual(['g1-01', 'g1-02']);
  });

  it('start() 应为每首诗调用 generateImage 并保存到 localStorage', async () => {
    const client = makeMockClient();
    const gen = createImageGenerator({ client, poems: makePoems(), onProgress: () => {}, concurrency: 2 });
    await gen.start();
    expect(client.generateImage).toHaveBeenCalledTimes(2);
    expect(localStorage.getItem('shiyun_gen_image_g1-01')).toMatch(/^data:image\/png;base64,/);
    expect(localStorage.getItem('shiyun_gen_image_g1-02')).toMatch(/^data:image\/png;base64,/);
  });

  it('已生成的应被跳过', async () => {
    localStorage.setItem('shiyun_gen_image_g1-01', 'data:image/png;base64,old');
    const client = makeMockClient();
    const gen = createImageGenerator({ client, poems: makePoems(), onProgress: () => {}, concurrency: 1 });
    await gen.start();
    expect(client.generateImage).toHaveBeenCalledTimes(1);
  });

  it('提示词应包含水墨画风格与诗主题', async () => {
    const client = makeMockClient();
    const gen = createImageGenerator({ client, poems: makePoems(), onProgress: () => {}, concurrency: 1 });
    await gen.start();
    const firstCall = client.generateImage.mock.calls[0][0];
    expect(firstCall.prompt).toContain('静夜思');
    expect(firstCall.prompt).toMatch(/ink-wash|水墨|sumi-e/i);
    expect(firstCall.size).toBe('1024x1024');
  });

  it('单首失败不应阻塞其他', async () => {
    const client = {
      generateImage: vi.fn(async ({ prompt }) => {
        if (prompt.includes('咏鹅')) throw new Error('DALL-E 服务异常');
        return 'data:image/png;base64,ok';
      }),
    };
    const events = [];
    const gen = createImageGenerator({
      client, poems: makePoems(),
      onProgress: (e) => events.push(e),
      concurrency: 1,
    });
    await gen.start();
    const fail = events.filter(e => e.status === 'fail');
    const success = events.filter(e => e.status === 'success');
    expect(fail.length).toBe(1);
    expect(success.length).toBe(1);
    expect(gen.stats().failed).toBe(1);
  });

  it('regenerateOne 应清掉旧记录后重新生成', async () => {
    localStorage.setItem('shiyun_gen_image_g1-01', 'data:image/png;base64,old');
    const client = makeMockClient();
    const gen = createImageGenerator({ client, poems: makePoems(), onProgress: () => {}, concurrency: 1 });
    await gen.regenerateOne('g1-01');
    expect(localStorage.getItem('shiyun_gen_image_g1-01')).not.toBe('data:image/png;base64,old');
    expect(client.generateImage).toHaveBeenCalledTimes(1);
  });

  it('cancel() 后未完成的应不再执行', async () => {
    const client = {
      generateImage: vi.fn(async () => {
        await new Promise(r => setTimeout(r, 50));
        return 'data:image/png;base64,ok';
      }),
    };
    const gen = createImageGenerator({ client, poems: makePoems(), onProgress: () => {}, concurrency: 1 });
    const p = gen.start();
    gen.cancel();
    await p;
    expect(client.generateImage.mock.calls.length).toBeLessThanOrEqual(1);
  });
});
```

## Step 2: 运行测试验证失败

```bash
cd C:/tjf/github/诗云
npm test -- tests/image-generator.test.js
```

Expected: FAIL with "Cannot find module '../src/generator/image-generator.js'"

## Step 3: 实现最小代码

### `src/generator/image-generator.js`

```javascript
/**
 * 配图生成器：批量为每首诗调 DALL-E 3 生成水墨风格配图
 * - 1024x1024 PNG（设计文档规格 512x512，但 DALL-E 3 不支持 512）
 * - 并发控制（默认 2，DALL-E 3 限速较严）
 * - localStorage 持久化
 * - 单首失败不阻塞
 */

import { savePoemPiece, loadPoemPiece } from './state.js';

const TYPE = 'image';
const IMAGE_SIZE = '1024x1024';

function buildPrompt(poem) {
  // 取前两句作为视觉锚点
  const firstTwo = (poem.content || []).slice(0, 2).join(' / ');
  // 关键词优先从 text 持久化中取，否则留空
  const textData = loadPoemPiece(poem.id, 'text');
  const keywords = textData && Array.isArray(textData.keywords) ? textData.keywords : [];
  const keywordStr = keywords.length > 0 ? keywords.join(', ') : (poem.theme || '');

  return [
    'Traditional Chinese ink-wash painting (水墨画) illustrating the classical poem "'
      + poem.title + '" by ' + poem.author + ' (' + poem.dynasty + ').',
    'Theme: ' + (firstTwo || poem.title) + '.',
    'Visual motifs: ' + (keywordStr || 'classical Chinese landscape') + '.',
    'Style: minimalist sumi-e brushwork, soft ink gradients, rice paper texture,',
    'muted earth tones with occasional splashes of red/gold, no text, no borders,',
    'no watermark, square composition.',
  ].join(' ');
}

export function createImageGenerator({ client, poems, onProgress = () => {}, concurrency = 2 }) {
  const poemList = Array.isArray(poems) ? poems : Array.from(poems.values());
  let cancelled = false;
  const stats = { done: 0, total: poemList.length, failed: 0, skipped: 0 };

  function emit(event) {
    try { onProgress(event); } catch {}
  }

  function pendingPoemIds() {
    return poemList.filter(p => loadPoemPiece(p.id, TYPE) === null).map(p => p.id);
  }

  function stats_() {
    return { ...stats };
  }

  async function processOne(poem) {
    if (cancelled) return;
    emit({ poemId: poem.id, status: 'start', current: stats.done + stats.failed + stats.skipped + 1, total: stats.total });
    try {
      const dataUrl = await client.generateImage({
        prompt: buildPrompt(poem),
        size: IMAGE_SIZE,
        quality: 'standard',
      });
      // 断言返回值是合法 dataURL
      if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) {
        throw new Error('generateImage 返回非 dataURL');
      }
      savePoemPiece(poem.id, TYPE, dataUrl);
      stats.done++;
      emit({ poemId: poem.id, status: 'success', current: stats.done + stats.failed + stats.skipped, total: stats.total });
    } catch (e) {
      stats.failed++;
      emit({ poemId: poem.id, status: 'fail', error: e.message, current: stats.done + stats.failed + stats.skipped, total: stats.total });
    }
  }

  async function worker(queue) {
    while (queue.length > 0) {
      if (cancelled) return;
      const poem = queue.shift();
      await processOne(poem);
    }
  }

  async function start() {
    cancelled = false;
    const queue = poemList.filter(p => loadPoemPiece(p.id, TYPE) === null);
    stats.skipped = stats.total - queue.length;
    if (queue.length === 0) {
      emit({ poemId: null, status: 'done' });
      return;
    }
    const workers = [];
    const n = Math.min(concurrency, queue.length);
    for (let i = 0; i < n; i++) {
      workers.push(worker(queue));
    }
    await Promise.all(workers);
    emit({ poemId: null, status: 'done' });
  }

  function cancel() {
    cancelled = true;
  }

  async function regenerateOne(poemId) {
    const poem = poemList.find(p => p.id === poemId);
    if (!poem) throw new Error('未找到诗：' + poemId);
    localStorage.removeItem('shiyun_gen_image_' + poemId);
    await processOne(poem);
  }

  return { start, cancel, regenerateOne, pendingPoemIds, stats: stats_ };
}
```

### `诗云-生成器.html`（修改）

在 `<head>` 中追加：
```html
<script type="module" src="src/generator/image-generator.js"></script>
```

在 `startTextGeneration`（Task 6 接入）完成后，接续调用配图生成：
```javascript
async function startImageGeneration(poems) {
  const gen = createImageGenerator({
    client: state.openaiClient,
    poems: poems,
    concurrency: 2,
    onProgress: (e) => {
      if (e.status === 'success') $('stat-image').textContent = parseInt($('stat-image').textContent, 10) + 1;
      const total = e.total || poems.length;
      const done = parseInt($('stat-image').textContent, 10);
      const pct = Math.round(done / total * 100);
      $('progress-bar').style.width = pct + '%';
      $('progress-text').textContent = pct + '%';
      $('progress-detail').textContent = `配图生成 ${done} / ${total}`;
      if (e.status === 'done') $('progress-detail').textContent = '配图生成完成。Task 8 接入音频。';
    },
  });
  await gen.start();
  state.imageGen = gen;
}
```

> **注意**：DALL-E 3 单张图成本约 $0.04（1024×1024 standard），112 首诗约 $4.5。生产环境可考虑：
> - 仅在用户勾选时才生成（默认关闭）
> - 失败时 fallback 到无图模式（学习版可正常用）
> 这一点在 README 与导出前给用户提示。

## Step 4: 运行测试验证通过

```bash
cd C:/tjf/github/诗云
npm test -- tests/image-generator.test.js
```

Expected: PASS（7 个测试用例全部通过）

## Step 5: 提交

```bash
cd C:/tjf/github/诗云
git add src/generator/image-generator.js tests/image-generator.test.js 诗云-生成器.html
git commit -m "feat(generator): 配图生成（DALL-E 3 水墨风格 + 持久化）"
```

## 完成标志

```bash
cd C:/tjf/github/诗云
echo done > .tasks/done/07
```

## 关键说明

1. **完全复用 Task 6 的模式**：与 text-generator 接口签名一致（`createXxxGenerator({client, poems, onProgress, concurrency}).start/cancel/regenerateOne/pendingPoemIds/stats`），便于 UI 通用化
2. **并发 = 2**（低于 text 的 3）：DALL-E 3 限速更严，避免 429
3. **size = 1024×1024**：DALL-E 3 不支持 512。设计文档说的"512×512"指最终展示尺寸（在 CSS / data.js 中按比例缩小），生成端用 1024
4. **关键词复用 text 持久化**：`loadPoemPiece(p.id, 'text')` 取 keywords 让配图更贴主题。如果该首尚未生成文本，会用诗的前两句做兜底
5. **失败降级**：单首 fail 不会阻塞其他；学习版导出时（Task 9）若无图则用占位图（CSS 灰底 + 标题）
6. **成本提示**：在生成器 HTML 中可加 `<p>约需 $4-5 OpenAI 费用</p>` 提示
7. **HTML 端 ES module**：所有生成器文件都是 `export`，HTML 端用 `<script type="module">` 引入
