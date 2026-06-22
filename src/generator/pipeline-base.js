/**
 * pipeline-base.js — 生成器公共框架（R-2.3）
 *
 * 抽出 text/image/audio 三个生成器中重复的基础逻辑：
 *   - poemList 规范化（Array | Map）
 *   - cancelled 标志 + stats 对象
 *   - emit 安全包裹
 *   - pendingPoemIds()
 *   - worker 并发调度
 *   - start()
 *   - cancel()
 *   - regenerateOne(poemId, storageKey)
 *
 * 每个具体生成器只需提供：
 *   - TYPE: string
 *   - storageKey(poemId): string  — 用于 regenerateOne 清除旧数据
 *   - processOne(poem, ctx): Promise<void>  — 单首处理逻辑（已含 savePoemPiece）
 *
 * @param {object} params
 * @param {object[]|Map} params.poems
 * @param {function}     params.onProgress
 * @param {number}       params.concurrency
 * @param {string}       params.type        — TYPE 常量
 * @param {function}     params.storageKey  — poemId → localStorage key
 * @param {function}     params.processOne  — async (poem, ctx) => void
 *   ctx = { cancelled: () => boolean, emit, stats }
 */
import { loadPoemPiece } from './state.js';

export function createPipelineBase({ poems, onProgress = () => {}, concurrency, type, storageKey, processOne, loadFn }) {
  const poemList = Array.isArray(poems) ? poems : Array.from(poems.values());
  let cancelled = false;
  const stats = { done: 0, total: poemList.length, failed: 0, skipped: 0 };

  // loadFn 允许测试覆盖（避免 loadPoemPiece 的 type 白名单限制）
  const _load = loadFn ?? ((id) => loadPoemPiece(id, type));

  function emit(event) {
    try { onProgress(event); } catch {}
  }

  const ctx = {
    cancelled: () => cancelled,
    emit,
    stats,
  };

  function pendingPoemIds() {
    return poemList.filter(p => _load(p.id) === null).map(p => p.id);
  }

  async function _processOneWrapper(poem) {
    if (cancelled) return;
    await processOne(poem, ctx);
  }

  async function worker(queue) {
    while (queue.length > 0) {
      if (cancelled) return;
      const poem = queue.shift();
      await _processOneWrapper(poem);
    }
  }

  async function start() {
    cancelled = false;
    const queue = poemList.filter(p => _load(p.id) === null);
    stats.skipped = stats.total - queue.length;
    if (queue.length === 0) {
      emit({ poemId: null, status: 'done' });
      return;
    }
    const n = Math.min(concurrency, queue.length);
    const workers = [];
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
    localStorage.removeItem(storageKey(poemId));
    await _processOneWrapper(poem);
  }

  return { start, cancel, regenerateOne, pendingPoemIds, stats: () => ({ ...stats }) };
}
