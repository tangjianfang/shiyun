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
  const firstTwo = (poem.content || []).slice(0, 2).join(' / ');
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

  async function processOne(poem) {
    if (cancelled) return;
    emit({ poemId: poem.id, status: 'start', current: stats.done + stats.failed + stats.skipped + 1, total: stats.total });
    try {
      const dataUrl = await client.generateImage({
        prompt: buildPrompt(poem),
        size: IMAGE_SIZE,
        quality: 'standard',
      });
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

  return { start, cancel, regenerateOne, pendingPoemIds, stats: () => ({ ...stats }) };
}
