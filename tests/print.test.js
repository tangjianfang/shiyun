import { describe, it, expect } from 'vitest';
import { filterPoems, groupForPrint, FORMAT_DEFS, REVIEW_FILTERS, attachUserState, renderPrintHtml } from '../src/js/print.js';

describe('filterPoems', () => {
  const poems = [
    { id: 'g1-01', grade: 1, dynasty: '唐', author: '李白', status: 'mastered', favorite: true, title: '静夜思' },
    { id: 'g2-01', grade: 2, dynasty: '唐', author: '李白', status: 'learning', favorite: false, title: '望庐山瀑布' },
    { id: 'g3-01', grade: 3, dynasty: '宋', author: '苏轼', status: 'new', favorite: false, title: '题西林壁' },
    { id: 'g4-01', grade: 4, dynasty: '宋', author: '苏轼', status: 'reviewing', favorite: true, title: '饮湖上初晴' },
  ];

  it('无筛选时返回全部', () => {
    const r = filterPoems(poems, {});
    expect(r).toHaveLength(4);
  });

  it('按年级筛选', () => {
    const r = filterPoems(poems, { grades: [1, 2] });
    expect(r).toHaveLength(2);
  });

  it('按朝代筛选', () => {
    const r = filterPoems(poems, { dynasties: ['唐'] });
    expect(r.every(p => p.dynasty === '唐')).toBe(true);
  });

  it('按作者筛选', () => {
    const r = filterPoems(poems, { authors: ['李白'] });
    expect(r.every(p => p.author === '李白')).toBe(true);
  });

  it('按复习需求：仅今日待复习', () => {
    const today = new Date().toISOString().slice(0, 10);
    const poemsWithReview = poems.map(p => ({ ...p, nextReviewAt: p.status === 'reviewing' ? '2020-01-01' : '2099-01-01' }));
    const r = filterPoems(poemsWithReview, { reviewFilter: 'due' });
    expect(r.every(p => p.nextReviewAt <= today)).toBe(true);
  });

  it('按复习需求：仅已学', () => {
    const r = filterPoems(poems, { reviewFilter: 'learned' });
    expect(r.every(p => ['mastered', 'learning', 'reviewing'].includes(p.status))).toBe(true);
  });

  it('按复习需求：仅收藏', () => {
    const r = filterPoems(poems, { reviewFilter: 'favorites' });
    expect(r.every(p => p.favorite)).toBe(true);
  });

  it('多条件组合（AND）', () => {
    const r = filterPoems(poems, { grades: [1, 2, 3], authors: ['李白'], reviewFilter: 'learned' });
    expect(r.map(p => p.id)).toEqual(['g1-01', 'g2-01']);
  });

  it('按关键词搜索', () => {
    const r = filterPoems(poems, { keyword: '静夜' });
    expect(r).toHaveLength(1);
  });
});

describe('groupForPrint', () => {
  const poems = [
    { id: 'g1-01' }, { id: 'g1-02' }, { id: 'g1-03' },
    { id: 'g2-01' }, { id: 'g2-02' },
  ];

  it('classic：每组 1 首', () => {
    const groups = groupForPrint(poems, 'classic');
    expect(groups).toHaveLength(5);
    expect(groups[0]).toEqual([{ id: 'g1-01' }]);
  });

  it('dictation：每组 1 首', () => {
    const groups = groupForPrint(poems, 'dictation');
    expect(groups).toHaveLength(5);
  });

  it('dense：每组 4 首', () => {
    const groups = groupForPrint(poems, 'dense');
    expect(groups).toHaveLength(2);
    expect(groups[0]).toHaveLength(4);
    expect(groups[1]).toHaveLength(1);
  });

  it('handout：每组 1 首', () => {
    const groups = groupForPrint(poems, 'handout');
    expect(groups).toHaveLength(5);
  });

  it('应拒绝未知版式', () => {
    expect(() => groupForPrint(poems, 'unknown')).toThrow(/未知版式/);
  });
});

describe('FORMAT_DEFS', () => {
  it('应定义 4 种版式', () => {
    expect(FORMAT_DEFS).toHaveLength(4);
    const ids = FORMAT_DEFS.map(f => f.id);
    expect(ids).toContain('classic');
    expect(ids).toContain('dictation');
    expect(ids).toContain('dense');
    expect(ids).toContain('handout');
  });

  it('每种版式应含 name、desc、perPage', () => {
    FORMAT_DEFS.forEach(f => {
      expect(f.name).toBeTruthy();
      expect(f.desc).toBeTruthy();
      expect(f.perPage).toBeGreaterThan(0);
    });
  });
});

describe('REVIEW_FILTERS', () => {
  it('应至少 4 个选项', () => {
    expect(REVIEW_FILTERS.length).toBeGreaterThanOrEqual(4);
  });
});

describe('attachUserState', () => {
  it('应给诗附加 status/favorite/nextReviewAt 字段', () => {
    const poems = [{ id: 'g1-01' }];
    const r = attachUserState(poems, { poemProgress: { 'g1-01': { status: 'mastered', favorite: true, nextReviewAt: '2099-01-01' } } });
    expect(r[0].status).toBe('mastered');
    expect(r[0].favorite).toBe(true);
  });
});

describe('renderPrintHtml', () => {
  it('应返回包含 print-doc 容器和分页的 HTML', () => {
    const poems = [
      { id: 'g1-01', title: '静夜思', author: '李白', dynasty: '唐', grade: 1, type: '五言绝句', content: ['床前明月光', '疑是地上霜'], pinyin: ['chuáng qián míng yuè guāng', 'yí shì dì shàng shuāng'] },
    ];
    const groups = [[poems[0]]];
    const html = renderPrintHtml(groups, 'classic');
    expect(html).toContain('print-doc');
    expect(html).toContain('format-classic');
    expect(html).toContain('静夜思');
  });
});
