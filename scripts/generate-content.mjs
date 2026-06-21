/**
 * 诗云 · 古诗文本内容生成脚本（MiniMax Chat / chatcompletion_v2）
 *
 * 用途：调用 MiniMax 文本大模型，为部编版 112 首古诗生成
 *       创作背景 / 白话翻译 / 字词注释 / 主题思想 / 联想关键词，
 *       缓存为 assets/content/manifest.json，供构建脚本合并进学习版。
 *
 * 安全：API Key 仅从环境变量 / .env 读取，绝不写入代码或仓库。
 *
 * 用法（PowerShell）：
 *   $env:MINIMAX_API_KEY = "你的key"
 *   node scripts/generate-content.mjs --first       # 只生成第一首试看
 *   node scripts/generate-content.mjs --all         # 生成全部（已存在自动跳过）
 *   node scripts/generate-content.mjs --id=g1-上-05    # 生成指定某首（古朗月行节选）
 *   node scripts/generate-content.mjs --all --force # 强制重生成
 *
 * 可调环境变量：
 *   MINIMAX_TEXT_MODEL  默认 MiniMax-Text-01
 */

import { POEMS_META } from '../src/data/poems-meta.js';
import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'assets', 'content');
const MANIFEST = path.join(OUT_DIR, 'manifest.json');

// ── 从 .env 读取（仅在环境变量未设置时填充；.env 已被 gitignore）──
(function loadDotEnv() {
  const envPath = path.join(ROOT, '.env');
  if (!existsSync(envPath)) return;
  for (const raw of readFileSync(envPath, 'utf-8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
})();

const API_KEY = process.env.MINIMAX_API_KEY;
const GROUP_ID = process.env.MINIMAX_GROUP_ID || '';
const MODEL = process.env.MINIMAX_TEXT_MODEL || 'MiniMax-Text-01';
const ENDPOINT = 'https://api.minimaxi.com/v1/text/chatcompletion_v2';

// ── 终端着色 ──
const c = {
  info: (s) => `\x1b[36m${s}\x1b[0m`,
  ok: (s) => `\x1b[32m${s}\x1b[0m`,
  warn: (s) => `\x1b[33m${s}\x1b[0m`,
  err: (s) => `\x1b[31m${s}\x1b[0m`,
  dim: (s) => `\x1b[90m${s}\x1b[0m`,
};

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

const SYSTEM_PROMPT =
  '你是小学语文古诗词教学专家，面向 6-12 岁孩子。' +
  '请用准确、亲切、易懂的语言解读古诗，避免生僻术语。' +
  '只输出 JSON，不要任何额外说明文字或代码块标记。';

function buildUserPrompt(poem) {
  const body = (poem.content || []).join('，');
  return (
    `请为下面这首古诗生成学习资料，严格输出 JSON 对象，字段如下：\n` +
    `{\n` +
    `  "background": "创作背景，2-3 句，讲清作者写诗时的情境，适合小学生阅读",\n` +
    `  "translation": "整首诗的白话文翻译，连贯通顺，一段话",\n` +
    `  "annotations": { "字或词": "简明解释", "...": "..." },  // 3-6 个关键字词\n` +
    `  "theme": "主题思想/情感，1-2 句",\n` +
    `  "keywords": ["意象或联想关键词", "..."]  // 5-8 个，体现诗中意象与情感\n` +
    `}\n\n` +
    `诗题：《${poem.title}》\n` +
    `作者：${poem.dynasty}·${poem.author}\n` +
    `正文：${body}\n`
  );
}

/** 从模型返回文本中尽力提取 JSON 对象 */
function extractJson(text) {
  if (!text) return null;
  let s = text.trim();
  // 去除可能的 ```json ``` 包裹
  s = s.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  const start = s.indexOf('{');
  const end = s.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  const slice = s.slice(start, end + 1);
  try {
    return JSON.parse(slice);
  } catch {
    return null;
  }
}

function normalizeContent(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const out = {};
  out.background = typeof raw.background === 'string' ? raw.background.trim() : '';
  out.translation = typeof raw.translation === 'string' ? raw.translation.trim() : '';
  out.theme = typeof raw.theme === 'string' ? raw.theme.trim() : '';

  // annotations: 对象 {词: 释义}
  out.annotations = {};
  if (raw.annotations && typeof raw.annotations === 'object' && !Array.isArray(raw.annotations)) {
    for (const [k, v] of Object.entries(raw.annotations)) {
      if (k && typeof v === 'string' && v.trim()) out.annotations[String(k).trim()] = v.trim();
    }
  }

  // keywords: 字符串数组
  out.keywords = [];
  if (Array.isArray(raw.keywords)) {
    out.keywords = raw.keywords
      .map((x) => (typeof x === 'string' ? x.trim() : ''))
      .filter(Boolean)
      .slice(0, 10);
  }

  // 至少要有背景或翻译才算成功
  if (!out.background && !out.translation) return null;
  return out;
}

/** 调 MiniMax Chat，返回规范化内容对象 */
async function generate(poem) {
  const body = {
    model: MODEL,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: buildUserPrompt(poem) },
    ],
    temperature: 0.6,
    max_tokens: 2048,
  };
  const url = GROUP_ID ? `${ENDPOINT}?GroupId=${encodeURIComponent(GROUP_ID)}` : ENDPOINT;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} ${res.statusText} — ${text.slice(0, 300)}`);
  }

  const json = await res.json();
  const code = json?.base_resp?.status_code;
  if (code !== undefined && code !== 0) {
    throw new Error(`API status_code=${code} — ${json?.base_resp?.status_msg || '未知错误'}`);
  }
  const content = json?.choices?.[0]?.message?.content;
  if (!content || typeof content !== 'string') {
    throw new Error('返回数据缺少 choices[0].message.content');
  }
  const parsed = normalizeContent(extractJson(content));
  if (!parsed) {
    throw new Error(`无法解析为有效内容：${content.slice(0, 120)}`);
  }
  return parsed;
}

async function loadManifest() {
  if (!existsSync(MANIFEST)) return {};
  try {
    return JSON.parse(await readFile(MANIFEST, 'utf-8'));
  } catch {
    return {};
  }
}

async function saveManifest(manifest) {
  await writeFile(MANIFEST, JSON.stringify(manifest, null, 2), 'utf-8');
}

function parseArgs(argv) {
  const args = { mode: null, id: null, force: false };
  for (const a of argv.slice(2)) {
    if (a === '--first') args.mode = 'first';
    else if (a === '--all') args.mode = 'all';
    else if (a === '--force') args.force = true;
    else if (a.startsWith('--id=')) {
      args.mode = 'id';
      args.id = a.slice('--id='.length);
    }
  }
  return args;
}

function selectPoems(args) {
  if (args.mode === 'first') return POEMS_META.slice(0, 1);
  if (args.mode === 'id') {
    const p = POEMS_META.find((x) => x.id === args.id);
    return p ? [p] : [];
  }
  if (args.mode === 'all') return POEMS_META;
  return [];
}

async function main() {
  const args = parseArgs(process.argv);

  if (!args.mode) {
    console.log(c.warn('请指定模式：--first | --all | --id=g1-上-05  （可加 --force 覆盖）'));
    process.exit(1);
  }
  if (!API_KEY) {
    console.log(c.err('未设置 MINIMAX_API_KEY 环境变量。'));
    console.log(c.dim('PowerShell:  $env:MINIMAX_API_KEY = "你的key"'));
    console.log(c.dim('或在项目根目录新建 .env 文件，写入：MINIMAX_API_KEY=你的key'));
    process.exit(1);
  }

  const poems = selectPoems(args);
  if (poems.length === 0) {
    console.log(c.err(`未找到匹配的诗（id=${args.id ?? ''}）`));
    process.exit(1);
  }

  await mkdir(OUT_DIR, { recursive: true });
  const manifest = await loadManifest();

  console.log(c.info('诗云 · 文本内容生成（MiniMax Chat）'));
  console.log(c.info(`  模型=${MODEL}  数量=${poems.length}`));
  console.log('');

  let ok = 0, skip = 0;
  const failed = [];

  async function generateOne(poem, tag, attempt = 1) {
    const MAX_ATTEMPTS = 5;
    try {
      process.stdout.write(`  生成 ${tag}${attempt > 1 ? c.warn(` [第${attempt}次]`) : ''} ... `);
      const content = await generate(poem);
      manifest[poem.id] = {
        ...content,
        model: MODEL,
        generatedAt: new Date().toISOString(),
      };
      await saveManifest(manifest);
      console.log(c.ok(`完成（关键词 ${content.keywords.length}，注释 ${Object.keys(content.annotations).length}）`));
      return true;
    } catch (e) {
      const isRateLimit = /1002|1039|429|rate.?limit/i.test(e.message);
      if (attempt < MAX_ATTEMPTS) {
        const waitSec = isRateLimit ? Math.min(60, 10 * attempt) : Math.min(30, 5 * attempt);
        console.log(c.warn(`失败（${e.message.slice(0, 60)}），${waitSec}s 后重试...`));
        await sleep(waitSec * 1000);
        return generateOne(poem, tag, attempt + 1);
      }
      console.log(c.err(`失败（已重试 ${MAX_ATTEMPTS} 次）：${e.message.slice(0, 80)}`));
      return false;
    }
  }

  for (let i = 0; i < poems.length; i++) {
    const poem = poems[i];
    const tag = `[${i + 1}/${poems.length}] ${poem.id} 《${poem.title}》`;

    if (!args.force && manifest[poem.id] && manifest[poem.id].background) {
      console.log(`  跳过 ${tag} ${c.dim('（已存在）')}`);
      skip++;
      continue;
    }

    const success = await generateOne(poem, tag);
    if (success) ok++;
    else failed.push(tag);

    // 轻微节流，避免触发限流
    if (i < poems.length - 1) await sleep(600);
  }

  console.log('');
  console.log(c.info(`完成：成功 ${ok}，跳过 ${skip}，失败 ${failed.length}`));
  if (failed.length) {
    console.log(c.warn('失败列表：'));
    failed.forEach((t) => console.log('  ' + t));
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(c.err('未捕获错误：'), e);
  process.exit(1);
});
