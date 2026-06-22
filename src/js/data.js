/**
 * 诗云数据层
 * - POEMS_META: 静态元数据（任务 2 中创建，从 poems-meta.js 引入）
 * - poems (运行时): 完整 Poem 数据（含 AI 生成内容），由生成器填充
 * - 用户进度: 存 localStorage，由 storage.js 封装
 */

import { POEMS_META, SEMESTERS } from '../data/poems-meta.js';
import { searchPoemsByKeyword, getUniqueValues } from './poem-query.js';

/**
 * @typedef {Object} Poem
 * @property {string} id
 * @property {string} title
 * @property {string} author
 * @property {string} dynasty
 * @property {1|2|3|4|5|6} grade
 * @property {string} type
 * @property {string[]} content
 * @property {string[]} pinyin
 * @property {string} translation
 * @property {string} background
 * @property {Object<string,string>} annotations
 * @property {string} theme
 * @property {string[]} keywords
 * @property {string} image        // data:image/jpeg;base64,...
 * @property {string} audio        // data:audio/mp3;base64,...
 * @property {KeySentence[]} keySentences
 * @property {number} sequence
 * @property {string} source
 */

/**
 * @typedef {Object} KeySentence
 * @property {number} line      // 第几句（0-indexed）
 * @property {string[]} chars   // 拆开的字
 * @property {number[]} blanks  // 挖空位置（chars 数组的索引）
 */

/** 运行时诗词数据，生成器填充后由构建脚本嵌入 */
export const poems = new Map();  // id -> Poem

/** 加载元数据为 Map */
export function loadPoemMeta() {
  POEMS_META.forEach(meta => {
    poems.set(meta.id, { ...meta, pinyin: [], keySentences: [] });
  });
  return poems;
}

/** 取诗 */
export function getPoem(id) {
  return poems.get(id);
}

/** 按年级取诗 */
export function getPoemsByGrade(grade) {
  return Array.from(poems.values()).filter(p => p.grade === grade);
}

/** 按学期取诗（grade + semester） */
export function getPoemsBySemester(grade, semester) {
  return Array.from(poems.values()).filter(p => p.grade === grade && p.semester === semester);
}

/** 12 个学期（按时间顺序：1上→6下） */
export const ALL_SEMESTERS = (() => {
  const out = [];
  for (const g of [1, 2, 3, 4, 5, 6]) {
    for (const s of SEMESTERS) out.push({ grade: g, semester: s, label: `${g} 年级 ${s}册` });
  }
  return out;
})();

/** 按朝代取诗 */
export function getPoemsByDynasty(dynasty) {
  return Array.from(poems.values()).filter(p => p.dynasty === dynasty);
}

/** 按作者取诗 */
export function getPoemsByAuthor(author) {
  return Array.from(poems.values()).filter(p => p.author === author);
}

/** 搜索（标题 + 作者）— @deprecated 用 poem-query.searchPoemsByKeyword 代替 */
export function searchPoems(keyword) {
  return searchPoemsByKeyword(Array.from(poems.values()), keyword);
}

/** 获取所有不重复的朝代（含空字符串，用于打印 UI 全选覆盖所有诗） */
export function getAllDynasties() {
  return [...new Set(Array.from(poems.values()).map(p => p.dynasty))].sort();
}

/** 获取所有不重复的作者 */
export function getAllAuthors() {
  return [...new Set(Array.from(poems.values()).map(p => p.author))].filter(Boolean).sort();
}

/** 是否有 AI 生成的完整内容（图片 + 音频） */
export function isPoemComplete(poem) {
  return !!(poem.image && poem.audio && poem.pinyin && poem.pinyin.length > 0);
}

/** 获取所有诗 */
export function getAllPoems() {
  return Array.from(poems.values());
}

/** 序列化全部诗为 JSON（用于嵌入到学习版） */
export function serializePoems() {
  return JSON.stringify(Array.from(poems.values()));
}

/** 从 JSON 反序列化 */
export function deserializePoems(json) {
  const arr = JSON.parse(json);
  arr.forEach(p => poems.set(p.id, p));
  return poems;
}