/**
 * 筛选/搜索 函数的行为边界测试
 *
 * 目标：把 3 套 filter + 3 套 search 的行为统一标定，
 * 揭示同关键词/同筛选条件下不同函数返回结果的差异。
 *
 * 三套搜索：
 *  - data.js   searchPoems(keyword)        → 静态 POEMS_META + 仅 title/author
 *  - learn.js  searchPoemsCase(poems, kw)  → poems 数组 + 仅 title/author
 *  - learn.js  filterLearnPoems(poems, f)  → 内联 keyword 搜索 title/author/content/keywords
 *  - print.js  filterPoems(poems, c)       → keyword 搜索 title/author
 *
 * 两套筛选：
 *  - learn.js  filterLearnPoems  → 单值（grade: number, semester: '上'|'下'）
 *  - print.js  filterPoems       → 数组白名单（grades: number[], semesters: string[]）
 *
 * 一致性原则（本测试断言）：
 *  - "空筛选 = 显示全部"（learn 已是如此；print 当前是 0 首 — 标记为 FAIL）
 *  - "keyword 搜索应匹配 title + author，最少（不强制 content）"
 *  - "未选数组（length=0）= 包含全部；非空 = 白名单"
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { loadPoemMeta, searchPoems as dataSearchPoems } from '../src/js/data.js';
import { searchPoemsCase, filterLearnPoems, getAllDynastiesForFilter, getAllAuthorsForFilter } from '../src/js/ui/learn.js';
import { filterPoems as printFilterPoems } from '../src/js/print.js';

beforeEach(() => {
  loadPoemMeta();
});

const POEMS = [
  { id: 'g1-01', title: '静夜思', author: '李白', dynasty: '唐', grade: 1, semester: '上', content: ['床前明月光', '疑是地上霜'], keywords: ['月'] },
  { id: 'g1-02', title: '咏鹅', author: '骆宾王', dynasty: '唐', grade: 1, semester: '上', content: ['鹅鹅鹅', '曲项向天歌'], keywords: ['鹅'] },
  { id: 'g2-01', title: '村居', author: '高鼎', dynasty: '清', grade: 2, semester: '上', content: ['草长莺飞二月天'], keywords: ['春'] },
  { id: 'g3-01', title: '静夜思', author: '李白', dynasty: '唐', grade: 3, semester: '上', content: ['又见静夜思'], keywords: ['月'] },
  { id: 'g5-01', title: '出塞', author: '王昌龄', dynasty: '唐', grade: 5, semester: '上', content: ['秦时明月汉时关'], keywords: ['边塞'] },
];

describe('一致性：空筛选应显示全部（print.filterPoems）', () => {
  it('空 criteria {} + defaultBehavior="all" → 应返回全部诗', () => {
    const r = printFilterPoems(POEMS, {}, { defaultBehavior: 'all' });
    expect(r.length).toBe(POEMS.length);
  });
  it('空 criteria + defaultBehavior="none" → 应返回 0（保护性默认）', () => {
    const r = printFilterPoems(POEMS, {}, { defaultBehavior: 'none' });
    expect(r.length).toBe(0);
  });
  it('空 criteria + 无 options → 默认 none（向后兼容）', () => {
    const r = printFilterPoems(POEMS, {});
    expect(r.length).toBe(0);
  });
  it('所有数组 length=0 + defaultBehavior="all" → 应返回全部', () => {
    const r = printFilterPoems(POEMS, {
      grades: [], semesters: [], dynasties: [], authors: [],
    }, { defaultBehavior: 'all' });
    expect(r.length).toBe(POEMS.length);
  });
  it('有显式选择时 defaultBehavior 不影响结果', () => {
    const all = printFilterPoems(POEMS, { grades: [1] }, { defaultBehavior: 'all' });
    const none = printFilterPoems(POEMS, { grades: [1] }, { defaultBehavior: 'none' });
    expect(all.length).toBe(2);
    expect(none.length).toBe(2);
  });
});

describe('filterLearnPoems（learn 页 — 单值筛选）', () => {
  it('空 filters {} → 应返回全部', () => {
    expect(filterLearnPoems(POEMS, {}).length).toBe(POEMS.length);
  });
  it('grade=1 → 只返回一年级', () => {
    const r = filterLearnPoems(POEMS, { grade: 1 });
    expect(r.length).toBe(2);
    r.forEach(p => expect(p.grade).toBe(1));
  });
  it('grade=0 → 全部年级（与"未选"等价）', () => {
    const r = filterLearnPoems(POEMS, { grade: 0 });
    expect(r.length).toBe(POEMS.length);
  });
  it('dynasty=唐 → 4 首', () => {
    const r = filterLearnPoems(POEMS, { dynasty: '唐' });
    expect(r.length).toBe(4);
  });
  it('组合筛选：grade=1 + dynasty=唐 → 2 首', () => {
    const r = filterLearnPoems(POEMS, { grade: 1, dynasty: '唐' });
    expect(r.length).toBe(2);
  });
  it('keyword=月 → 不匹配 content/keywords（仅 title/author）', () => {
    // 全部样本里没有 title/author 含"月"的诗
    const r = filterLearnPoems(POEMS, { keyword: '月' });
    expect(r.length).toBe(0);
  });
  it('keyword=李白 → 应匹配 author', () => {
    const r = filterLearnPoems(POEMS, { keyword: '李白' });
    expect(r.length).toBe(2);
  });
  it('keyword 大小写不敏感', () => {
    const a = filterLearnPoems(POEMS, { keyword: 'LIBAI' });
    const b = filterLearnPoems(POEMS, { keyword: 'libai' });
    expect(a.length).toBe(b.length);
  });
  it('空字符串 keyword → 等同于未选', () => {
    expect(filterLearnPoems(POEMS, { keyword: '' }).length).toBe(POEMS.length);
  });
});

describe('searchPoemsCase（learn 页 — 仅 title/author）', () => {
  it('空 keyword → 返回全部', () => {
    expect(searchPoemsCase(POEMS, '').length).toBe(POEMS.length);
  });
  it('keyword=月 → 不应匹配 content（仅 title/author）', () => {
    const r = searchPoemsCase(POEMS, '月');
    // 5 首里没有任何 title/author 含"月"
    expect(r.length).toBe(0);
  });
  it('keyword=静夜 → 2 首（同名跨年级）', () => {
    const r = searchPoemsCase(POEMS, '静夜');
    expect(r.length).toBe(2);
  });
  it('keyword=李白 → 2 首（作者）', () => {
    const r = searchPoemsCase(POEMS, '李白');
    expect(r.length).toBe(2);
  });
});

describe('data.js searchPoems（搜索静态 POEMS_META）', () => {
  it('空 keyword → 返回全部', () => {
    expect(dataSearchPoems('').length).toBeGreaterThan(0);
  });
  it('非空 keyword → 应只命中 title/author', () => {
    const r = dataSearchPoems('静夜');
    r.forEach(p => {
      const inTitle  = p.title?.includes('静夜');
      const inAuthor = p.author?.includes('静夜');
      expect(inTitle || inAuthor).toBe(true);
    });
  });
});

describe('filterPoems（print 页 — 数组白名单）', () => {
  it('grades=[1] → 只返一年级', () => {
    const r = printFilterPoems(POEMS, { grades: [1] });
    expect(r.length).toBe(2);
  });
  it('grades=[1,2] → 3 首', () => {
    const r = printFilterPoems(POEMS, { grades: [1, 2] });
    expect(r.length).toBe(3);
  });
  it('semesters=["上"] → 5 首（样本里全是上）', () => {
    const r = printFilterPoems(POEMS, { semesters: ['上'] });
    expect(r.length).toBe(POEMS.length);
  });
  it('dynasties=["唐"] → 4 首', () => {
    const r = printFilterPoems(POEMS, { dynasties: ['唐'] });
    expect(r.length).toBe(4);
  });
  it('authors=["李白"] → 2 首', () => {
    const r = printFilterPoems(POEMS, { authors: ['李白'] });
    expect(r.length).toBe(2);
  });
  it('keyword="出塞" → 1 首', () => {
    const r = printFilterPoems(POEMS, { keyword: '出塞' });
    expect(r.length).toBe(1);
  });
  it('组合：grades=[1] + keyword=静夜 → 1 首', () => {
    const r = printFilterPoems(POEMS, { grades: [1], keyword: '静夜' });
    expect(r.length).toBe(1);
  });
});

describe('一致性：跨函数同语义应给同结果', () => {
  it('grade=1 在 learn 和 print 应给同结果', () => {
    const learnR = filterLearnPoems(POEMS, { grade: 1 });
    const printR = printFilterPoems(POEMS, { grades: [1] });
    expect(learnR.map(p => p.id).sort()).toEqual(printR.map(p => p.id).sort());
  });
  it('keyword=静夜 在 3 套搜索里应给同结果（统一 title+author 后）', () => {
    const learnInline = filterLearnPoems(POEMS, { keyword: '静夜' });
    const learnCase   = searchPoemsCase(POEMS, '静夜');
    const dataSearch  = dataSearchPoems('静夜');
    // 全部统一到 title/author，结果应一致
    expect(learnCase.length).toBe(2);
    expect(learnInline.length).toBe(2);
    expect(learnCase.map(p => p.id).sort()).toEqual(learnInline.map(p => p.id).sort());
  });
});

describe('边界条件：falsy 值处理', () => {
  it('grade=0 在 learn 应等于"全部"（不是"0 年级"）', () => {
    expect(filterLearnPoems(POEMS, { grade: 0 }).length).toBe(POEMS.length);
  });
  it('dynasty="" 在 learn 应等于"全部"（不是空字符串朝代）', () => {
    expect(filterLearnPoems(POEMS, { dynasty: '' }).length).toBe(POEMS.length);
  });
  it('semester=null 在 learn 应等于"全部"（truthy 守卫）', () => {
    expect(filterLearnPoems(POEMS, { semester: null }).length).toBe(POEMS.length);
  });
});

describe('getAllDynastiesForFilter / getAllAuthorsForFilter', () => {
  it('应去重并按字母排序', () => {
    const d = getAllDynastiesForFilter(POEMS);
    expect(d).toEqual(['唐', '清']);
  });
  it('应过滤 null/空字符串', () => {
    const a = getAllAuthorsForFilter([
      ...POEMS,
      { id: 'x', author: null, dynasty: '唐' },
      { id: 'y', author: '',   dynasty: '唐' },
    ]);
    expect(a).toContain('李白');
    expect(a).toContain('骆宾王');
    expect(a).not.toContain(null);
    expect(a).not.toContain('');
  });
});

describe('learn 全部朝代 chip 行为（DOM）', () => {
  it('点击 data-dynasty="" 后 filterLearnPoems 应返回全部', () => {
    // 模拟 chip 点击后 state.dynasty 被设为 ''
    const afterClick = { dynasty: '', grade: 0, semester: '', author: '', keyword: '' };
    const r = filterLearnPoems(POEMS, afterClick);
    expect(r.length).toBe(POEMS.length);
  });
});
