import { describe, it, expect } from 'vitest';
import { filterLearnPoems, getStatusBadge, searchPoemsCase, getAllPoemsList, getAllDynastiesForFilter, getAllAuthorsForFilter } from '../src/js/ui/learn.js';

describe('filterLearnPoems', () => {
  const sample = [
    { id: 'g1-01', title: '静夜思', author: '李白', dynasty: '唐', grade: 1 },
    { id: 'g1-02', title: '咏鹅', author: '骆宾王', dynasty: '唐', grade: 1 },
    { id: 'g2-01', title: '村居', author: '高鼎', dynasty: '清', grade: 2 },
    { id: 'g3-01', title: '静夜思', author: '李白', dynasty: '唐', grade: 3 },
  ];

  it('年级筛选应只返回该年级', () => {
    const r = filterLearnPoems(sample, { grade: 1, dynasty: '', author: '', keyword: '' });
    expect(r.length).toBe(2);
    r.forEach(p => expect(p.grade).toBe(1));
  });

  it('朝代筛选应只返回该朝代', () => {
    const r = filterLearnPoems(sample, { grade: 0, dynasty: '清', author: '', keyword: '' });
    expect(r.length).toBe(1);
    expect(r[0].id).toBe('g2-01');
  });

  it('作者筛选应只返回该作者', () => {
    const r = filterLearnPoems(sample, { grade: 0, dynasty: '', author: '骆宾王', keyword: '' });
    expect(r.length).toBe(1);
    expect(r[0].author).toBe('骆宾王');
  });

  it('关键词搜索应匹配标题或作者', () => {
    const r = filterLearnPoems(sample, { grade: 0, dynasty: '', author: '', keyword: '静夜' });
    expect(r.length).toBe(2);
  });

  it('空筛选应返回全部', () => {
    const r = filterLearnPoems(sample, { grade: 0, dynasty: '', author: '', keyword: '' });
    expect(r.length).toBe(sample.length);
  });

  it('多条件应取交集', () => {
    const r = filterLearnPoems(sample, { grade: 1, dynasty: '唐', author: '李白', keyword: '' });
    expect(r.length).toBe(1);
    expect(r[0].id).toBe('g1-01');
  });
});

describe('getStatusBadge', () => {
  it('新诗应返回 new', () => {
    expect(getStatusBadge(null).type).toBe('new');
    expect(getStatusBadge(null).label).toBe('新诗');
  });

  it('learning 状态应返回 learning', () => {
    const p = { status: 'learning', learnCount: 1 };
    expect(getStatusBadge(p).type).toBe('learning');
    expect(getStatusBadge(p).label).toContain('学习中');
  });

  it('reviewing 应返回 review 类型', () => {
    const p = { status: 'reviewing', learnCount: 5 };
    expect(getStatusBadge(p).type).toBe('review');
    expect(getStatusBadge(p).label).toBeDefined();
  });

  it('mastered 应返回 mastered 含 ⭐', () => {
    const p = { status: 'mastered', learnCount: 10 };
    const b = getStatusBadge(p);
    expect(b.type).toBe('mastered');
    expect(b.label).toContain('⭐');
  });
});

describe('searchPoemsCase', () => {
  const sample = [
    { id: 'g1-01', title: '静夜思', author: '李白', dynasty: '唐', grade: 1, content: ['床前明月光'] },
  ];

  it('空关键词返回全部', () => {
    expect(searchPoemsCase(sample, '').length).toBe(1);
  });

  it('应能匹配标题', () => {
    expect(searchPoemsCase(sample, '静夜').length).toBe(1);
  });

  it('应能匹配作者', () => {
    expect(searchPoemsCase(sample, '李白').length).toBe(1);
  });
});

describe('getAllPoemsList', () => {
  it('应返回排序后的诗词数组', async () => {
    const { loadPoemMeta } = await import('../src/js/data.js');
    loadPoemMeta();
    const list = getAllPoemsList();
    expect(list.length).toBe(112);
    expect(list[0].grade).toBeLessThanOrEqual(list[list.length - 1].grade);
  });
});

describe('getAllDynastiesForFilter / getAllAuthorsForFilter', () => {
  const sample = [
    { id: 'a', dynasty: '唐', author: '李白' },
    { id: 'b', dynasty: '宋', author: '苏轼' },
    { id: 'c', dynasty: '唐', author: '杜甫' },
  ];
  it('去重并排序', () => {
    expect(getAllDynastiesForFilter(sample)).toEqual(['唐', '宋']);
    expect(getAllAuthorsForFilter(sample)).toEqual(['李白', '杜甫', '苏轼']);
  });
});
