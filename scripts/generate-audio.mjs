/**
 * 诗云 · 古诗音频生成脚本（MiniMax T2A）
 *
 * 用途：调用 MiniMax 同步语音合成 API，为部编版 112 首古诗生成朗读音频，
 *       并缓存为本地 mp3 文件（assets/audio/<id>.mp3），供后续构建嵌入学习版。
 *
 * 安全：API Key 仅从环境变量读取，绝不写入代码或仓库。
 *
 * 用法（PowerShell）：
 *   $env:MINIMAX_API_KEY = "你的key"          # 必填
 *   $env:MINIMAX_GROUP_ID = "你的GroupId"      # 可选（部分账号需要）
 *
 *   node scripts/generate-audio.mjs --first    # 只生成第一首（静夜思 g1-01）用于试听确认
 *   node scripts/generate-audio.mjs --all      # 生成全部（已存在的自动跳过）
 *   node scripts/generate-audio.mjs --id=g1-05 # 生成指定某首
 *   node scripts/generate-audio.mjs --all --force  # 强制重生成（覆盖已有缓存）
 *
 * 可调环境变量：
 *   MINIMAX_MODEL  默认 speech-2.6-hd（可选 speech-2.8-hd / speech-2.6-turbo 等）
 *   MINIMAX_VOICE  默认 male-qn-qingse（系统音色 ID）
 *   MINIMAX_SPEED  默认 0.9（朗读语速，0.5~2）
 */

import { POEMS_META } from '../src/data/poems-meta.js';
import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'assets', 'audio');
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
const MODEL  = process.env.MINIMAX_MODEL       || 'speech-2.8-hd';
const VOICE  = process.env.MINIMAX_VOICE       || 'male-qn-qingse';
const SPEED  = Number(process.env.MINIMAX_SPEED  || '0.9');   // 0.5-2.0
const VOL    = Number(process.env.MINIMAX_VOL    || '1.0');   // 0-10，默认1
const PITCH  = Number(process.env.MINIMAX_PITCH  || '0');     // -12~12 半音
const SAMPLE = Number(process.env.MINIMAX_SAMPLE_RATE || '32000'); // 16000/22050/24000/32000/44100
const BITRATE= Number(process.env.MINIMAX_BITRATE     || '128000');// 32000/64000/128000/256000
const ENDPOINT = 'https://api.minimaxi.com/v1/t2a_v2';

// ── 终端着色 ──
const c = {
  info: (s) => `\x1b[36m${s}\x1b[0m`,
  ok: (s) => `\x1b[32m${s}\x1b[0m`,
  warn: (s) => `\x1b[33m${s}\x1b[0m`,
  err: (s) => `\x1b[31m${s}\x1b[0m`,
  dim: (s) => `\x1b[90m${s}\x1b[0m`,
};

function buildReadingText(poem) {
  const lines = (poem.content || []).filter((l) => typeof l === 'string' && l.trim());
  // 标题 + 正文逐句，给出适度停顿的朗读文本
  return `${poem.title}。${lines.join('，')}。`;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/** 调 MiniMax T2A，返回 mp3 的 Buffer */
async function synthesize(poem) {
  const body = {
    model: MODEL,
    text: buildReadingText(poem),
    stream: false,
    voice_setting: { voice_id: VOICE, speed: SPEED, vol: VOL, pitch: PITCH },
    audio_setting: { sample_rate: SAMPLE, bitrate: BITRATE, format: 'mp3', channel: 1 },
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
  if (code !== 0) {
    throw new Error(`API status_code=${code} — ${json?.base_resp?.status_msg || '未知错误'}`);
  }
  const hex = json?.data?.audio;
  if (!hex || typeof hex !== 'string') {
    throw new Error('返回数据缺少 data.audio（hex）');
  }
  const buf = Buffer.from(hex, 'hex');
  const info = json.extra_info || {};
  return { buf, info };
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
    console.log(c.warn('请指定模式：--first | --all | --id=g1-05  （可加 --force 覆盖）'));
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

  console.log(c.info('诗云 · 音频生成（MiniMax T2A）'));
  console.log(c.info(`  模型=${MODEL}  音色=${VOICE}  语速=${SPEED}  音量=${VOL}  音调=${PITCH}  采样率=${SAMPLE}  码率=${BITRATE}  数量=${poems.length}`));
  console.log('');

  let ok = 0, skip = 0;
  let failed = []; // 失败的诗，存 {poem, outFile, tag}

  // ── 单首生成（带重试）──
  async function generateOne(poem, outFile, tag, attempt = 1) {
    const MAX_ATTEMPTS = 5;
    try {
      process.stdout.write(`  生成 ${tag}${attempt > 1 ? c.warn(` [第${attempt}次]`) : ''} ... `);
      const { buf, info } = await synthesize(poem);
      await writeFile(outFile, buf);
      manifest[poem.id] = {
        file: path.relative(ROOT, outFile).replace(/\\/g, '/'),
        model: MODEL, voice: VOICE, speed: SPEED, vol: VOL, pitch: PITCH,
        sampleRate: SAMPLE, bitrate: BITRATE,
        bytes: buf.length,
        durationMs: info.audio_length ?? null,
        generatedAt: new Date().toISOString(),
      };
      await saveManifest(manifest);
      const sec = info.audio_length ? `${(info.audio_length / 1000).toFixed(1)}s` : '';
      console.log(c.ok(`完成 ${(buf.length / 1024).toFixed(0)}KB ${sec}`));
      return true;
    } catch (e) {
      const isRateLimit = /1002|1039|429|rate.?limit/i.test(e.message);
      if (attempt < MAX_ATTEMPTS) {
        // 指数退避：限流等更久，其他错误也等
        const waitSec = isRateLimit
          ? Math.min(60, 10 * attempt)   // 10s / 20s / 30s / 40s
          : Math.min(30, 5 * attempt);   // 5s / 10s / 15s
        console.log(c.warn(`失败（${e.message.slice(0, 60)}），${waitSec}s 后重试...`));
        await sleep(waitSec * 1000);
        return generateOne(poem, outFile, tag, attempt + 1);
      }
      console.log(c.err(`失败（已重试 ${MAX_ATTEMPTS} 次）：${e.message.slice(0, 80)}`));
      return false;
    }
  }

  for (let i = 0; i < poems.length; i++) {
    const poem = poems[i];
    const safeName = [poem.title, poem.dynasty, poem.author]
      .filter(Boolean).join('-').replace(/[\\/:*?"<>|]/g, '_');
    const outFile = path.join(OUT_DIR, `${poem.id}-${safeName}.mp3`);
    const tag = `[${i + 1}/${poems.length}] ${poem.id} 《${poem.title}》`;

    if (!args.force && existsSync(outFile)) {
      console.log(c.dim(`  跳过 ${tag}（已存在）`));
      skip++;
      continue;
    }

    const success = await generateOne(poem, outFile, tag);
    if (success) {
      ok++;
    } else {
      failed.push({ poem, outFile, tag: `[重试] ${poem.id} 《${poem.title}》` });
    }
    // 请求间隔 1.2s（最多 ~50 RPM，低于 API 限额）
    if (i < poems.length - 1) await sleep(1200);
  }

  // ── 多轮重跑失败项 ──
  const MAX_ROUNDS = 3;
  for (let round = 1; round <= MAX_ROUNDS && failed.length > 0; round++) {
    console.log('');
    console.log(c.warn(`⟳ 第 ${round} 轮补跑：共 ${failed.length} 首未完成，等待 15s 让限流恢复...`));
    await sleep(15000);
    const retry = [...failed];
    failed = [];
    for (let i = 0; i < retry.length; i++) {
      const { poem, outFile, tag } = retry[i];
      const success = await generateOne(poem, outFile, tag);
      if (success) ok++; else failed.push({ poem, outFile, tag });
      if (i < retry.length - 1) await sleep(1500);
    }
  }

  console.log('');
  console.log(c.info(`完成：成功 ${ok} · 跳过 ${skip} · 最终失败 ${failed.length}`));
  if (failed.length > 0) {
    console.log(c.warn(`未完成的诗：`));
    failed.forEach(({ poem }) => console.log(c.warn(`  ${poem.id} 《${poem.title}》`)));
    console.log(c.dim(`手动补跑：node scripts/generate-audio.mjs --id=<id> --force`));
  }
  console.log(c.dim(`  缓存目录：assets/audio/  ·  清单：assets/audio/manifest.json`));
  if (args.mode === 'first' && ok > 0) {
    console.log('');
    console.log(c.ok('▶ 请试听确认：assets/audio/ 目录下 g1-01-*.mp3'));
    console.log(c.dim('  满意后运行：node scripts/generate-audio.mjs --all'));
  }
}

main().catch((e) => {
  console.error(c.err('脚本异常：'), e);
  process.exit(1);
});
