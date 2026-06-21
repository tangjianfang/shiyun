#!/usr/bin/env node
/**
 * 关联用户的官方音频到 assets/audio/
 *
 * 源：src/data/小学生必备古诗词112首/{001-112} {title}.mp3
 * 目标：assets/audio/g{年级}-{上|下}-{序号}-{title}.mp3
 *
 * 匹配规则：源文件按数字顺序 001-112，对应 POEMS_META 的 sequence 1-112
 *
 * 已知差异：
 *   092: 源"回乡偶书" vs POEMS_META g6-上-06 "回乡偶书（其一）"
 *   → 复制时保留源文件名（仅数字 → 新 ID），标题细节由 POEMS_META 主导
 *
 * 用法：
 *   node scripts/link-user-audio.mjs [--dry-run]
 */

import fs from 'node:fs';
import path from 'node:path';
import { POEMS_META } from '../src/data/poems-meta.js';

const ROOT = path.resolve('.');
const SOURCE_DIR = path.join(ROOT, 'src', 'data', '小学生必备古诗词112首');
const AUDIO_DIR = path.join(ROOT, 'assets', 'audio');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

if (!fs.existsSync(SOURCE_DIR)) {
  console.error(`源目录不存在: ${SOURCE_DIR}`);
  process.exit(1);
}
if (!fs.existsSync(AUDIO_DIR)) {
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
}

const sourceFiles = fs.readdirSync(SOURCE_DIR)
  .filter(f => f.endsWith('.mp3'))
  .sort();

console.log(`源目录: ${SOURCE_DIR}`);
console.log(`源文件数: ${sourceFiles.length}`);
console.log(`目标目录: ${AUDIO_DIR}`);
console.log(`模式: ${dryRun ? 'DRY-RUN' : '实际复制'}`);

if (sourceFiles.length !== POEMS_META.length) {
  console.warn(`⚠️ 源文件数 ${sourceFiles.length} ≠ POEMS_META ${POEMS_META.length}`);
}

let copied = 0, skipped = 0, mismatches = 0;
const manifest = {};

// 备份旧 manifest（已有 manifest.old.json 则跳过）
const manifestPath = path.join(AUDIO_DIR, 'manifest.json');
const backupPath = path.join(AUDIO_DIR, 'manifest.old.json');
if (fs.existsSync(manifestPath) && !fs.existsSync(backupPath)) {
  fs.copyFileSync(manifestPath, backupPath);
  console.log(`✓ 备份 manifest → manifest.old.json`);
}

for (let i = 0; i < sourceFiles.length; i++) {
  const sourceFile = sourceFiles[i];
  const poem = POEMS_META[i];
  if (!poem) {
    console.log(`  ⚠️ 源文件 ${sourceFile} 没有对应 POEMS_META 诗`);
    continue;
  }

  // 源文件名提取的标题（用于比对）
  const sourceTitle = sourceFile.replace(/^\d{3}\s+/, '').replace(/\.mp3$/, '');
  const titleMatch = poem.title === sourceTitle;
  if (!titleMatch) {
    mismatches++;
    console.log(`  ⚠️ 标题差异 [${poem.id}]: POEMS_META="${poem.title}" vs 源="${sourceTitle}"`);
  }

  // 目标文件名：g{年级}-{上|下}-{序号}-{title}.mp3
  const safeTitle = poem.title.replace(/[/\\:*?"<>|]/g, '_');
  const targetName = `${poem.id}-${safeTitle}.mp3`;
  const sourcePath = path.join(SOURCE_DIR, sourceFile);
  const targetPath = path.join(AUDIO_DIR, targetName);

  if (!dryRun) {
    fs.copyFileSync(sourcePath, targetPath);
  }
  copied++;

  // 收集 manifest 条目
  const stat = fs.statSync(sourcePath);
  manifest[poem.id] = {
    file: `assets/audio/${targetName}`,
    source: '官网下载',
    sourceFile,
    bytes: stat.size,
    linkedAt: new Date().toISOString(),
  };
}

// 写新 manifest
if (!dryRun) {
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
}

console.log(`\n=== 汇总 ===`);
console.log(`复制文件: ${copied}`);
console.log(`标题差异: ${mismatches}`);
if (mismatches > 0) {
  console.log(`  → POEMS_META 是权威源，已用 POEMS_META 标题命名新文件`);
}
console.log(`新 manifest 条目: ${Object.keys(manifest).length}`);
if (!dryRun) {
  console.log(`✓ 写入: ${manifestPath}`);
}