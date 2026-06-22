/**
 * pipeline-base.test.js — R-2.3
 *
 * createPipelineBase 单元测试：
 * - pendingPoemIds
 * - start / 并发控制
 * - cancel
 * - regenerateOne
 * - stats 统计
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createPipelineBase } from '../src/generator/pipeline-base.js';

const POEMS = [
  { id: 'g1-01', title: '静夜思', content: ['床前明月光'] },
  { id: 'g1-02', title: '咏鹅',   content: ['鹅鹅鹅'] },
  { id: 'g1-03', title: '春晓',   content: ['春眠不觉晓'] },
];

const TYPE = 'text';  // 使用受 loadPoemPiece 支持的 type
const storageKey = id => 'shiyun_gen_text_' + id;

function makeProcessOne(onCall) {
  return async (poem, ctx) => {
    if (ctx.cancelled()) return;
    if (onCall) onCall(poem, ctx);
    ctx.stats.done++;
    ctx.emit({ poemId: poem.id, status: 'success' });
  };
}

beforeEach(() => {
  localStorage.clear();
});

describe('createPipelineBase', () => {
  it('pendingPoemIds() — 全部未生成时返回全部 id', () => {
    const base = createPipelineBase({
      poems: POEMS, onProgress: () => {}, concurrency: 1,
      type: TYPE, storageKey, processOne: makeProcessOne(),
    });
    expect(base.pendingPoemIds()).toEqual(['g1-01', 'g1-02', 'g1-03']);
  });

  it('pendingPoemIds() — 已生成的不出现', () => {
    localStorage.setItem(storageKey('g1-01'), JSON.stringify({ done: true }));
    const base = createPipelineBase({
      poems: POEMS, onProgress: () => {}, concurrency: 2,
      type: TYPE, storageKey, processOne: makeProcessOne(),
    });
    expect(base.pendingPoemIds()).toEqual(['g1-02', 'g1-03']);
  });

  it('pendingPoemIds() — 使用 loadFn 自定义加载逻辑', () => {
    const store = new Map([['g1-01', 'done']]);
    const base = createPipelineBase({
      poems: POEMS, onProgress: () => {}, concurrency: 2,
      type: TYPE, storageKey,
      loadFn: id => store.get(id) ?? null,
      processOne: makeProcessOne(),
    });
    expect(base.pendingPoemIds()).toEqual(['g1-02', 'g1-03']);
  });

  it('start() — 全部处理后 emit done', async () => {
    const events = [];
    const base = createPipelineBase({
      poems: POEMS, onProgress: e => events.push(e), concurrency: 3,
      type: TYPE, storageKey, processOne: makeProcessOne(),
    });
    await base.start();
    expect(events.at(-1)).toMatchObject({ poemId: null, status: 'done' });
  });

  it('start() — 全部已完成时直接 emit done，processOne 不被调用', async () => {
    for (const p of POEMS) localStorage.setItem(storageKey(p.id), JSON.stringify({ done: true }));
    const called = [];
    const base = createPipelineBase({
      poems: POEMS, onProgress: () => {}, concurrency: 2,
      type: TYPE, storageKey,
      processOne: async (poem) => { called.push(poem.id); },
    });
    await base.start();
    expect(called).toEqual([]);
  });

  it('start() — stats.skipped 正确', async () => {
    localStorage.setItem(storageKey('g1-01'), JSON.stringify({ done: true }));
    const base = createPipelineBase({
      poems: POEMS, onProgress: () => {}, concurrency: 2,
      type: TYPE, storageKey, processOne: makeProcessOne(),
    });
    await base.start();
    expect(base.stats().skipped).toBe(1);
  });

  it('stats() — 返回当前快照（不影响内部 stats）', async () => {
    const base = createPipelineBase({
      poems: POEMS, onProgress: () => {}, concurrency: 2,
      type: TYPE, storageKey, processOne: makeProcessOne(),
    });
    await base.start();
    const s = base.stats();
    expect(s.done).toBe(3);
    expect(s.total).toBe(3);
    // 修改返回值不影响内部
    s.done = 999;
    expect(base.stats().done).toBe(3);
  });

  it('cancel() — 取消后 processOne 不再被调用', async () => {
    const order = [];
    const base = createPipelineBase({
      poems: POEMS, onProgress: () => {}, concurrency: 1,
      type: TYPE, storageKey,
      processOne: async (poem, ctx) => {
        order.push(poem.id);
        ctx.stats.done++;
        // 在处理第一首后取消
        if (order.length === 1) base.cancel();
      },
    });
    await base.start();
    // 并发为 1：处理完第 1 首后检测到 cancelled，第 2/3 首被跳过
    expect(order.length).toBe(1);
  });

  it('regenerateOne() — 清除旧缓存并重新处理', async () => {
    localStorage.setItem(storageKey('g1-01'), JSON.stringify({ done: true }));
    const called = [];
    const base = createPipelineBase({
      poems: POEMS, onProgress: () => {}, concurrency: 1,
      type: TYPE, storageKey,
      processOne: async (poem) => { called.push(poem.id); },
    });
    await base.regenerateOne('g1-01');
    expect(localStorage.getItem(storageKey('g1-01'))).toBeNull();
    expect(called).toContain('g1-01');
  });

  it('regenerateOne() — 未知 id 应抛错', async () => {
    const base = createPipelineBase({
      poems: POEMS, onProgress: () => {}, concurrency: 1,
      type: TYPE, storageKey, processOne: makeProcessOne(),
    });
    await expect(base.regenerateOne('g9-99')).rejects.toThrow('未找到诗');
  });

  it('poems 可以是 Map', async () => {
    const poemsMap = new Map(POEMS.map(p => [p.id, p]));
    const base = createPipelineBase({
      poems: poemsMap, onProgress: () => {}, concurrency: 2,
      type: TYPE, storageKey, processOne: makeProcessOne(),
    });
    expect(base.pendingPoemIds()).toHaveLength(3);
    await base.start();
    expect(base.stats().done).toBe(3);
  });
});
