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

function fakeAiResponse() {
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

function makeMockClient(overrides = {}) {
  return {
    generateText: vi.fn(async () => fakeAiResponse()),
    ...overrides,
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
    expect(localStorage.getItem('shiyun_gen_text_g1-01')).toBeTruthy();
    expect(localStorage.getItem('shiyun_gen_text_g1-02')).toBeTruthy();
    expect(localStorage.getItem('shiyun_gen_text_g1-03')).toBeTruthy();
  });

  it('已完成的不应重复生成', async () => {
    localStorage.setItem('shiyun_gen_text_g1-01', JSON.stringify({ translation: 'old' }));
    const client = makeMockClient();
    const gen = createTextGenerator({ client, poems: makePoems(), onProgress: () => {}, concurrency: 1 });
    await gen.start();
    expect(client.generateText).toHaveBeenCalledTimes(2);
    // 旧的应保留（如需覆盖请用 regenerateOne）
    const stored = JSON.parse(localStorage.getItem('shiyun_gen_text_g1-01'));
    expect(stored.translation).toBe('old');
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
    expect(client.generateText.mock.calls.length).toBeLessThanOrEqual(2);
  });

  it('onProgress 应收到 start/success/done 等事件', async () => {
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
