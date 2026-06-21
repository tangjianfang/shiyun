#!/usr/bin/env node
/**
 * 迁移 assets/content/manifest.json 的 key 从旧 ID → 新 ID
 *
 * 与音频迁移共享同一套 L1→L2→L3 匹配策略。
 */

import fs from 'node:fs';
import path from 'node:path';
import { POEMS_META } from '../src/data/poems-meta.js';

const ROOT = path.resolve('.');
const CONTENT_DIR = path.join(ROOT, 'assets', 'content');
const AUDIO_DIR = path.join(ROOT, 'assets', 'audio');
const MANIFEST = path.join(CONTENT_DIR, 'manifest.json');

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
    title: normalizeTitle(m[3].trim()),
    author: m[5].trim(),
  };
}

function findNewId({ grade, title, author }) {
  const l1 = POEMS_META.filter(p => p.grade === grade && p.title === title && p.author === author);
  if (l1.length === 1) return l1[0].id;
  if (l1.length > 1) return l1.sort((a, b) => a.sequence - b.sequence)[0].id;
  const l2 = POEMS_META.filter(p => p.title === title && p.author === author);
  if (l2.length === 1) return l2[0].id;
  const l3 = POEMS_META.filter(p => p.title === title);
  if (l3.length === 1) return l3[0].id;
  return null;
}

// 构建 old-id → (title, author) 字典
const oldIdMeta = {};
for (const f of fs.readdirSync(AUDIO_DIR)) {
  if (f.startsWith('.') || f === 'manifest.json' || f === 'manifest.old.json') continue;
  const parsed = parseAudioName(f);
  if (!parsed) continue;
  const oldId = `g${parsed.grade}-${String(parsed.oldSeq || 0).padStart(2, '0')}`;
  // 找旧序号
  const m = f.match(AUDIO_NAME_RE);
  const oldSeq = m[2];
  const oid = `g${parsed.grade}-${oldSeq}`;
  oldIdMeta[oid] = { title: parsed.title, author: parsed.author };
}

console.log(`音频元数据字典: ${Object.keys(oldIdMeta).length} 条`);

// 读旧 content manifest
if (!fs.existsSync(MANIFEST)) {
  console.error(`未找到: ${MANIFEST}`);
  process.exit(1);
}
const oldContent = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
console.log(`旧 content manifest: ${Object.keys(oldContent).length} 条`);

const newContent = {};
const misses = [];
for (const [oldId, entry] of Object.entries(oldContent)) {
  const meta = oldIdMeta[oldId];
  if (!meta) {
    misses.push(oldId);
    continue;
  }
  const newId = findNewId({ grade: parseInt(oldId[1]), title: meta.title, author: meta.author });
  if (!newId) {
    misses.push(oldId);
    continue;
  }
  newContent[newId] = entry;
}

console.log(`新 content manifest: ${Object.keys(newContent).length} 条`);
console.log(`未匹配: ${misses.length}`);
if (misses.length > 0) {
  for (const id of misses) console.log(`  - ${id}`);
}

// 备份后写新
const backup = path.join(CONTENT_DIR, 'manifest.old.json');
if (!fs.existsSync(backup)) {
  fs.copyFileSync(MANIFEST, backup);
}
fs.writeFileSync(MANIFEST, JSON.stringify(newContent, null, 2) + '\n', 'utf8');
console.log(`✓ 已写入新 ${MANIFEST}`);
console.log(`✓ 备份: ${backup}`);