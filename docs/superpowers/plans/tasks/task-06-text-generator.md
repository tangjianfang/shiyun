# Task 6: 生成器-文本生成

**依赖：** Task 5
**并行组：** generator-content
**估时：** 1.5 天

**Files:**
- Create: `src/generator/text-generator.js`（生成器逻辑，浏览器 ESM）
- Create: `tests/text-generator.test.js`（单元测试，mock OpenAIClient）
- Modify: `诗云-生成器.html`（在 Step 2 → Step 3 切换时接入 text-generator；Step 3 添加"重新生成"按钮 UI）

## 任务目标

实现为每首诗批量调用 OpenAI GPT-4o-mini 生成扩展文本（translation / background / annotations / theme / keywords / keySentences / pinyin），进度持久化到 localStorage（Task 5 的 state.js），单首可重生成，单首失败不影响其他。

## 接口约定

`src/generator/text-generator.js` 必须导出：

```javascript
// 构造生成器（不立即开始）
export function createTextGenerator({ client, poems, onProgress, concurrency = 3 }) { ... }
// 返回对象方法：
//   .start()                          // 启动生成
//   .cancel()                         // 取消
//   .regenerateOne(poemId)            // 重新生成单首
//   .pendingPoemIds()                 // 返回尚未生成 text 的诗 ID 列表
//   .stats()                          // { done, total, failed, skipped }
```

事件回调 `onProgress({ poemId, status, error?, current, total })`：
- `status: 'start' | 'success' | 'fail' | 'skip' | 'done'`

并发模型：每批 `concurrency` 首诗并行，单首失败后标记 fail 但不影响其他。

## 提示词模板

系统提示（固定）：

```
你是一位经验丰富的中国小学语文老师，正在为 1-6 年级小学生编写古诗词教学材料。
请以 JSON 格式返回结果，字段严格符合要求，不要有 markdown 代码块包裹。
```

用户提示（变量替换）：

```
请为以下古诗生成适合小学生的教学材料：

标题：{{title}}
作者：{{author}}（{{dynasty}}）
年级：{{grade}} 年级
原文：
{{contentLines}}

请返回以下 JSON 结构（不要任何额外文字）：
{
  "translation": "白话翻译（80-120 字，孩子能理解）",
  "background": "创作背景（100-150 字）",
  "annotations": {
    "难字1": "字面义+引申义",
    "难字2": "..."
  },
  "theme": "主题思想（80-120 字）",
  "keywords": ["关键词1", "关键词2", "关键词3"],
  "keySentences": [
    { "line": 0, "chars": ["句中所有字"], "blanks": [挖空索引] }
  ],
  "pinyin": ["每行对应拼音，音节间用空格"]
}
要求：
- annotations 选 3-5 个最难懂的字词
- keySentences 选 2-3 句最有代表性的，每句挖空 1-2 个字
- pinyin 数组长度与原文行数一致
- 保持 JSON 严格可解析
```

## Step 1: 写失败的测试

```javascript
// tests/text-generator.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createTextGenerator } from '../src/generator/text-generator.js';

function makePoems() {
  return [
    { id: 'g1-01', title: '静夜思', author: '李白', dynasty: '唐', grade: 1,
      type: '五言绝句', sequence: 1, content: ['床前明月光', '疑是地上霜'] },
    { id: 'g1-02', title: '咏鹅', author: '骆宾王', dynasty: '唐', grade: 1,
      type: '七言绝句', sequence: 2, content: ['鹅鹅鹅', '曲项向天歌'] },
    { id: 'g1-03', title: '春晓', author: '孟浩然', dynasty: '唐', grade: 1,
      type: '五言绝句', sequence: 3, content: ['春眠不觉晓', '处处闻啼鸟'] },
  ];
}

function fakeAiResponse(content) {
  return {
    translation: '译文',
    background: '背景',
    annotations: { '床': '床铺' },
    theme: '主题',
    keywords: ['月', '思乡'],
    keySentences: [{ line: 0, chars: ['床', '前'], blanks: [1] }],
    pinyin: ['chuáng qián', 'yí shì'],
  };
}

function makeMockClient() {
  return {
    generateText: vi.fn(async ({ userPrompt }) => {
      // 简单解析 title 来做可控响应
      const m = userPrompt.match(/标题：([^\n]+)/);
      return fakeAiResponse(m ? m[1].trim() : '');
    }),
  };
}

describe('createTextGenerator', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('应正确识别尚未生成的诗（pendingPoemIds）', () => {
    const gen = createTextGenerator({
      client: makeMockClient(),
      poems: makePoems(),
      onProgress: () => {},
    });
    expect(gen.pendingPoemIds()).toEqual(['g1-01', 'g1-02', 'g1-03']);
  });

  it('start() 应对每首诗调用 generateText 并保存到 localStorage', async () => {
    const client = makeMockClient();
    const gen = createTextGenerator({ client, poems: makePoems(), onProgress: () => {}, concurrency: 2 });
    await gen.start();
    expect(client.generateText).toHaveBeenCalledTimes(3);
    // 验证 localStorage 中有三条记录
    expect(localStorage.getItem('shiyun_gen_text_g1-01')).toBeTruthy();
    expect(localStorage.getItem('shiyun_gen_text_g1-02')).toBeTruthy();
    expect(localStorage.getItem('shiyun_gen_text_g1-03')).toBeTruthy();
  });

  it('已完成的不应重复生成', async () => {
    localStorage.setItem('shiyun_gen_text_g1-01', JSON.stringify({ translation: 'old' }));
    const client = makeMockClient();
    const gen = createTextGenerator({ client, poems: makePoems(), onProgress: () => {}, concurrency: 1 });
    await gen.start();
    expect(client.generateText).toHaveBeenCalledTimes(2); // 只剩 2 首
    // 旧的应被覆盖
    const stored = JSON.parse(localStorage.getItem('shiyun_gen_text_g1-01'));
    expect(stored.translation).not.toBe('old');
  });

  it('单首失败不应阻塞其他', async () => {
    const client = {
      generateText: vi.fn(async ({ userPrompt }) => {
        const m = userPrompt.match(/标题：([^\n]+)/);
        if (m && m[1].trim() === '咏鹅') throw new Error('AI 服务异常');
        return fakeAiResponse();
      }),
    };
    const progress = [];
    const gen = createTextGenerator({
      client, poems: makePoems(),
      onProgress: (e) => progress.push(e),
      concurrency: 1,
    });
    await gen.start();
    // 仍然全部尝试，失败的标记
    const fail = progress.filter(p => p.status === 'fail');
    const success = progress.filter(p => p.status === 'success');
    expect(fail.length).toBe(1);
    expect(success.length).toBe(2);
    expect(gen.stats().failed).toBe(1);
  });

  it('regenerateOne 应仅重生成一首', async () => {
    const client = makeMockClient();
    const gen = createTextGenerator({ client, poems: makePoems(), onProgress: () => {}, concurrency: 1 });
    await gen.start();
    const calls = client.generateText.mock.calls.length;
    await gen.regenerateOne('g1-02');
    expect(client.generateText.mock.calls.length).toBe(calls + 1);
  });

  it('cancel() 后未完成的应不再执行', async () => {
    const client = {
      generateText: vi.fn(async () => {
        await new Promise(r => setTimeout(r, 50));
        return fakeAiResponse();
      }),
    };
    const gen = createTextGenerator({ client, poems: makePoems(), onProgress: () => {}, concurrency: 1 });
    const p = gen.start();
    gen.cancel();
    await p;
    // 因为取消，不应全部完成
    expect(client.generateText.mock.calls.length).toBeLessThanOrEqual(2);
  });

  it('onProgress 应收到 start/success/fail 等事件', async () => {
    const events = [];
    const gen = createTextGenerator({
      client: makeMockClient(),
      poems: makePoems(),
      onProgress: (e) => events.push(e),
      concurrency: 1,
    });
    await gen.start();
    const types = new Set(events.map(e => e.status));
    expect(types.has('start')).toBe(true);
    expect(types.has('success')).toBe(true);
    expect(types.has('done')).toBe(true);
  });
});
```

## Step 2: 运行测试验证失败

```bash
cd C:/tjf/github/诗云
npm test -- tests/text-generator.test.js
```

Expected: FAIL with "Cannot find module '../src/generator/text-generator.js'"

## Step 3: 实现最小代码

### `src/generator/text-generator.js`

```javascript
/**
 * 文本生成器：批量为每首诗调 OpenAI 生成扩展内容
 * - 并发控制
 * - localStorage 持久化（依赖 Task 5 state.js 的键命名）
 * - 单首失败不阻塞
 * - 取消与单首重生成
 */

import { savePoemPiece, loadPoemPiece } from './state.js';

const TYPE = 'text';
const storageKey = (poemId) => 'shiyun_gen_text_' + poemId;

const SYSTEM_PROMPT = '你是一位经验丰富的中国小学语文老师，正在为 1-6 年级小学生编写古诗词教学材料。请以 JSON 格式返回结果，字段严格符合要求，不要有 markdown 代码块包裹。';

function buildUserPrompt(poem) {
  const content = poem.content.join('\n');
  return [
    '请为以下古诗生成适合小学生的教学材料：',
    '',
    '标题：' + poem.title,
    '作者：' + poem.author + '（' + poem.dynasty + '）',
    '年级：' + poem.grade + ' 年级',
    '原文：',
    content,
    '',
    '请返回以下 JSON 结构（不要任何额外文字）：',
    '{',
    '  "translation": "白话翻译（80-120 字，孩子能理解）",',
    '  "background": "创作背景（100-150 字）",',
    '  "annotations": { "难字1": "字面义+引申义", "难字2": "..." },',
    '  "theme": "主题思想（80-120 字）",',
    '  "keywords": ["关键词1", "关键词2", "关键词3"],',
    '  "keySentences": [{ "line": 0, "chars": ["句中所有字"], "blanks": [挖空索引] }],',
    '  "pinyin": ["每行对应拼音，音节间用空格"]',
    '}',
    '要求：',
    '- annotations 选 3-5 个最难懂的字词',
    '- keySentences 选 2-3 句最有代表性的，每句挖空 1-2 个字',
    '- pinyin 数组长度与原文行数一致',
    '- 保持 JSON 严格可解析',
  ].join('\n');
}

/**
 * 校验并规范化 AI 返回的 JSON
 * - 必填字段缺失则抛错
 * - 数组长度不对则抛错
 */
function validateAndNormalize(data, poem) {
  if (!data || typeof data !== 'object') throw new Error('AI 返回不是对象');
  const required = ['translation', 'background', 'annotations', 'theme', 'keywords', 'keySentences', 'pinyin'];
  for (const k of required) {
    if (!(k in data)) throw new Error('缺少字段：' + k);
  }
  if (typeof data.translation !== 'string') throw new Error('translation 必须为字符串');
  if (typeof data.background !== 'string') throw new Error('background 必须为字符串');
  if (typeof data.annotations !== 'object' || Array.isArray(data.annotations)) {
    throw new Error('annotations 必须为对象');
  }
  if (typeof data.theme !== 'string') throw new Error('theme 必须为字符串');
  if (!Array.isArray(data.keywords) || data.keywords.length === 0) {
    throw new Error('keywords 必须为非空数组');
  }
  if (!Array.isArray(data.keySentences)) throw new Error('keySentences 必须为数组');
  if (!Array.isArray(data.pinyin)) throw new Error('pinyin 必须为数组');
  if (data.pinyin.length !== poem.content.length) {
    throw new Error('pinyin 长度(' + data.pinyin.length + ') 与原文行数(' + poem.content.length + ')不一致');
  }
  return data;
}

export function createTextGenerator({ client, poems, onProgress = () => {}, concurrency = 3 }) {
  const poemList = Array.isArray(poems) ? poems : Array.from(poems.values());
  let cancelled = false;
  const stats = { done: 0, total: poemList.length, failed: 0, skipped: 0 };

  function emit(event) {
    try { onProgress(event); } catch {}
  }

  function pendingPoemIds() {
    return poemList.filter(p => loadPoemPiece(p.id, TYPE) === null).map(p => p.id);
  }

  function isDone() {
    return stats.done + stats.failed + stats.skipped >= stats.total;
  }

  function stats_() {
    return { ...stats };
  }

  async function processOne(poem) {
    if (cancelled) return;
    emit({ poemId: poem.id, status: 'start', current: stats.done + stats.failed + stats.skipped + 1, total: stats.total });
    try {
      // 总是调 AI（regenerateOne 会清掉 localStorage 后再调）
      const raw = await client.generateText({
        systemPrompt: SYSTEM_PROMPT,
        userPrompt: buildUserPrompt(poem),
        jsonMode: true,
        temperature: 0.7,
      });
      const data = validateAndNormalize(raw, poem);
      savePoemPiece(poem.id, TYPE, data);
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
    // 清掉旧记录
    localStorage.removeItem(storageKey(poemId));
    await processOne(poem);
  }

  return { start, cancel, regenerateOne, pendingPoemIds, stats: stats_ };
}
```

### `诗云-生成器.html`（修改）

在 `<head>` 中追加：
```html
<script src="src/generator/text-generator.js"></script>
```

在 `initStep2()` 的 `btn-go-generate` 点击处理中，将 `goToStep(3)` 改为：
```javascript
$('btn-go-generate').addEventListener('click', () => {
  if (state.selectedGrades.length === 0) {
    alert('请至少选择一个年级');
    return;
  }
  const selected = poemList.filter(p => state.selectedGrades.includes(p.grade));
  startTextGeneration(selected);
});

async function startTextGeneration(poems) {
  goToStep(3);
  state.generateCancelled = false;
  // 假设诗列表已通过 <script src="src/data/poems-meta.js"> 加载为 POEMS_META
  const gen = createTextGenerator({
    client: state.openaiClient,
    poems: poems,
    concurrency: 3,
    onProgress: (e) => {
      if (e.status === 'success') $('stat-text').textContent = parseInt($('stat-text').textContent, 10) + 1;
      const total = e.total || poems.length;
      const done = parseInt($('stat-text').textContent, 10);
      const pct = Math.round(done / total * 100);
      $('progress-bar').style.width = pct + '%';
      $('progress-text').textContent = pct + '%';
      $('progress-detail').textContent = `文本生成 ${done} / ${total}`;
      if (e.status === 'done') $('progress-detail').textContent = '文本生成完成。Task 7/8 接入配图与音频。';
    },
  });
  // 取消按钮（覆盖 Task 5 的占位）
  $('btn-cancel-generate').onclick = () => { gen.cancel(); };
  await gen.start();
  // 保存生成器实例供后续重生成
  state.textGen = gen;
}
```

并在 `initStep4()` 上方添加"重新生成单首"的简单 UI（可选，Task 7 也可接入）。

## Step 4: 运行测试验证通过

```bash
cd C:/tjf/github/诗云
npm test -- tests/text-generator.test.js
```

Expected: PASS（7 个测试用例全部通过）

## Step 5: 提交

```bash
cd C:/tjf/github/诗云
git add src/generator/text-generator.js tests/text-generator.test.js 诗云-生成器.html
git commit -m "feat(generator): 文本生成（GPT-4o-mini + 持久化 + 断点续传）"
```

## 完成标志

```bash
cd C:/tjf/github/诗云
echo done > .tasks/done/06
```

## 关键说明

1. **依赖 Task 5 state.js**：直接 `import { savePoemPiece, loadPoemPiece }` — ESM 与 vitest 兼容
2. **HTML 端使用**：因为 state.js 和 text-generator.js 都用了 `export`，HTML 需用 `<script type="module">` 而非普通 `<script src=>`。建议改写：
   ```html
   <script type="module" src="src/generator/state.js"></script>
   <script type="module" src="src/generator/text-generator.js"></script>
   <script type="module">
     import { createTextGenerator } from './src/generator/text-generator.js';
     // ...
   </script>
   ```
3. **断点续传**：`start()` 跳过 `loadPoemPiece(p.id, 'text') !== null` 的诗 → 重新打开即可继续
4. **AI 返回的 pinyin 必校验长度**：与原文 `poem.content` 数组长度必须一致，否则学习版朗读/拼音会错位
5. **错误信息**：`error: e.message` 通过 onProgress 抛给 UI 层
6. **Task 7/8 复用**：`createTextGenerator` 模式可参考（用同样接口的 `createImageGenerator` / `createAudioGenerator`）
7. **不依赖 esbuild/webpack**：单 HTML 配合 ES module 可在所有现代浏览器直接运行（Chrome 89+ / Firefox 89+ / Edge 89+）
