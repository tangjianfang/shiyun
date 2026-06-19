/**
 * 诗云 · 古诗配图生成脚本（MiniMax Image Generation）
 *
 * 用途：调用 MiniMax image-01-live 模型，为 112 首古诗生成卡通/漫画风格配图，
 *       缓存为 assets/images/<id>.jpg，供后续构建嵌入学习版。
 *
 * 安全：API Key 仅从环境变量读取，绝不写入代码或仓库。
 *
 * 用法（PowerShell）：
 *   $env:MINIMAX_API_KEY = "你的key"
 *
 *   node scripts/generate-images.mjs --first     # 只生成第一首（静夜思 g1-01）用于试看
 *   node scripts/generate-images.mjs --all       # 生成全部（已存在的自动跳过）
 *   node scripts/generate-images.mjs --id=g1-05  # 生成指定某首
 *   node scripts/generate-images.mjs --grade=3   # 只生成某个年级
 *   node scripts/generate-images.mjs --all --force  # 强制重生成（覆盖已有）
 *   node scripts/generate-images.mjs --all --jobs=6 # 并发生成（6 路同时，默认全量/年级即 6）
 *
 * 可调环境变量：
 *   MINIMAX_IMAGE_MODEL         默认 image-01-live（style 画风仅此模型生效）
 *   MINIMAX_IMAGE_RATIO         默认 16:9  （可选 1:1 / 4:3 / 3:2 / 2:3 / 3:4 / 9:16）
 *   MINIMAX_IMAGE_STYLE         默认 漫画  （可选：漫画 / 元气 / 中世纪 / 水彩）
 *   MINIMAX_IMAGE_STYLE_WEIGHT  默认 0.8  （画风权重，范围 (0, 1]）
 */

import { POEMS_META } from '../src/data/poems-meta.js';
import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'assets', 'images');
const MANIFEST = path.join(OUT_DIR, 'manifest.json');
// 文本内容清单（由 generate-content.mjs 生成）：含白话译文/意象/主题，作为配图的画面依据
const CONTENT_MANIFEST = path.join(ROOT, 'assets', 'content', 'manifest.json');

// ── 从 .env 读取 ──
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
const MODEL   = process.env.MINIMAX_IMAGE_MODEL   || 'image-01-live';
const RATIO   = process.env.MINIMAX_IMAGE_RATIO   || '16:9';
// 画风（仅 image-01-live 生效）：漫画 / 元气 / 中世纪 / 水彩
const STYLE_TYPE   = process.env.MINIMAX_IMAGE_STYLE        || '漫画';
const STYLE_WEIGHT = Number(process.env.MINIMAX_IMAGE_STYLE_WEIGHT || '0.8');

const ENDPOINT = 'https://api.minimaxi.com/v1/image_generation';

// ── 终端着色 ──
const c = {
  info:  (s) => `\x1b[36m${s}\x1b[0m`,
  ok:    (s) => `\x1b[32m${s}\x1b[0m`,
  warn:  (s) => `\x1b[33m${s}\x1b[0m`,
  err:   (s) => `\x1b[31m${s}\x1b[0m`,
  dim:   (s) => `\x1b[90m${s}\x1b[0m`,
};

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * 根据诗词内容构建图像描述 Prompt
 *
 * 设计要点（针对"画面与诗意不符"的优化）：
 * 1. 优先使用白话译文（content.translation）作为画面依据——文言文对图像模型
 *    歧义大、易误读，白话场景才能让模型准确还原诗中景物、人物、动作。
 * 2. 辅以核心意象关键词（content.keywords）与情感基调（content.theme），
 *    确保主体物象与情绪氛围都对得上原诗。
 * 3. 只画"诗里写到的"，明确禁止添加通用山水/花鸟等填充元素。
 *    画风为面向儿童的卡通/漫画插画（配合 image-01-live 的 style=漫画）。
 * 4. 彻底禁止画面出现任何文字/书法/题字——图像模型无法写出准确汉字，
 *    强行题字只会产生乱码并抢占主体，使画面偏离诗意。诗句文本由学习版以
 *    HTML 另行展示，无需画进图里。
 */
function buildImagePrompt(poem, content) {
  const dynasty = poem.dynasty || '古代';
  const author  = poem.author  || '佚名';
  const title   = poem.title   || '';
  const contentJoined = (poem.content || []).join('，');

  const translation = typeof content?.translation === 'string' ? content.translation.trim() : '';
  const theme       = typeof content?.theme === 'string' ? content.theme.trim() : '';
  const keywords    = Array.isArray(content?.keywords) ? content.keywords.filter(Boolean) : [];

  // 画面依据：白话译文最准确；缺失时回退到文言原文
  const sceneLines = [];
  if (translation) {
    sceneLines.push(`【画面内容 · 按此场景如实作画】${translation}`);
    sceneLines.push(`【对应诗句（仅供参考，不要写进画面）】${contentJoined}`);
  } else {
    sceneLines.push(`【画面内容】依据古诗《${title}》原文所写的景物与场景作画：${contentJoined}`);
  }
  if (keywords.length) sceneLines.push(`【核心意象（画面应突出这些）】${keywords.join('、')}`);
  if (theme)           sceneLines.push(`【情感基调（决定光线与氛围）】${theme}`);

  return (
    `一幅面向儿童的卡通漫画风格插画，画面温馨童趣、色彩明亮柔和、线条干净。\n` +
    `\n` +
    sceneLines.join('\n') + `\n` +
    `\n` +
    `【忠实还原】严格依据上面的"画面内容"来画：文中写到的景物、人物、动作、` +
    `季节、时辰，画面里就如实呈现；文中没有提到的元素（如随意的远山、飞鸟、` +
    `松树、楼阁、舟船等）一律不要添加。构图、色调、光线与留白都要服务于这首诗` +
    `独有的意境与情绪，准确传达诗句本意。\n` +
    `\n` +
    `【画风】明快可爱的卡通插画/儿童绘本风格，造型圆润友好、轮廓清晰、` +
    `配色鲜亮温暖、光线柔和；保留${dynasty}代古典服饰与场景的韵味，` +
    `画面简洁不杂乱，适合 6-12 岁孩子阅读。\n` +
    `\n` +
    `【严格禁止】画面中不得出现任何文字、汉字、书法、题字、印章、签名、` +
    `拼音、英文、数字、水印、Logo、边框或现代物品。这是一幅纯粹的画，` +
    `画面里没有任何一个字。`
  );
}

/** 调 MiniMax Image API，返回 base64 JPEG Buffer */
async function generateImage(poem, content) {
  const prompt = buildImagePrompt(poem, content);
  const body = {
    model: MODEL,
    prompt,
    aspect_ratio: RATIO,
    response_format: 'base64',
    n: 1,
  };
  // style 画风对象仅 image-01-live 生效
  if (MODEL === 'image-01-live' && STYLE_TYPE) {
    body.style = { style_type: STYLE_TYPE };
    if (Number.isFinite(STYLE_WEIGHT) && STYLE_WEIGHT > 0 && STYLE_WEIGHT <= 1) {
      body.style.style_weight = STYLE_WEIGHT;
    }
  }

  const url = GROUP_ID ? `${ENDPOINT}?GroupId=${encodeURIComponent(GROUP_ID)}` : ENDPOINT;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} ${res.statusText} — ${text.slice(0, 400)}`);
  }

  const json = await res.json();

  // 检查 MiniMax 通用错误码
  const code = json?.base_resp?.status_code;
  if (code !== undefined && code !== 0) {
    throw new Error(`API status_code=${code} — ${json?.base_resp?.status_msg || '未知错误'}`);
  }

  // 兼容 MiniMax 图像 API 的两种响应结构：
  // 结构1: { data: { image_base64: ["..."] } }
  // 结构2: { data: [{ b64_json/base64: "..." }] }
  let b64 = null;
  if (json?.data?.image_base64?.[0]) {
    b64 = json.data.image_base64[0];
  } else {
    const imgData = json?.data?.[0] ?? json?.images?.[0];
    b64 = imgData?.base64 ?? imgData?.b64_json ?? null;
  }

  if (!b64 || typeof b64 !== 'string') {
    throw new Error(`返回缺少图像数据：${JSON.stringify(json).slice(0, 200)}`);
  }

  return Buffer.from(b64, 'base64');
}

async function loadManifest() {
  if (!existsSync(MANIFEST)) return {};
  try { return JSON.parse(await readFile(MANIFEST, 'utf-8')); }
  catch { return {}; }
}

/** 载入文本内容清单（白话译文/意象/主题），用于让配图忠实于诗意 */
async function loadContentManifest() {
  if (!existsSync(CONTENT_MANIFEST)) return {};
  try { return JSON.parse(await readFile(CONTENT_MANIFEST, 'utf-8')); }
  catch { return {}; }
}

async function saveManifest(m) {
  await writeFile(MANIFEST, JSON.stringify(m, null, 2), 'utf-8');
}

function parseArgs(argv) {
  const args = { mode: null, id: null, grade: null, force: false, jobs: null };
  for (const a of argv.slice(2)) {
    if (a === '--first') args.mode = 'first';
    else if (a === '--all') args.mode = 'all';
    else if (a === '--force') args.force = true;
    else if (a.startsWith('--id=')) { args.mode = 'id'; args.id = a.slice(5); }
    else if (a.startsWith('--grade=')) { args.mode = 'grade'; args.grade = Number(a.slice(8)); }
    else if (a.startsWith('--jobs=')) { args.jobs = Math.max(1, Math.floor(Number(a.slice(7))) || 1); }
  }
  return args;
}

function selectPoems(args) {
  if (args.mode === 'first') return POEMS_META.slice(0, 1);
  if (args.mode === 'id') {
    const p = POEMS_META.find((x) => x.id === args.id);
    return p ? [p] : [];
  }
  if (args.mode === 'grade') return POEMS_META.filter((x) => x.grade === args.grade);
  if (args.mode === 'all') return POEMS_META;
  return [];
}

async function main() {
  const args = parseArgs(process.argv);
  if (!args.mode) {
    console.log(c.warn('请指定模式：--first | --all | --id=g1-05 | --grade=3  （可加 --force 覆盖、--jobs=6 并发）'));
    process.exit(1);
  }
  if (!API_KEY) {
    console.log(c.err('未设置 MINIMAX_API_KEY 环境变量。'));
    console.log(c.dim('PowerShell:  $env:MINIMAX_API_KEY = "你的key"'));
    console.log(c.dim('或在 .env 文件写入：MINIMAX_API_KEY=你的key'));
    process.exit(1);
  }

  const poems = selectPoems(args);
  if (poems.length === 0) {
    console.log(c.err(`未找到匹配的诗（id=${args.id ?? ''}）`));
    process.exit(1);
  }

  console.log(c.info(`诗云 · 配图生成（MiniMax ${MODEL}）`));

  await mkdir(OUT_DIR, { recursive: true });
  const manifest = await loadManifest();
  const contentManifest = await loadContentManifest();
  if (Object.keys(contentManifest).length === 0) {
    console.log(c.warn('  未找到文本内容清单 assets/content/manifest.json，将回退到文言原文作画。'));
    console.log(c.dim('  建议先运行：node scripts/generate-content.mjs --all（生成白话译文与意象，配图更贴合诗意）\n'));
  }

  const total = poems.length;
  // 并发路数：试看/单首固定 1；--all / --grade 默认 6（可用 --jobs 覆盖）
  const defaultJobs = (args.mode === 'first' || args.mode === 'id') ? 1 : 6;
  const jobs = Math.max(1, Math.min(args.jobs || defaultJobs, total));

  console.log(c.dim(`  模型=${MODEL}  比例=${RATIO}  画风=${MODEL === 'image-01-live' ? `${STYLE_TYPE}(${STYLE_WEIGHT})` : '默认'}  数量=${total}  并发=${jobs}\n`));

  let ok = 0, skip = 0, fail = 0;
  let nextIndex = 0;

  // 串行化 manifest 写盘：并发任务共用同一文件，必须排队写，避免互相覆盖损坏
  let saveChain = Promise.resolve();
  function queueSave() {
    saveChain = saveChain.then(() => saveManifest(manifest)).catch(() => {});
    return saveChain;
  }

  async function worker(workerId) {
    // 错峰启动，避免 N 路请求在同一瞬间打到接口触发限流
    await sleep(workerId * 400);
    while (true) {
      const i = nextIndex++;
      if (i >= total) break;
      const poem = poems[i];
      const outFile = path.join(OUT_DIR, `${poem.id}.jpg`);
      const label = `[${i + 1}/${total}] ${poem.id} 《${poem.title}》`;

      if (!args.force && manifest[poem.id] && existsSync(outFile)) {
        process.stdout.write(c.dim(`  跳过 ${label}\n`));
        skip++;
        continue;
      }

      let attempt = 0;
      let buf = null;
      while (attempt < 5) {
        try {
          buf = await generateImage(poem, contentManifest[poem.id]);
          break;
        } catch (e) {
          attempt++;
          const msg = e.message || '';
          if (attempt >= 5) {
            process.stdout.write(c.err(`  失败 ${label}（${msg.slice(0, 80)}）\n`));
            fail++;
            buf = null;
            break;
          }
          const wait = attempt === 1 ? 10 : attempt * 8;
          process.stdout.write(c.warn(`  重试 ${label}（${msg.slice(0, 50)}），${wait}s 后第 ${attempt + 1} 次...\n`));
          await sleep(wait * 1000);
        }
      }

      if (!buf) continue;

      await writeFile(outFile, buf);
      const kb = Math.round(buf.length / 1024);
      manifest[poem.id] = {
        file: `assets/images/${poem.id}.jpg`,
        model: MODEL,
        ratio: RATIO,
        bytes: buf.length,
        generatedAt: new Date().toISOString(),
      };
      await queueSave();
      process.stdout.write(c.ok(`  完成 ${label} ${kb}KB\n`));
      ok++;
    }
  }

  await Promise.all(Array.from({ length: jobs }, (_, k) => worker(k)));
  await saveChain;

  console.log('');
  console.log(c.ok(`完成：成功 ${ok}，跳过 ${skip}，失败 ${fail}`));
  if (ok > 0) {
    console.log(c.dim(`  图片目录：assets/images/  ·  清单：assets/images/manifest.json`));
    if (args.mode === 'first') {
      console.log(c.dim(`\n▶ 请查看确认：assets/images/${poems[0].id}.jpg`));
      console.log(c.dim(`  满意后运行：node scripts/generate-images.mjs --all`));
    }
  }
}

main().catch((e) => {
  console.error(c.err(`\n致命错误：${e.message}`));
  process.exit(1);
});
