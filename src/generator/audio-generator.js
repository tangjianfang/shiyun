/**
 * 音频生成器：批量为每首诗调 TTS-1 生成 MP3 朗读
 * - 默认 voice = 'alloy'、speed = 0.85
 * - 朗读文本 = 原文逐行用「，」连接，结尾加「。」
 * - 并发 4（TTS-1 限速较宽）
 * - localStorage 持久化
 */

import { savePoemPiece } from './state.js';
import { createPipelineBase } from './pipeline-base.js';

const TYPE = 'audio';
const DEFAULT_VOICE = 'alloy';
const DEFAULT_SPEED = 0.85;
const storageKey = (poemId) => 'shiyun_gen_audio_' + poemId;

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
  async function processOne(poem, ctx) {
    if (ctx.cancelled()) return;
    ctx.emit({ poemId: poem.id, status: 'start', current: ctx.stats.done + ctx.stats.failed + ctx.stats.skipped + 1, total: ctx.stats.total });
    try {
      const text = buildReadingText(poem);
      const dataUrl = await client.generateAudio({ text, voice, speed });
      if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:audio/')) {
        throw new Error('generateAudio 返回非 audio dataURL');
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
