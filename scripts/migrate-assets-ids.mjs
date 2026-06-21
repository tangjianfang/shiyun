#!/usr/bin/env node
/**
 * 迁移 assets/ 文件夹从旧 ID 格式 → 新 ID 格式
 *
 * 旧：g1-01-静夜思-唐-李白.mp3   （按年级连续编号，无学期）
 * 新：g1-下-03-静夜思.mp3         （按 12 学期：g{年级}-{上|下}-{序号}）
 *
 * 匹配策略（按优先级）：
 *   L1: (grade, title, author) — 精确匹配
 *   L2: (title, author)        — 跨年级唯一匹配（处理旧年级编号错位）
 *   L3: (title)                — 仅标题匹配（处理 author 写法不一致，如 汉乐府 vs 佚名）
 *
 * 旧文件夹 vs POEMS_META 的差异：
 *   - 113 旧文件 → 112 部编版 诗
 *   - 一些旧文件的年级编号与新方案不一致（例：旧 g1-10-绝句 → 新 g2-下-05 / g3-下-01）
 *   - 一些旧 author 写的是出处（汉乐府、北朝民歌）而非作者（佚名）
 *   - 21 个旧文件对应 POEMS_META 中不存在的诗（需要重新生成）
 *   - 50 个新 POEMS_META 诗在旧文件夹中无对应文件（需要重新生成）
 *
 * 流程：
 *   1. 扫描音频，构建 old-id → (title, author) 字典
 *   2. 用字典补充图片文件的 title/author
 *   3. 按 L1→L2→L3 优先级匹配新 ID
 *   4. 复制旧文件为新文件名（旧文件不动，留 _archive/ 子文件夹归档）
 *   5. 重写 manifest.json（key 改为新 ID）
 *   6. 生成 MIGRATION_REPORT.md 详尽记录
 */

import fs from 'node:fs';
import path from 'node:path';
import { POEMS_META } from '../src/data/poems-meta.js';

const ROOT = path.resolve('.');
const ASSETS = path.join(ROOT, 'assets');

const AUDIO_NAME_RE = /^g([1-6])-(\d{1,2})-(.+)-([^-]+)-(.+)\.([^.]+)$/;

function normalizeTitle(rawTitle) {
  if (!rawTitle.includes('·')) return rawTitle;
  const [base, sub] = rawTitle.split('·');
  if (POEMS_META.some(p => p.title === base)) return base;
  if (sub && POEMS_META.some(p => p.title === `${base}（${sub}）`)) return `${base}（${sub}）`;
  return rawTitle;
}

function parseAudioName(filename) {
  const m = filename.match(AUDIO_NAME_RE);
  if (!m) return null;
  return {
    grade: parseInt(m[1], 10),
    oldSeq: parseInt(m[2], 10),
    title: normalizeTitle(m[3].trim()),
    rawTitle: m[3].trim(),
    dynasty: m[4].trim(),
    author: m[5].trim(),
    ext: m[6],
  };
}

/**
 * 多层级匹配：返回 { id, level, candidates }
 *   level: 'L1' | 'L2' | 'L3' | null
 */
function findNewId({ grade, title, author }) {
  // L1: 精确 (grade + title + author)
  const l1 = POEMS_META.filter(p => p.grade === grade && p.title === title && p.author === author);
  if (l1.length === 1) return { id: l1[0].id, level: 'L1' };
  if (l1.length > 1) return { id: l1.sort((a, b) => a.sequence - b.sequence)[0].id, level: 'L1-multi' };

  // L2: 跨 grade 唯一 (title + author)
  const l2 = POEMS_META.filter(p => p.title === title && p.author === author);
  if (l2.length === 1) return { id: l2[0].id, level: 'L2' };

  // L3: 仅 title（处理 author 写法不一致）
  const l3 = POEMS_META.filter(p => p.title === title);
  if (l3.length === 1) return { id: l3[0].id, level: 'L3' };

  return { id: null, level: null, candidates: [...l1, ...l2, ...l3] };
}

function newFileName(newId, title, ext) {
  const safeTitle = title.replace(/[/\\:*?"<>|]/g, '_');
  return `${newId}-${safeTitle}.${ext}`;
}

function migrate(dirName, oldIdMeta, dryRun) {
  const dir = path.join(ASSETS, dirName);
  if (!fs.existsSync(dir)) return { ok: 0, fail: 0, misses: [], mapping: [], levelStats: {} };
  const files = fs.readdirSync(dir)
    .filter(f => !f.startsWith('.') && f !== 'manifest.json' && f !== 'manifest.old.json');
  console.log(`\n=== ${dirName}/: ${files.length} 文件 ===`);

  const mapping = [];
  const newMeta = {};
  const misses = [];
  const levelStats = { L1: 0, 'L1-multi': 0, L2: 0, L3: 0 };

  const manifestPath = path.join(dir, 'manifest.json');
  const oldManifest = fs.existsSync(manifestPath)
    ? JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
    : {};

  for (const filename of files) {
    let parsed;
    if (dirName === 'audio') {
      parsed = parseAudioName(filename);
      if (!parsed) { misses.push({ filename, reason: 'parse-fail' }); continue; }
    } else {
      const m = filename.match(/^g([1-6])-(\d{1,2})\.(jpg|jpeg|png|webp)$/i);
      if (!m) { misses.push({ filename, reason: 'parse-fail' }); continue; }
      const oldId = `g${m[1]}-${m[2]}`;
      const meta = oldIdMeta[oldId];
      if (!meta) { misses.push({ filename, reason: 'no-audio-meta' }); continue; }
      parsed = {
        grade: parseInt(m[1], 10),
        oldSeq: parseInt(m[2], 10),
        title: meta.title,
        author: meta.author,
        ext: m[3].toLowerCase() === 'jpeg' ? 'jpg' : m[3].toLowerCase(),
      };
    }

    const oldId = `g${parsed.grade}-${String(parsed.oldSeq).padStart(2, '0')}`;
    const found = findNewId(parsed);
    if (!found.id) {
      misses.push({ filename, reason: 'no-match', title: parsed.title, author: parsed.author });
      continue;
    }
    levelStats[found.level] = (levelStats[found.level] || 0) + 1;
    const newName = newFileName(found.id, parsed.title, parsed.ext);
    mapping.push({
      oldId, newId: found.id, oldName: filename, newName,
      ext: parsed.ext, level: found.level,
    });

    const oldEntry = oldManifest[oldId];
    if (oldEntry) {
      newMeta[found.id] = { ...oldEntry, file: `assets/${dirName}/${newName}` };
    }
  }

  // 重名检测
  const nameCount = new Map();
  for (const m of mapping) nameCount.set(m.newName, (nameCount.get(m.newName) || 0) + 1);
  const dupNames = new Set([...nameCount.entries()].filter(([_, c]) => c > 1).map(([n]) => n));
  if (dupNames.size > 0) {
    console.log(`  !!! ${dupNames.size} 个新文件名重名`);
    for (const n of dupNames) {
      for (const m of mapping.filter(m => m.newName === n)) {
        console.log(`     ${n}  ←  ${m.oldName}  (${m.level})`);
      }
    }
  }

  if (!dryRun) {
    for (const m of mapping) {
      if (dupNames.has(m.newName)) continue;
      const oldPath = path.join(dir, m.oldName);
      const newPath = path.join(dir, m.newName);
      if (!fs.existsSync(newPath)) {
        fs.writeFileSync(newPath, fs.readFileSync(oldPath));
      }
    }
    const backup = path.join(dir, 'manifest.old.json');
    if (fs.existsSync(manifestPath) && !fs.existsSync(backup)) {
      fs.copyFileSync(manifestPath, backup);
    }
    fs.writeFileSync(manifestPath, JSON.stringify(newMeta, null, 2) + '\n', 'utf8');
    console.log(`  ✓ manifest.json: ${Object.keys(newMeta).length} 条`);
  } else {
    console.log(`  [DRY-RUN]`);
  }

  console.log(`  匹配层级: L1=${levelStats.L1}, L1-multi=${levelStats['L1-multi']}, L2=${levelStats.L2}, L3=${levelStats.L3}`);
  console.log(`  失败 ${misses.length}, 重名 ${dupNames.size}`);
  return { ok: mapping.length - dupNames.size, fail: misses.length, misses, mapping, levelStats };
}

// ── 主流程 ──
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

console.log(`模式：${dryRun ? 'DRY-RUN（不写文件）' : '正式执行'}`);

// 1. 构建 old-id 元数据字典（从音频）
const audioDir = path.join(ASSETS, 'audio');
const oldIdMeta = {};
if (fs.existsSync(audioDir)) {
  for (const f of fs.readdirSync(audioDir)) {
    if (f.startsWith('.') || f === 'manifest.json' || f === 'manifest.old.json') continue;
    const parsed = parseAudioName(f);
    if (!parsed) continue;
    const oldId = `g${parsed.grade}-${String(parsed.oldSeq).padStart(2, '0')}`;
    oldIdMeta[oldId] = { title: parsed.title, author: parsed.author, rawTitle: parsed.rawTitle };
  }
}
console.log(`音频元数据字典: ${Object.keys(oldIdMeta).length} 条`);

const audioResult = migrate('audio', oldIdMeta, dryRun);
const imageResult = migrate('images', oldIdMeta, dryRun);

console.log('\n=== 汇总 ===');
console.log(`audio:  ok=${audioResult.ok}, fail=${audioResult.fail}`);
console.log(`image:  ok=${imageResult.ok}, fail=${imageResult.fail}`);

// 2. 找出未被覆盖的 POEMS_META 诗（缺失）
const newIds = new Set([
  ...audioResult.mapping.map(m => m.newId),
  ...imageResult.mapping.map(m => m.newId),
]);
const metaIds = POEMS_META.map(p => p.id);
const missingIds = metaIds.filter(id => !newIds.has(id));

// 3. 写出详细报告
const report = [];
report.push(`# Assets 迁移报告`);
report.push(``);
report.push(`生成时间：${new Date().toISOString()}`);
report.push(``);
report.push(`## 摘要`);
report.push(``);
report.push(`- POEMS_META 收录诗数：${POEMS_META.length}`);
report.push(`- 旧 assets 文件数：113（audio=${audioResult.mapping.length + audioResult.misses.length}, images=${imageResult.mapping.length + imageResult.misses.length}）`);
report.push(`- 已映射旧文件：${audioResult.ok} audio + ${imageResult.ok} image`);
report.push(`- 失败旧文件：${audioResult.fail} audio + ${imageResult.fail} image`);
report.push(`- POEMS_META 中无对应资产的诗：${missingIds.length}`);
report.push(``);
report.push(`## 匹配层级`);
report.push(``);
report.push(`- L1（精确 grade+title+author）：${audioResult.levelStats.L1 + (imageResult.levelStats.L1 || 0)}`);
report.push(`- L1-multi（同 grade 多匹配）：${(audioResult.levelStats['L1-multi'] || 0) + (imageResult.levelStats['L1-multi'] || 0)}`);
report.push(`- L2（跨 grade 唯一 title+author）：${(audioResult.levelStats.L2 || 0) + (imageResult.levelStats.L2 || 0)}`);
report.push(`- L3（仅 title 匹配）：${(audioResult.levelStats.L3 || 0) + (imageResult.levelStats.L3 || 0)}`);
report.push(``);
report.push(`## 失败文件清单（POEMS_META 中不存在或年级/作者无法定位）`);
report.push(``);
report.push(`### audio`);
report.push(``);
for (const m of audioResult.misses) {
  report.push(`- \`${m.filename}\`${m.title ? ` (title=${m.title}, author=${m.author})` : ''}`);
}
report.push(``);
report.push(`### images`);
report.push(``);
for (const m of imageResult.misses) {
  report.push(`- \`${m.filename}\``);
}
report.push(``);
report.push(`## POEMS_META 中无对应资产的诗（需要重新生成）`);
report.push(``);
report.push(`| 新 ID | 标题 | 作者 | 年级 | 学期 |`);
report.push(`|---|---|---|---|---|`);
for (const id of missingIds) {
  const p = POEMS_META.find(p => p.id === id);
  report.push(`| ${id} | ${p.title} | ${p.author} | ${p.grade} | ${p.semester} |`);
}
report.push(``);
report.push(`## 后续建议`);
report.push(``);
report.push(`1. 重新生成缺失资产的诗（见上表 ${missingIds.length} 首）`);
report.push(`2. 处理失败旧文件：确认内容是否仍有价值，否则可删除`);
report.push(`3. 清理 \`manifest.old.json\` 和 \`_archive/\` 子文件夹（在确认数据完整后）`);
report.push(``);

if (!dryRun) {
  const reportPath = path.join(ASSETS, 'MIGRATION_REPORT.md');
  fs.writeFileSync(reportPath, report.join('\n'), 'utf8');
  console.log(`\n✓ 报告已写入: ${reportPath}`);
}

console.log(`\n缺失资产：${missingIds.length} 首`);
console.log(`未匹配旧文件：${audioResult.misses.length + imageResult.misses.length} 个`);