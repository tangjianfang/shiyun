/**
 * 一致性测试：src/data/小学生必备古诗词112首-2019年11月第1版.txt
 *                          vs
 *                  src/data/poems-meta.js
 *
 * 解析 .txt 得到「真实教材期望」，再与代码中的 POEMS_META 逐首对比。
 * 任何不匹配都视为实现 bug（因为 .txt 是用户要求的数据源）。
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { POEMS_META } from '../src/data/poems-meta.js';

const TXT_PATH = path.join('src', 'data', '小学生必备古诗词112首-2019年11月第1版.txt');

/** 解析 .txt → 按 (年级, 学期, 序号) 索引的诗列表 */
function parseTxt() {
  const raw = fs.readFileSync(TXT_PATH, 'utf8');
  const CN = { '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6 };
  const out = [];
  let grade = 0, sem = '';
  let seq = 0; // 每学期从 1 重新计
  const lines = raw.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    // 年级 + 上下册
    const semMatch = trimmed.match(/^([一二三四五六])年级(上|下)册$/);
    if (semMatch) {
      grade = CN[semMatch[1]];
      sem = semMatch[2];
      seq = 0;
      continue;
    }
    // 跳过目录前后的非诗行
    if (!/^\d+\./.test(trimmed)) continue;
    seq += 1;
    // 标题（去序号）
    const noPrefix = trimmed.replace(/^\d+\.\s*/, '');
    // 解析：标题 【朝代】作者  或  标题 朝代/乐府/民歌/佚名
    // 1) 标题 【朝代】作者  (允许标题与【之间无空格，如「古朗月行（节选）【唐】李白」)
    const m1 = noPrefix.match(/^(.+?)【(.+?)】\s*(.+)$/);
    if (m1) {
      out.push({
        grade, semester: sem, sequence: seq,
        title: m1[1].trim(), dynasty: m1[2].trim(), author: m1[3].trim(),
      });
      continue;
    }
    // 2) 标题 汉乐府 / 北朝民歌 / 佚名 / 《古诗十九首》 / 《诗经》 (允许无空格)
    const m2 = noPrefix.match(/^(.+?)\s*((?:汉|北朝)?(?:乐府|民歌)|佚名|《[^》]+》)$/);
    if (m2) {
      const tail = m2[2];
      let author = tail, dynasty = '';
      if (tail === '佚名') {
        author = '佚名';
        dynasty = '';
      } else if (tail === '汉乐府') {
        author = '佚名'; dynasty = '汉';
      } else if (tail === '北朝民歌') {
        author = '佚名'; dynasty = '南北朝';
      } else if (/^《/.test(tail)) {
        // 《古诗十九首》《诗经》— 无作者
        author = '佚名';
        dynasty = tail.replace(/[《》]/g, '');
      }
      out.push({
        grade, semester: sem, sequence: seq,
        title: m2[1].trim(), dynasty, author,
      });
      continue;
    }
    // 3) 未匹配 — 报错便于调试
    throw new Error(`无法解析行: "${trimmed}"`);
  }
  return out;
}

const TXT_POEMS = parseTxt();

describe('TXT ↔ poems-meta 基础对齐', () => {
  it('TXT 应解析得到 112 首诗', () => {
    expect(TXT_POEMS.length).toBe(112);
  });

  it('POEMS_META 数量应与 TXT 一致', () => {
    expect(POEMS_META.length).toBe(TXT_POEMS.length);
  });

  it('12 个学期分布应与 TXT 一致', () => {
    const expected = { '1上': 6, '1下': 7, '2上': 7, '2下': 7, '3上': 9, '3下': 9, '4上': 9, '4下': 10, '5上': 11, '5下': 11, '6上': 9, '6下': 17 };
    for (const k of Object.keys(expected)) {
      const [g, s] = k.split('');
      const actual = POEMS_META.filter(p => p.grade === +g && p.semester === (s === '上' ? '上' : '下')).length;
      expect(actual, `${k} 年级`).toBe(expected[k]);
    }
  });
});

describe('TXT ↔ poems-meta 字段对比', () => {
  // 建立 (grade, sem, seq) → POEMS_META 项 的索引
  const byKey = new Map();
  for (const p of POEMS_META) {
    byKey.set(`${p.grade}-${p.semester}-${String(p.sequence).padStart(2, '0')}`, p);
  }
  // 建立同样索引供 TXT
  const txtByKey = new Map();
  for (const t of TXT_POEMS) {
    txtByKey.set(`${t.grade}-${t.semester}-${String(t.sequence).padStart(2, '0')}`, t);
  }

  const allKeys = [...new Set([...byKey.keys(), ...txtByKey.keys()])].sort();

  const diffs = [];
  for (const k of allKeys) {
    const impl = byKey.get(k);
    const txt  = txtByKey.get(k);
    if (!impl) { diffs.push({ k, type: 'missing-in-impl', txt }); continue; }
    if (!txt)  { diffs.push({ k, type: 'missing-in-txt',  impl }); continue; }
    // 标题对比
    if (impl.title !== txt.title) diffs.push({ k, type: 'title-mismatch', impl: impl.title, txt: txt.title });
    // 作者对比
    if (impl.author !== txt.author) diffs.push({ k, type: 'author-mismatch', impl: impl.author, txt: txt.author, implTitle: impl.title, txtTitle: txt.title });
    // 朝代对比（空字符串视为等价缺失）
    if ((impl.dynasty || '') !== (txt.dynasty || '')) diffs.push({ k, type: 'dynasty-mismatch', impl: impl.dynasty, txt: txt.dynasty, implTitle: impl.title });
  }

  // 打印所有差异便于人眼审阅
  it(`检测到 ${diffs.length} 处差异`, () => {
    if (diffs.length > 0) {
      console.log('=== TXT vs poems-meta 差异清单 ===');
      for (const d of diffs) console.log(JSON.stringify(d));
    }
    expect(diffs).toEqual([]);
  });
});

describe('TXT ↔ poems-meta 抽样关键诗', () => {
  it('g1-上-01 咏鹅 骆宾王 唐', () => {
    const p = POEMS_META.find(x => x.id === 'g1-上-01');
    expect(p.title).toBe('咏鹅');
    expect(p.author).toBe('骆宾王');
    expect(p.dynasty).toBe('唐');
  });

  it('g1-下-03 静夜思 李白 唐', () => {
    const p = POEMS_META.find(x => x.id === 'g1-下-03');
    expect(p.title).toBe('静夜思');
    expect(p.author).toBe('李白');
    expect(p.dynasty).toBe('唐');
  });

  it('g2-上-07 敕勒歌 北朝民歌 南北朝', () => {
    const p = POEMS_META.find(x => x.id === 'g2-上-07');
    expect(p.title).toBe('敕勒歌');
    expect(p.author).toBe('佚名');
    expect(p.dynasty).toBe('南北朝');
  });

  it('g1-上-02 江南 汉乐府 汉', () => {
    const p = POEMS_META.find(x => x.id === 'g1-上-02');
    expect(p.title).toBe('江南');
    expect(p.author).toBe('佚名');
    expect(p.dynasty).toBe('汉');
  });

  it('g1-上-03 画 佚名 (无朝代)', () => {
    const p = POEMS_META.find(x => x.id === 'g1-上-03');
    expect(p.title).toBe('画');
    expect(p.author).toBe('佚名');
    expect(p.dynasty).toBe('');
  });

  it('g6-下-02 迢迢牵牛星 古诗十九首', () => {
    const p = POEMS_META.find(x => x.id === 'g6-下-02');
    expect(p.title).toBe('迢迢牵牛星');
    expect(p.author).toBe('佚名');
    expect(p.dynasty).toBe('古诗十九首'); // 保留 .txt 原貌
  });

  it('g6-下-08 采薇（节选） 诗经', () => {
    const p = POEMS_META.find(x => x.id === 'g6-下-08');
    expect(p.title).toBe('采薇（节选）');
    expect(p.author).toBe('佚名');
    expect(p.dynasty).toBe('诗经');
  });

  it('g6-下-17 清平乐 黄庭坚 宋', () => {
    const p = POEMS_META.find(x => x.id === 'g6-下-17');
    expect(p.title).toBe('清平乐');
    expect(p.author).toBe('黄庭坚');
    expect(p.dynasty).toBe('宋');
  });

  it('g4-下-10 墨梅 王冕 元（4 年级下册第 10 首）', () => {
    const p = POEMS_META.find(x => x.id === 'g4-下-10');
    expect(p.title).toBe('墨梅');
    expect(p.author).toBe('王冕');
    expect(p.dynasty).toBe('元');
  });

  it('g5-上-11 观书有感（其二）朱熹 宋', () => {
    const p = POEMS_META.find(x => x.id === 'g5-上-11');
    expect(p.title).toBe('观书有感（其二）');
    expect(p.author).toBe('朱熹');
    expect(p.dynasty).toBe('宋');
  });
});