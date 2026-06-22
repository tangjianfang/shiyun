/**
 * 文本生成器：批量为每首诗调 OpenAI 生成扩展内容
 * - 并发控制
 * - localStorage 持久化（依赖 Task 5 state.js 的键命名）
 * - 单首失败不阻塞
 * - 取消与单首重生成
 */

import { savePoemPiece, loadPoemPiece } from './state.js';
import { createPipelineBase } from './pipeline-base.js';

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
  async function processOne(poem, ctx) {
    if (ctx.cancelled()) return;
    ctx.emit({ poemId: poem.id, status: 'start', current: ctx.stats.done + ctx.stats.failed + ctx.stats.skipped + 1, total: ctx.stats.total });
    try {
      const raw = await client.generateText({
        systemPrompt: SYSTEM_PROMPT,
        userPrompt: buildUserPrompt(poem),
        jsonMode: true,
        temperature: 0.7,
      });
      const data = validateAndNormalize(raw, poem);
      savePoemPiece(poem.id, TYPE, data);
      ctx.stats.done++;
      ctx.emit({ poemId: poem.id, status: 'success', current: ctx.stats.done + ctx.stats.failed + ctx.stats.skipped, total: ctx.stats.total });
    } catch (e) {
      ctx.stats.failed++;
      ctx.emit({ poemId: poem.id, status: 'fail', error: e.message, current: ctx.stats.done + ctx.stats.failed + ctx.stats.skipped, total: ctx.stats.total });
    }
  }

  return createPipelineBase({ poems, onProgress, concurrency, type: TYPE, storageKey, processOne });
}
