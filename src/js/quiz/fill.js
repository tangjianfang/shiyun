/**
 * 考核模式 A：诗句填空
 *
 * 数据来源：poem.keySentences
 * 判分：每空 10 分（满分 100，按比例取整）
 *
 * 纯函数：所有函数无副作用，方便单测
 */

import { getPoemsByGrade } from '../data.js';

/**
 * 从所有挖空位置收集正确的字
 */
export function collectFillChars(poem) {
  if (!poem.keySentences || poem.keySentences.length === 0) return [];
  const chars = [];
  for (const ks of poem.keySentences) {
    for (const idx of ks.blanks) {
      if (ks.chars[idx]) chars.push(ks.chars[idx]);
    }
  }
  return chars;
}

/**
 * 从同年级的其他诗里抽干扰字
 */
function pickDistractorChars(poem, need) {
  if (need <= 0) return [];
  const allText = (poem.content || []).join('');
  const peers = getPoemsByGrade(poem.grade).filter(p => p.id !== poem.id);
  const pool = [];
  for (const p of peers) {
    pool.push(...(p.content || []).join('').split(''));
  }
  const correctSet = new Set(collectFillChars(poem));
  const inSamePoem = new Set(allText.split(''));
  const filtered = pool.filter(c => !correctSet.has(c) && !inSamePoem.has(c));
  const unique = [...new Set(filtered)];
  for (let i = unique.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [unique[i], unique[j]] = [unique[j], unique[i]];
  }
  return unique.slice(0, need);
}

/**
 * 构建填空题数据结构
 */
export function buildFillQuestion(poem, opts = {}) {
  const distractorCount = opts.distractorCount ?? 2;
  const correctChars = collectFillChars(poem);
  const distractors = pickDistractorChars(poem, distractorCount);
  const charBank = [...correctChars, ...distractors];
  for (let i = charBank.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [charBank[i], charBank[j]] = [charBank[j], charBank[i]];
  }
  return {
    poemId: poem.id,
    title: poem.title,
    lines: poem.keySentences.map(ks => ({
      line: ks.line,
      chars: ks.chars,
      blanks: ks.blanks,
    })),
    charBank,
  };
}

/**
 * 判分：每空 10 分，按正确率取整
 */
export function scoreFill(poem, answers) {
  const total = collectFillChars(poem).length;
  if (total === 0) return 0;
  let correct = 0;
  for (const ks of poem.keySentences) {
    for (const blankIdx of ks.blanks) {
      const userAnswer = answers?.[ks.line]?.[blankIdx];
      const correctChar = ks.chars[blankIdx];
      if (userAnswer && userAnswer === correctChar) correct++;
    }
  }
  return Math.round((correct / total) * 100);
}

/**
 * 列出错的空位
 */
export function listWrongBlanks(poem, answers) {
  const wrongs = [];
  for (const ks of poem.keySentences) {
    for (const blankIdx of ks.blanks) {
      const userAnswer = answers?.[ks.line]?.[blankIdx];
      const correctChar = ks.chars[blankIdx];
      if (userAnswer !== correctChar) {
        wrongs.push({ line: ks.line, blankIdx, userAnswer: userAnswer || '', correctChar });
      }
    }
  }
  return wrongs;
}
