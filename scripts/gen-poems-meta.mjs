#!/usr/bin/env node
/**
 * 从 src/data/小学生必备古诗词112首-2019年11月第1版.txt
 * 生成 src/data/poems-meta.js
 *
 * 这是单一数据源（source of truth）脚本：每次 .txt 变更后跑一次。
 * 输出包含 112 首诗的 title/author/dynasty 字段，其它字段（content/pinyin/image/audio）由 AI 生成器填充。
 */

import fs from 'node:fs';
import path from 'node:path';

const TXT_PATH = path.join('src', 'data', '小学生必备古诗词112首-2019年11月第1版.txt');
const OUT_PATH = path.join('src', 'data', 'poems-meta.js');

const CN = { '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6 };

function parseTxt(raw) {
  const out = [];
  let grade = 0, sem = '';
  let seq = 0;
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim();
    if (!t) continue;
    const semMatch = t.match(/^([一二三四五六])年级(上|下)册$/);
    if (semMatch) {
      grade = CN[semMatch[1]];
      sem = semMatch[2];
      seq = 0;
      continue;
    }
    if (!/^\d+\./.test(t)) continue;
    seq += 1;
    const noPrefix = t.replace(/^\d+\.\s*/, '');
    // 1) 标题 【朝代】作者  (允许标题与【之间无空格)
    let m = noPrefix.match(/^(.+?)【(.+?)】\s*(.+)$/);
    if (m) {
      out.push({ grade, sem, seq, title: m[1].trim(), author: m[3].trim(), dynasty: m[2].trim() });
      continue;
    }
    // 2) 标题  汉乐府 / 北朝民歌 / 佚名 / 《古诗十九首》/《诗经》 (允许无空格)
    m = noPrefix.match(/^(.+?)\s*((?:汉|北朝)?(?:乐府|民歌)|佚名|《[^》]+》)$/);
    if (m) {
      const tail = m[2];
      let author = tail, dynasty = '';
      if (tail === '佚名') { author = '佚名'; dynasty = ''; }
      else if (tail === '汉乐府') { author = '佚名'; dynasty = '汉'; }
      else if (tail === '北朝民歌') { author = '佚名'; dynasty = '南北朝'; }
      else if (/^《/.test(tail)) { author = '佚名'; dynasty = tail.replace(/[《》]/g, ''); }
      out.push({ grade, sem, seq, title: m[1].trim(), author, dynasty });
      continue;
    }
    throw new Error(`无法解析行: "${t}"`);
  }
  return out;
}

function render(poems) {
  const gradeMap = { 1:'一', 2:'二', 3:'三', 4:'四', 5:'五', 6:'六' };
  let globalSeq = 0;
  const blocks = [];
  let prev = null;
  for (const p of poems) {
    globalSeq += 1;
    const key = `${p.grade}-${p.sem}`;
    if (key !== prev) {
      const cnG = gradeMap[p.grade];
      blocks.push(`  // ===== ${cnG} 年级 ${p.sem} 册 =====`);
      prev = key;
    }
    const id = `g${p.grade}-${p.sem}-${String(p.seq).padStart(2, '0')}`;
    const title = p.title.replace(/'/g, "\\'");
    const author = p.author.replace(/'/g, "\\'");
    const dynasty = p.dynasty.replace(/'/g, "\\'");
    const cnG = gradeMap[p.grade];
    const semLabel = p.sem === '上' ? '上 册' : '下 册';
    blocks.push(
      `  { id: '${id}', grade: ${p.grade}, semester: '${p.sem}', sequence: ${p.seq}, globalSequence: ${globalSeq}, title: '${title}', author: '${author}', dynasty: '${dynasty}', type: '其他', content: ['（待 AI 补全）'], source: '《小学生必备古诗词112首》· ${cnG} 年级 ${semLabel}' },`
    );
  }
  return blocks.join('\n');
}

function renderCounts(poems) {
  const counts = {};
  for (const p of poems) {
    counts[p.grade] = (counts[p.grade] || 0) + 1;
  }
  return JSON.stringify(counts);
}

const raw = fs.readFileSync(TXT_PATH, 'utf8');
const poems = parseTxt(raw);
if (poems.length !== 112) {
  console.error(`❌ TXT 应有 112 首诗，实际解析 ${poems.length} 首`);
  process.exit(1);
}

const counts = renderCounts(poems);
const body = render(poems);

const output = `/**
 * 部编版小学语文 1-6 年级 112 首必背古诗词元数据
 * 数据来源：《小学生必备古诗词112首》（人民教育出版社，2019.11 第1版）
 * 文档：src/data/小学生必备古诗词112首-2019年11月第1版.txt
 * 真实教材：1-6 年级上下册对应 12 个学期，按部编版教学进度排列
 *
 * 字段说明：
 * - id:             唯一 ID，格式 g{年级}-{学期}-{学期内序号}，如 g1-上-01
 * - grade:          年级（1-6）
 * - semester:       学期，"上" 或 "下"
 * - sequence:       学期内序号（1-N）
 * - globalSequence: 全局序号（1-112）
 * - title:          标题
 * - author:         作者
 * - dynasty:        朝代（无名作者为空字符串）
 * - type:           诗体（占位）
 * - content:        分句数组（占位，由 AI 生成器填充）
 * - source:         来源标注
 *
 * ⚠️ 本文件由 scripts/gen-poems-meta.mjs 从 .txt 重新生成，请勿手改；
 *    如需修改，请直接修改 .txt 后跑 node scripts/gen-poems-meta.mjs
 */

export const POEMS_META = [
${body}
];

// 各年级诗词数量（与教材一致）
export const GRADE_COUNTS = ${counts};
export const GRADES = [1, 2, 3, 4, 5, 6];
export const SEMESTERS = ["上", "下"];

export function getPoemsByGrade(grade) { return POEMS_META.filter(p => p.grade === grade); }
export function getPoemsBySemester(grade, semester) { return POEMS_META.filter(p => p.grade === grade && p.semester === semester); }
export function getPoemsByDynasty(dynasty) { return POEMS_META.filter(p => p.dynasty === dynasty); }
export function getPoemsByAuthor(author) { return POEMS_META.filter(p => p.author === author); }
export function searchPoems(keyword) {
  const kw = keyword.trim().toLowerCase();
  if (!kw) return [...POEMS_META];
  return POEMS_META.filter(p => p.title.toLowerCase().includes(kw) || p.author.toLowerCase().includes(kw));
}
export function getAllDynasties() { return [...new Set(POEMS_META.map(p => p.dynasty).filter(Boolean))].sort(); }
export function getAllAuthors() { return [...new Set(POEMS_META.map(p => p.author).filter(Boolean))].sort(); }
`;

fs.writeFileSync(OUT_PATH, output, 'utf8');
console.log(`✅ ${poems.length} 首诗已写入 ${OUT_PATH}`);
console.log(`   各年级分布: ${counts}`);
