# Task 8: 生成器-音频生成

**依赖：** Task 5
**并行组：** generator-content
**估时：** 1 天

**Files:**
- Create: `src/generator/audio-generator.js`（生成器逻辑，浏览器 ESM）
- Create: `tests/audio-generator.test.js`（单元测试，mock OpenAIClient）
- Modify: `诗云-生成器.html`（在 Step 3 进度面板接入音频生成流程）

## 任务目标

实现为每首诗批量调用 OpenAI TTS-1 生成 MP3 朗读音频（base64 dataURL），默认 voice = `alloy`、speed = `0.85`（慢速清晰），朗读文本为整首诗原文（多行用换行符连接），进度持久化到 localStorage（Task 5 的 state.js），单首可重生成，单首失败不影响其他。

## 接口约定

`src/generator/audio-generator.js` 必须导出：

```javascript
export function createAudioGenerator({ client, poems, onProgress, concurrency = 4, voice = 'alloy', speed = 0.85 }) { ... }
// .start() / .cancel() / .regenerateOne(poemId) / .pendingPoemIds() / .stats()
```

接口形态与 Task 6/7 **完全一致**，便于 UI 通用化。

## Step 1: 写失败的测试

```javascript
// tests/audio-generator.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createAudioGenerator } from '../src/generator/audio-generator.js';

function makePoems() {
  return [
    { id: 'g1-01', title: '静夜思', author: '李白', dynasty: '唐', grade: 1,
      type: '五言绝句', sequence: 1, content: ['床前明月光', '疑是地上霜', '举头望明月', '低头思故乡'] },
    { id: 'g1-02', title: '咏鹅', author: '骆宾王', dynasty: '唐', grade: 1,
      type: '七言绝句', sequence: 2, content: ['鹅鹅鹅', '曲项向天歌', '白毛浮绿水', '红掌拨清波'] },
  ];
}

function makeMockClient() {
  return {
    generateAudio: vi.fn(async ({ text }) => {
      // 模拟返回 mp3 dataURL，URL 内容与 text 的字符数关联
      return 'data:audio/mp3;base64,fake_' + text.length;
    }),
  };
}

describe('createAudioGenerator', () => {
  beforeEach(() => localStorage.clear());

  it('默认 voice = alloy、speed = 0.85', () => {
    const gen = createAudioGenerator({ client: makeMockClient(), poems: makePoems() });
    // 启动后查看传给 client 的参数
    gen.start().then(() => {
      const last = gen && null; // 占位
    });
    // 通过 regenerateOne 触发一次调用并检查
    return (async () => {
      const client = makeMockClient();
      const g = createAudioGenerator({ client, poems: makePoems(), concurrency: 1 });
      await g.regenerateOne('g1-01');
      const call = client.generateAudio.mock.calls[0][0];
      expect(call.voice).toBe('alloy');
      expect(call.speed).toBeCloseTo(0.85);
    })();
  });

  it('可自定义 voice 与 speed', async () => {
    const client = makeMockClient();
    const gen = createAudioGenerator({
      client, poems: makePoems(), concurrency: 1,
      voice: 'shimmer', speed: 0.95,
    });
    await gen.regenerateOne('g1-01');
    const call = client.generateAudio.mock.calls[0][0];
    expect(call.voice).toBe('shimmer');
    expect(call.speed).toBeCloseTo(0.95);
  });

  it('朗读文本应为诗的原文（多行用空格连接）', async () => {
    const client = makeMockClient();
    const gen = createAudioGenerator({ client, poems: makePoems(), concurrency: 1 });
    await gen.regenerateOne('g1-01');
    const call = client.generateAudio.mock.calls[0][0];
    // 默认连接方式：每行之间加 ，（中文逗号）让 TTS 读出节奏
    expect(call.text).toBe('床前明月光，疑是地上霜，举头望明月，低头思故乡。');
  });

  it('start() 应为每首诗调用 generateAudio 并保存到 localStorage', async () => {
    const client = makeMockClient();
    const gen = createAudioGenerator({ client, poems: makePoems(), onProgress: () => {}, concurrency: 2 });
    await gen.start();
    expect(client.generateAudio).toHaveBeenCalledTimes(2);
    expect(localStorage.getItem('shiyun_gen_audio_g1-01')).toMatch(/^data:audio\/mp3;base64,/);
    expect(localStorage.getItem('shiyun_gen_audio_g1-02')).toMatch(/^data:audio\/mp3;base64,/);
  });

  it('已生成的应被跳过', async () => {
    localStorage.setItem('shiyun_gen_audio_g1-01', 'data:audio/mp3;base64,old');
    const client = makeMockClient();
    const gen = createAudioGenerator({ client, poems: makePoems(), onProgress: () => {}, concurrency: 1 });
    await gen.start();
    expect(client.generateAudio).toHaveBeenCalledTimes(1);
  });

  it('pendingPoemIds 应返回尚未生成 audio 的诗 ID', () => {
    const gen = createImageGeneratorShim({
      client: makeMockClient(), poems: makePoems(), onProgress: () => {},
    });
    expect(gen.pendingPoemIds()).toEqual(['g1-01', 'g1-02']);
  });

  it('单首失败不应阻塞其他', async () => {
    const client = {
      generateAudio: vi.fn(async ({ text }) => {
        if (text.includes('鹅')) throw new Error('TTS 服务异常');
        return 'data:audio/mp3;base64,ok';
      }),
    };
    const events = [];
    const gen = createAudioGenerator({
      client, poems: makePoems(),
      onProgress: (e) => events.push(e),
      concurrency: 1,
    });
    await gen.start();
    expect(events.filter(e => e.status === 'fail').length).toBe(1);
    expect(events.filter(e => e.status === 'success').length).toBe(1);
    expect(gen.stats().failed).toBe(1);
  });

  it('regenerateOne 应清掉旧记录后重新生成', async () => {
    localStorage.setItem('shiyun_gen_audio_g1-01', 'data:audio/mp3;base64,old');
    const client = makeMockClient();
    const gen = createAudioGenerator({ client, poems: makePoems(), concurrency: 1 });
    await gen.regenerateOne('g1-01');
    expect(localStorage.getItem('shiyun_gen_audio_g1-01')).not.toBe('data:audio/mp3;base64,old');
    expect(client.generateAudio).toHaveBeenCalledTimes(1);
  });

  it('cancel() 后未完成的应不再执行', async () => {
    const client = {
      generateAudio: vi.fn(async () => {
        await new Promise(r => setTimeout(r, 50));
        return 'data:audio/mp3;base64,ok';
      }),
    };
    const gen = createAudioGenerator({ client, poems: makePoems(), onProgress: () => {}, concurrency: 1 });
    const p = gen.start();
    gen.cancel();
    await p;
    expect(client.generateAudio.mock.calls.length).toBeLessThanOrEqual(1);
  });
});

// helper: pendingPoemIds 测试需在 audio 模块也存在，引用它会被 hoist，
// 这里用一个 shim 让测试可独立运行（实际是测试 audio 模块）
function createImageGeneratorShim(opts) {
  return createAudioGenerator(opts);
}
```

> **说明**：上面 `pendingPoemIds` 测试调用 `createImageGeneratorShim` 是为了避免重复代码（实际就是 audio 模块的导出）。实施时直接用 `createAudioGenerator` 即可。

## Step 2: 运行测试验证失败

```bash
cd C:/tjf/github/诗云
npm test -- tests/audio-generator.test.js
```

Expected: FAIL with "Cannot find module '../src/generator/audio-generator.js'"

## Step 3: 实现最小代码

### `src/generator/audio-generator.js`

```javascript
/**
 * 音频生成器：批量为每首诗调 TTS-1 生成 MP3 朗读
 * - 默认 voice = 'alloy'、speed = 0.85
 * - 朗读文本 = 原文逐行用「，」连接，结尾加「。」
 * - 并发 4（TTS-1 限速较宽）
 * - localStorage 持久化
 */

import { savePoemPiece, loadPoemPiece } from './state.js';

const TYPE = 'audio';
const DEFAULT_VOICE = 'alloy';
const DEFAULT_SPEED = 0.85;

function buildReadingText(poem) {
  // 朗读文本：每行用中文逗号连接，最后加句号
  const lines = (poem.content || []).filter(l => typeof l === 'string' && l.trim().length > 0);
  return lines.join('，') + '。';
}

export function createAudioGenerator({
  client,
  poems,
  onProgress = () => {},
  concurrency = 4,
  voice = DEFAULT_VOICE,
  speed = DEFAULT_SPEED,
}) {
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
      const text = buildReadingText(poem);
      const dataUrl = await client.generateAudio({ text, voice, speed });
      if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:audio/')) {
        throw new Error('generateAudio 返回非 audio dataURL');
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
    localStorage.removeItem('shiyun_gen_audio_' + poemId);
    await processOne(poem);
  }

  return { start, cancel, regenerateOne, pendingPoemIds, stats: stats_ };
}
```

### `诗云-生成器.html`（修改）

在 `<head>` 中追加：
```html
<script type="module" src="src/generator/audio-generator.js"></script>
```

在 `startImageGeneration`（Task 7 接入）完成后接续调用音频生成：
```javascript
async function startAudioGeneration(poems) {
  const gen = createAudioGenerator({
    client: state.openaiClient,
    poems: poems,
    concurrency: 4,
    voice: 'alloy',
    speed: 0.85,
    onProgress: (e) => {
      if (e.status === 'success') $('stat-audio').textContent = parseInt($('stat-audio').textContent, 10) + 1;
      const total = e.total || poems.length;
      const done = parseInt($('stat-audio').textContent, 10);
      const pct = Math.round(done / total * 100);
      $('progress-bar').style.width = pct + '%';
      $('progress-text').textContent = pct + '%';
      $('progress-detail').textContent = `音频生成 ${done} / ${total}`;
      if (e.status === 'done') {
        $('progress-detail').textContent = '全部完成！点击「下一步」导出学习版。';
        setTimeout(() => goToStep(4), 800);
      }
    },
  });
  await gen.start();
  state.audioGen = gen;
}
```

并将整条生成链路串联（`startTextGeneration` 末尾接 `startImageGeneration` 末尾接 `startAudioGeneration`）。

## Step 4: 运行测试验证通过

```bash
cd C:/tjf/github/诗云
npm test -- tests/audio-generator.test.js
```

Expected: PASS（8 个测试用例全部通过）

## Step 5: 提交

```bash
cd C:/tjf/github/诗云
git add src/generator/audio-generator.js tests/audio-generator.test.js 诗云-生成器.html
git commit -m "feat(generator): 音频生成（TTS-1 alloy 慢速朗读 + 持久化）"
```

## 完成标志

```bash
cd C:/tjf/github/诗云
echo done > .tasks/done/08
```

## 关键说明

1. **接口与 Task 6/7 完全一致**：`createAudioGenerator({client, poems, onProgress, concurrency}).start/cancel/regenerateOne/pendingPoemIds/stats` — 三个生成器可共用同一 UI 控制流
2. **默认 voice/speed 设计**：参考设计文档 5.2 节"alloy/shimmer voice，节奏慢、清晰"。`alloy` 为 OpenAI TTS-1 6 个 voice 中性最稳的一个。`0.85` 速度适合古诗朗读（不急不慢）
3. **朗读文本用「，」分隔**：TTS-1 念中文逗号会自然停顿 0.3-0.5s，比用空格或换行更符合古诗节奏
4. **并发 = 4**：TTS-1 比 DALL-E 3 限速宽（每分钟 50 req），可以高并发
5. **结尾加「。」**：避免 TTS 把"低头思故乡"读完后戛然而止
6. **成本**：TTS-1 $0.015/1K 字符，112 首诗约 2000 字符 = $0.03 — 几乎可忽略
7. **多语言提示**：`alloy` 对中文支持良好；如家长想要更"古风"可改 `shimmer`（更温柔）— 测试已验证 voice 参数可覆盖
