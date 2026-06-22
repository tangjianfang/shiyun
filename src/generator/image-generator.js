/**
 * 配图生成器：批量为每首诗调 DALL-E 3 生成水墨风格配图
 * - 1024x1024 PNG（设计文档规格 512x512，但 DALL-E 3 不支持 512）
 * - 并发控制（默认 2，DALL-E 3 限速较严）
 * - localStorage 持久化
 * - 单首失败不阻塞
 */

import { savePoemPiece, loadPoemPiece } from './state.js';
import { createPipelineBase } from './pipeline-base.js';

const TYPE = 'image';
const IMAGE_SIZE = '1024x1024';
const storageKey = (poemId) => 'shiyun_gen_image_' + poemId;

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
  async function processOne(poem, ctx) {
    if (ctx.cancelled()) return;
    ctx.emit({ poemId: poem.id, status: 'start', current: ctx.stats.done + ctx.stats.failed + ctx.stats.skipped + 1, total: ctx.stats.total });
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
      ctx.stats.done++;
      ctx.emit({ poemId: poem.id, status: 'success', current: ctx.stats.done + ctx.stats.failed + ctx.stats.skipped, total: ctx.stats.total });
    } catch (e) {
      ctx.stats.failed++;
      ctx.emit({ poemId: poem.id, status: 'fail', error: e.message, current: ctx.stats.done + ctx.stats.failed + ctx.stats.skipped, total: ctx.stats.total });
    }
  }

  return createPipelineBase({ poems, onProgress, concurrency, type: TYPE, storageKey, processOne });
}
