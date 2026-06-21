import { describe, it, expect } from 'vitest';
import {
  POEMS_META,
  GRADES,
  SEMESTERS,
  GRADE_COUNTS,
  getPoemsByGrade,
  getPoemsBySemester,
  getPoemsByDynasty,
  getPoemsByAuthor,
  searchPoems,
  getAllDynasties,
  getAllAuthors,
} from '../src/data/poems-meta.js';
import { POEMS_CONTENT, mergeContent } from '../src/data/poems-content.js';

describe('poems-meta 数据完整性（基于真实教材 .txt）', () => {
  it('应包含完整的 112 首', () => {
    expect(POEMS_META.length).toBe(112);
  });

  it('每首诗应有所有必需字段', () => {
    const required = ['id', 'title', 'author', 'grade', 'semester', 'sequence', 'globalSequence', 'content', 'source'];
    POEMS_META.forEach(poem => {
      required.forEach(field => {
        expect(poem, `诗 ${poem.id || poem.title} 缺少 ${field}`).toHaveProperty(field);
      });
    });
  });

  it('id 应唯一', () => {
    const ids = POEMS_META.map(p => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('id 格式应为 g{1-6}-{上|下}-{01-NN}（含中文学期）', () => {
    POEMS_META.forEach(poem => {
      expect(poem.id, poem.id).toMatch(/^g[1-6]-(上|下)-\d{2}$/);
    });
  });

  it('grade 应在 1-6 之间', () => {
    POEMS_META.forEach(poem => {
      expect(poem.grade).toBeGreaterThanOrEqual(1);
      expect(poem.grade).toBeLessThanOrEqual(6);
    });
  });

  it('semester 应为 上 或 下', () => {
    POEMS_META.forEach(poem => {
      expect(['上', '下']).toContain(poem.semester);
    });
  });

  it('globalSequence 应在 1-112 唯一连续', () => {
    const seqs = POEMS_META.map(p => p.globalSequence);
    expect(seqs.length).toBe(112);
    expect(new Set(seqs).size).toBe(seqs.length);
    expect(Math.min(...seqs)).toBe(1);
    expect(Math.max(...seqs)).toBe(112);
  });

  it('content 应为非空字符串数组', () => {
    POEMS_META.forEach(poem => {
      expect(Array.isArray(poem.content)).toBe(true);
      expect(poem.content.length).toBeGreaterThan(0);
      poem.content.forEach(line => {
        expect(typeof line).toBe('string');
        expect(line.length).toBeGreaterThan(0);
      });
    });
  });
});

describe('poems-meta 各年级数量（与 .txt 一致）', () => {
  it('1 年级应有 13 首（6 上 + 7 下）', () => {
    expect(getPoemsByGrade(1).length).toBe(13);
  });

  it('2 年级应有 14 首（7 + 7）', () => {
    expect(getPoemsByGrade(2).length).toBe(14);
  });

  it('3 年级应有 18 首（9 + 9）', () => {
    expect(getPoemsByGrade(3).length).toBe(18);
  });

  it('4 年级应有 19 首（9 上 + 10 下）', () => {
    expect(getPoemsByGrade(4).length).toBe(19);
  });

  it('5 年级应有 22 首（11 上 + 11 下）', () => {
    expect(getPoemsByGrade(5).length).toBe(22);
  });

  it('6 年级应有 26 首（9 上 + 17 下）', () => {
    expect(getPoemsByGrade(6).length).toBe(26);
  });

  it('总年级分布应为 13+14+18+19+22+26=112', () => {
    const total = GRADES.reduce((sum, g) => sum + getPoemsByGrade(g).length, 0);
    expect(total).toBe(112);
  });
});

describe('poems-meta 12 个学期分布（与 .txt 一致）', () => {
  it('1 年级 上册 6 首', () => {
    expect(getPoemsBySemester(1, '上').length).toBe(6);
  });
  it('1 年级 下册 7 首', () => {
    expect(getPoemsBySemester(1, '下').length).toBe(7);
  });
  it('2 年级 上册 7 首', () => {
    expect(getPoemsBySemester(2, '上').length).toBe(7);
  });
  it('2 年级 下册 7 首', () => {
    expect(getPoemsBySemester(2, '下').length).toBe(7);
  });
  it('3 年级 上册 9 首', () => {
    expect(getPoemsBySemester(3, '上').length).toBe(9);
  });
  it('3 年级 下册 9 首', () => {
    expect(getPoemsBySemester(3, '下').length).toBe(9);
  });
  it('4 年级 上册 9 首', () => {
    expect(getPoemsBySemester(4, '上').length).toBe(9);
  });
  it('4 年级 下册 10 首', () => {
    expect(getPoemsBySemester(4, '下').length).toBe(10);
  });
  it('5 年级 上册 11 首', () => {
    expect(getPoemsBySemester(5, '上').length).toBe(11);
  });
  it('5 年级 下册 11 首', () => {
    expect(getPoemsBySemester(5, '下').length).toBe(11);
  });
  it('6 年级 上册 9 首', () => {
    expect(getPoemsBySemester(6, '上').length).toBe(9);
  });
  it('6 年级 下册 17 首', () => {
    expect(getPoemsBySemester(6, '下').length).toBe(17);
  });
  it('12 个学期总数 = 112', () => {
    let total = 0;
    for (const g of GRADES) for (const s of SEMESTERS) total += getPoemsBySemester(g, s).length;
    expect(total).toBe(112);
  });
});

describe('poems-meta 已知诗 ID 正确（从 .txt 验证）', () => {
  it('g1-上-01 应为 咏鹅（骆宾王）', () => {
    const poem = POEMS_META.find(p => p.id === 'g1-上-01');
    expect(poem.title).toBe('咏鹅');
    expect(poem.author).toBe('骆宾王');
    expect(poem.grade).toBe(1);
    expect(poem.semester).toBe('上');
  });

  it('g1-下-03 应为 静夜思（李白）— 1 年级下册第 3 首', () => {
    const poem = POEMS_META.find(p => p.id === 'g1-下-03');
    expect(poem.title).toBe('静夜思');
    expect(poem.author).toBe('李白');
    expect(poem.grade).toBe(1);
    expect(poem.semester).toBe('下');
  });

  it('g1-下-06 应为 小池（杨万里）', () => {
    const poem = POEMS_META.find(p => p.id === 'g1-下-06');
    expect(poem.title).toBe('小池');
    expect(poem.author).toBe('杨万里');
  });

  it('g3-上-03 应为 赠刘景文（苏轼）', () => {
    const poem = POEMS_META.find(p => p.id === 'g3-上-03');
    expect(poem.title).toBe('赠刘景文');
    expect(poem.author).toBe('苏轼');
  });

  it('g6-上-04 应为 过故人庄（孟浩然）', () => {
    const poem = POEMS_META.find(p => p.id === 'g6-上-04');
    expect(poem.title).toBe('过故人庄');
    expect(poem.author).toBe('孟浩然');
  });

  it('g6-上-07 应为 浪淘沙（其一）（刘禹锡）', () => {
    const poem = POEMS_META.find(p => p.id === 'g6-上-07');
    expect(poem.title).toBe('浪淘沙（其一）');
    expect(poem.author).toBe('刘禹锡');
  });

  it('g6-下-17 应为 清平乐（黄庭坚）— 6 年级下册最后 1 首', () => {
    const last = POEMS_META.find(p => p.id === 'g6-下-17');
    expect(last).toBeDefined();
    expect(last.grade).toBe(6);
    expect(last.semester).toBe('下');
    expect(last.sequence).toBe(17);
    expect(last.author).toBe('黄庭坚');
  });
});

describe('poems-meta 常量', () => {
  it('GRADES 应为 1-6', () => {
    expect(GRADES).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('SEMESTERS 应为 [上, 下]', () => {
    expect(SEMESTERS).toEqual(['上', '下']);
  });

  it('GRADE_COUNTS 数量与 .txt 一致', () => {
    expect(GRADE_COUNTS).toEqual({ 1: 13, 2: 14, 3: 18, 4: 19, 5: 22, 6: 26 });
  });
});

describe('poems-meta 查询函数', () => {
  it('getPoemsBySemester 只返回指定学期', () => {
    const poems = getPoemsBySemester(2, '上');
    expect(poems.length).toBe(7);
    poems.forEach(p => {
      expect(p.grade).toBe(2);
      expect(p.semester).toBe('上');
    });
  });

  it('getPoemsByDynasty 只返回指定朝代', () => {
    const tang = getPoemsByDynasty('唐');
    expect(tang.length).toBeGreaterThan(0);
    tang.forEach(p => expect(p.dynasty).toBe('唐'));
  });

  it('getPoemsByAuthor 只返回指定作者', () => {
    const libai = getPoemsByAuthor('李白');
    expect(libai.length).toBeGreaterThan(0);
    libai.forEach(p => expect(p.author).toBe('李白'));
  });

  it('searchPoems 支持标题搜索', () => {
    const results = searchPoems('静夜');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].title).toContain('静夜');
  });

  it('searchPoems 支持作者搜索', () => {
    const results = searchPoems('李白');
    expect(results.length).toBeGreaterThan(0);
    results.forEach(p => expect(p.author).toBe('李白'));
  });

  it('searchPoems 空关键词返回全部', () => {
    expect(searchPoems('').length).toBe(POEMS_META.length);
    expect(searchPoems('   ').length).toBe(POEMS_META.length);
  });

  it('getAllDynasties 应排除空字符串', () => {
    const dynasties = getAllDynasties();
    expect(dynasties.length).toBeGreaterThan(0);
    expect(dynasties).not.toContain('');
    expect(new Set(dynasties).size).toBe(dynasties.length);
  });

  it('getAllAuthors 应排除空字符串', () => {
    const authors = getAllAuthors();
    expect(authors.length).toBeGreaterThan(0);
    expect(authors).not.toContain('');
    expect(new Set(authors).size).toBe(authors.length);
  });
});

// ─────────────────────────────────────────────────────────────
// 真实诗文覆盖（112 首诗不能是「待 AI 补全」占位符）
// 数据源：src/data/poems-content.js（公有领域经典诗文）
// ─────────────────────────────────────────────────────────────

describe('poems-content · 112 首诗真实内容覆盖', () => {
  it('POEMS_CONTENT 必须为每首诗提供内容（112/112 覆盖）', () => {
    const missing = POEMS_META.filter(p => !POEMS_CONTENT[p.id]);
    // 打印缺失 ID 便于补齐
    if (missing.length > 0) {
      console.log('=== 缺失内容的诗 ID 清单 ===');
      for (const p of missing) console.log(`  ${p.id}  ${p.title}（${p.author}）`);
    }
    expect(missing, `${missing.length} 首诗缺少真实内容`).toHaveLength(0);
  });

  it('POEMS_CONTENT 不应包含「待 AI 补全」占位符', () => {
    for (const [id, lines] of Object.entries(POEMS_CONTENT)) {
      for (const line of lines) {
        expect(line, `${id} 仍是占位符`).not.toMatch(/待 AI 补全/);
        expect(line.length, `${id} 空行`).toBeGreaterThan(0);
      }
    }
  });

  it('每首诗的内容应是分句数组（≥2 句），且总字数 ≥ 8', () => {
    for (const [id, lines] of Object.entries(POEMS_CONTENT)) {
      expect(Array.isArray(lines), `${id} 不是数组`).toBe(true);
      expect(lines.length, `${id} 行数过少`).toBeGreaterThanOrEqual(2);
      const totalChars = lines.join('').replace(/[，。！？、；：""''《》（）\s]/g, '').length;
      expect(totalChars, `${id} 总字数过少`).toBeGreaterThanOrEqual(8);
    }
  });

  it('mergeContent 应把真实内容合并到 POEMS_META，无占位符残留', () => {
    const merged = mergeContent(POEMS_META);
    const stillPlaceholder = merged.filter(p =>
      !p.content || p.content.some(l => /待 AI 补全/.test(l || ''))
    );
    if (stillPlaceholder.length > 0) {
      console.log('=== merge 后仍占位的诗 ===');
      for (const p of stillPlaceholder) console.log(`  ${p.id}  ${p.title}`);
    }
    expect(stillPlaceholder, `${stillPlaceholder.length} 首 merge 后仍是占位`).toHaveLength(0);
  });
});
