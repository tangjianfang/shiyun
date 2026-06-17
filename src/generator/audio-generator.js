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

  return { start, cancel, regenerateOne, pendingPoemIds, stats: () => ({ ...stats }) };
}
