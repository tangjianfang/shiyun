/**
 * poem-query.test.js
 *
 * R-2.1 filterPoems 合并测试
 * R-2.2 searchPoemsByKeyword 合并测试
 * R-2.4 getUniqueValues 合并测试
 */
import { describe, it, expect } from 'vitest';
import { filterPoems, searchPoemsByKeyword, getUniqueValues } from '../src/js/poem-query.js';

const POEMS = [
  { id: 'g1-01', title: '静夜思', author: '李白',  dynasty: '唐', grade: 1, semester: '上', content: ['床前明月光'], status: 'mastered',  favorite: true  },
  { id: 'g1-02', title: '咏鹅',   author: '骆宾王', dynasty: '唐', grade: 1, semester: '上', content: ['鹅鹅鹅'],    status: 'learning',  favorite: false },
  { id: 'g2-01', title: '村居',   author: '高鼎',   dynasty: '清', grade: 2, semester: '上', content: ['草长莺飞'],   status: 'new',       favorite: false },
  { id: 'g3-01', title: '静夜思', author: '李白',  dynasty: '唐', grade: 3, semester: '下', content: ['又见静夜'],   status: 'reviewing', favorite: true  },
  { id: 'g5-01', title: '出塞',   author: '王昌龄', dynasty: '唐', grade: 5, semester: '上', content: ['秦时明月'],   status: 'new',       favorite: false },
];

// ─────────────────────────────────────────────────────────────────────────────
// filterPoems — R-2.1
// ─────────────────────────────────────────────────────────────────────────────

describe('filterPoems — 默认行为（defaultBehavior = "all"）', () => {
  it('空 criteria → 返回全部', () => {
    expect(filterPoems(POEMS, {}).length).toBe(POEMS.length);
  });
  it('空 criteria + defaultBehavior="none" → 返回 0', () => {
    expect(filterPoems(POEMS, {}, { defaultBehavior: 'none' }).length).toBe(0);
  });
  it('空数组白名单 + defaultBehavior="all" → 返回全部', () => {
    expect(filterPoems(POEMS, { grades: [], dynasties: [], authors: [] }).length).toBe(POEMS.length);
  });
  it('空数组白名单 + defaultBehavior="none" → 返回 0', () => {
    expect(filterPoems(POEMS, { grades: [], dynasties: [] }, { defaultBehavior: 'none' }).length).toBe(0);
  });
});

describe('filterPoems — learn 风格单值筛选', () => {
  it('grade=1 → 2 首', () => {
    const r = filterPoems(POEMS, { grade: 1 });
    expect(r.length).toBe(2);
    r.forEach(p => expect(p.grade).toBe(1));
  });
  it('grade=0 → 全部（0 视为"未选"）', () => {
    expect(filterPoems(POEMS, { grade: 0 }).length).toBe(POEMS.length);
  });
  it('dynasty=唐 → 4 首', () => {
    expect(filterPoems(POEMS, { dynasty: '唐' }).length).toBe(4);
  });
  it('dynasty="" → 全部', () => {
    expect(filterPoems(POEMS, { dynasty: '' }).length).toBe(POEMS.length);
  });
  it('semester=上 → 4 首', () => {
    expect(filterPoems(POEMS, { semester: '上' }).length).toBe(4);
  });
  it('semester=null → 全部', () => {
    expect(filterPoems(POEMS, { semester: null }).length).toBe(POEMS.length);
  });
  it('author=李白 → 2 首', () => {
    expect(filterPoems(POEMS, { author: '李白' }).length).toBe(2);
  });
  it('组合 grade=1 + dynasty=唐 → 2 首', () => {
    const r = filterPoems(POEMS, { grade: 1, dynasty: '唐' });
    expect(r.length).toBe(2);
  });
});

describe('filterPoems — print 风格数组白名单', () => {
  it('grades=[1] → 2 首', () => {
    expect(filterPoems(POEMS, { grades: [1] }).length).toBe(2);
  });
  it('grades=[1,2] → 3 首', () => {
    expect(filterPoems(POEMS, { grades: [1, 2] }).length).toBe(3);
  });
  it('semesters=["上"] → 4 首', () => {
    expect(filterPoems(POEMS, { semesters: ['上'] }).length).toBe(4);
  });
  it('dynasties=["清"] → 1 首', () => {
    expect(filterPoems(POEMS, { dynasties: ['清'] }).length).toBe(1);
  });
  it('authors=["李白"] → 2 首', () => {
    expect(filterPoems(POEMS, { authors: ['李白'] }).length).toBe(2);
  });
  it('组合 grades=[1] + authors=["李白"] → 1 首', () => {
    expect(filterPoems(POEMS, { grades: [1], authors: ['李白'] }).length).toBe(1);
  });
});

describe('filterPoems — keyword 搜索（title+author only）', () => {
  it('keyword=静夜 → 2 首（title 匹配）', () => {
    expect(filterPoems(POEMS, { keyword: '静夜' }).length).toBe(2);
  });
  it('keyword=李白 → 2 首（author 匹配）', () => {
    expect(filterPoems(POEMS, { keyword: '李白' }).length).toBe(2);
  });
  it('keyword=床前 → 0 首（content 不匹配）', () => {
    expect(filterPoems(POEMS, { keyword: '床前' }).length).toBe(0);
  });
  it('keyword="" → 全部', () => {
    expect(filterPoems(POEMS, { keyword: '' }).length).toBe(POEMS.length);
  });
  it('keyword 大小写不敏感', () => {
    const a = filterPoems(POEMS, { keyword: 'LIBAI' });
    const b = filterPoems(POEMS, { keyword: 'libai' });
    expect(a.length).toBe(b.length);
  });
  it('组合 grades=[1] + keyword=静夜 → 1 首', () => {
    expect(filterPoems(POEMS, { grades: [1], keyword: '静夜' }).length).toBe(1);
  });
});

describe('filterPoems — reviewFilter', () => {
  it('reviewFilter=learned → 含 mastered/learning/reviewing', () => {
    const r = filterPoems(POEMS, { reviewFilter: 'learned' });
    r.forEach(p => expect(['mastered', 'learning', 'reviewing']).toContain(p.status));
  });
  it('reviewFilter=favorites → 只返 favorite=true', () => {
    const r = filterPoems(POEMS, { reviewFilter: 'favorites' });
    r.forEach(p => expect(p.favorite).toBe(true));
  });
  it('reviewFilter=due → 只返 nextReviewAt <= today && status !== mastered', () => {
    const today = new Date().toISOString().slice(0, 10);
    const poemsWithDate = POEMS.map(p => ({
      ...p,
      nextReviewAt: p.status === 'reviewing' ? '2020-01-01' : '2099-01-01',
    }));
    const r = filterPoems(poemsWithDate, { reviewFilter: 'due' });
    r.forEach(p => {
      expect(p.nextReviewAt <= today).toBe(true);
      expect(p.status).not.toBe('mastered');
    });
  });
  it('reviewFilter=all (default) → 等同于无筛选', () => {
    expect(filterPoems(POEMS, { reviewFilter: 'all' }).length).toBe(POEMS.length);
  });
});

describe('filterPoems — learn/print 跨函数一致性', () => {
  it('learn 单值 grade=1 应等于 print 数组 grades=[1]', () => {
    const learnR = filterPoems(POEMS, { grade: 1 });
    const printR = filterPoems(POEMS, { grades: [1] });
    expect(learnR.map(p => p.id).sort()).toEqual(printR.map(p => p.id).sort());
  });
  it('learn dynasty=唐 应等于 print dynasties=["唐"]', () => {
    const a = filterPoems(POEMS, { dynasty: '唐' });
    const b = filterPoems(POEMS, { dynasties: ['唐'] });
    expect(a.map(p => p.id).sort()).toEqual(b.map(p => p.id).sort());
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// searchPoemsByKeyword — R-2.2
// ─────────────────────────────────────────────────────────────────────────────

describe('searchPoemsByKeyword — R-2.2', () => {
  it('keyword=="" → 返回原数组引用（不过滤）', () => {
    const r = searchPoemsByKeyword(POEMS, '');
    expect(r).toBe(POEMS);
  });
  it('keyword=null → 返回原数组引用', () => {
    expect(searchPoemsByKeyword(POEMS, null)).toBe(POEMS);
  });
  it('keyword=undefined → 返回原数组引用', () => {
    expect(searchPoemsByKeyword(POEMS, undefined)).toBe(POEMS);
  });
  it('keyword=静夜 → 2 首', () => {
    expect(searchPoemsByKeyword(POEMS, '静夜').length).toBe(2);
  });
  it('keyword=李白 → 2 首（author）', () => {
    expect(searchPoemsByKeyword(POEMS, '李白').length).toBe(2);
  });
  it('keyword=鹅 → 仅 title 匹配，1 首', () => {
    expect(searchPoemsByKeyword(POEMS, '鹅').length).toBe(1);
  });
  it('keyword=床前 → 0（content 不匹配）', () => {
    expect(searchPoemsByKeyword(POEMS, '床前').length).toBe(0);
  });
  it('大小写不敏感', () => {
    const a = searchPoemsByKeyword(POEMS, 'LIBAI');
    const b = searchPoemsByKeyword(POEMS, 'libai');
    expect(a.length).toBe(b.length);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getUniqueValues — R-2.4
// ─────────────────────────────────────────────────────────────────────────────

describe('getUniqueValues — R-2.4', () => {
  it('dynasty → 去重排序', () => {
    const d = getUniqueValues(POEMS, 'dynasty');
    expect(d).toEqual(['唐', '清']);
  });
  it('author → 去重排序', () => {
    const a = getUniqueValues(POEMS, 'author');
    expect(a).toContain('李白');
    expect(a).toContain('骆宾王');
    expect(new Set(a).size).toBe(a.length); // 无重复
  });
  it('过滤 null / 空字符串', () => {
    const poems = [
      ...POEMS,
      { id: 'x1', author: null,  dynasty: '宋' },
      { id: 'x2', author: '',    dynasty: ''   },
    ];
    const dynasties = getUniqueValues(poems, 'dynasty');
    const authors   = getUniqueValues(poems, 'author');
    expect(dynasties).not.toContain('');
    expect(dynasties).not.toContain(null);
    expect(authors).not.toContain('');
    expect(authors).not.toContain(null);
  });
  it('空数组 → 返回 []', () => {
    expect(getUniqueValues([], 'dynasty')).toEqual([]);
  });
});
