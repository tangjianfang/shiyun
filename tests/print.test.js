import { describe, it, expect } from 'vitest';
import { filterPoems, groupForPrint, FORMAT_DEFS, REVIEW_FILTERS, attachUserState, renderPrintHtml } from '../src/js/print.js';
import * as printNs from '../src/js/print.js';
import * as learnUiNs from '../src/js/ui/learn.js';

describe('filterPoems', () => {
  const poems = [
    { id: 'g1-下-03', grade: 1, semester: '下', dynasty: '唐', author: '李白', status: 'mastered', favorite: true, title: '静夜思' },
    { id: 'g2-上-01', grade: 2, semester: '上', dynasty: '唐', author: '李白', status: 'learning', favorite: false, title: '望庐山瀑布' },
    { id: 'g3-上-04', grade: 3, semester: '上', dynasty: '宋', author: '苏轼', status: 'new', favorite: false, title: '题西林壁' },
    { id: 'g4-下-05', grade: 4, semester: '下', dynasty: '宋', author: '苏轼', status: 'reviewing', favorite: true, title: '饮湖上初晴' },
  ];

  it('全部筛选项为空时返回 0（明确等于「未选」）', () => {
    const r = filterPoems(poems, {});
    expect(r).toHaveLength(0);
  });

  it('只选 1 个维度时，其它空维度视为「包含全部」', () => {
    const r = filterPoems(poems, { grades: [1] });
    // grade=1 的 1 首，其它维度空=不限制
    expect(r).toHaveLength(1);
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
    expect(r.map(p => p.id)).toEqual(['g1-下-03', 'g2-上-01']);
  });

  it('按关键词搜索', () => {
    const r = filterPoems(poems, { keyword: '静夜' });
    expect(r).toHaveLength(1);
  });

  it('按学期筛选：仅「上」应只返回上册诗', () => {
    const r = filterPoems(poems, { semesters: ['上'] });
    expect(r.length).toBeGreaterThan(0);
    r.forEach(p => expect(p.semester).toBe('上'));
  });

  it('按学期筛选：仅「下」应只返回下册诗', () => {
    const r = filterPoems(poems, { semesters: ['下'] });
    expect(r.length).toBeGreaterThan(0);
    r.forEach(p => expect(p.semester).toBe('下'));
  });

  it('学期白名单 与 年级 组合应取交集', () => {
    const r = filterPoems(poems, { grades: [1, 2], semesters: ['上'] });
    r.forEach(p => {
      expect([1, 2]).toContain(p.grade);
      expect(p.semester).toBe('上');
    });
  });

  it('semesters=[] 空数组视为包含全部', () => {
    const r = filterPoems(poems, { grades: [1], semesters: [] });
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

  // ── 目录页（标题+作者）──
  // 用户需求：打印输出第一页应该是目录，列出每首诗的标题与作者，方便对照检查。
  // 设计：目录页独立于 4 种版式，所有版式都会前置一页 TOC。
  it('应在分页正文之前输出目录页（包含所有诗标题与作者）', () => {
    const poems = [
      { id: 'g1-下-03', grade: 1, semester: '下', title: '静夜思', author: '李白', dynasty: '唐', content: ['床前明月光'], pinyin: ['chuáng qián míng yuè guāng'] },
      { id: 'g3-上-04', grade: 3, semester: '上', title: '题西林壁', author: '苏轼', dynasty: '宋', content: ['横看成岭侧成峰'], pinyin: ['héng kàn chéng lǐng cè fēng'] },
      { id: 'g6-下-02', grade: 6, semester: '下', title: '迢迢牵牛星', author: '佚名', dynasty: '古诗十九首', content: ['迢迢牵牛星'], pinyin: ['tiáo tiáo qiān niú xīng'] },
    ];
    const groups = poems.map(p => [p]);
    const html = renderPrintHtml(groups, 'classic');
    // 1) 目录页存在
    expect(html).toContain('page-toc');
    expect(html).toMatch(/目\s*录|目录/);
    // 2) 每首诗的标题 + 作者 都必须出现在目录中
    expect(html).toContain('静夜思');
    expect(html).toContain('李白');
    expect(html).toContain('题西林壁');
    expect(html).toContain('苏轼');
    expect(html).toContain('迢迢牵牛星');
    expect(html).toContain('佚名');
  });

  it('目录页应出现在正文之前（TOC 是 pages 数组的第 0 项）', () => {
    const poems = [
      { id: 'g1-下-03', grade: 1, semester: '下', title: '静夜思', author: '李白', dynasty: '唐', content: ['床前明月光'], pinyin: ['chuáng qián míng yuè guāng'] },
    ];
    const groups = [poems];
    const html = renderPrintHtml(groups, 'classic');
    const tocIdx = html.indexOf('page-toc');
    const poemTitleIdx = html.indexOf('静夜思');
    expect(tocIdx).toBeGreaterThan(-1);
    expect(poemTitleIdx).toBeGreaterThan(-1);
    expect(tocIdx).toBeLessThan(poemTitleIdx);
  });

  it('dense 版（4 首/页）也应有目录页 + 按年级分组列出', () => {
    const poems = [
      { id: 'g1-上-01', grade: 1, semester: '上', title: '咏鹅', author: '骆宾王', dynasty: '唐', content: ['鹅鹅鹅'], pinyin: ['é é é'] },
      { id: 'g1-下-03', grade: 1, semester: '下', title: '静夜思', author: '李白', dynasty: '唐', content: ['床前明月光'], pinyin: ['chuáng qián míng yuè guāng'] },
      { id: 'g3-上-04', grade: 3, semester: '上', title: '题西林壁', author: '苏轼', dynasty: '宋', content: ['横看成岭侧成峰'], pinyin: ['héng kàn chéng lǐng cè fēng'] },
    ];
    const groups = [poems]; // dense 1 页
    const html = renderPrintHtml(groups, 'dense');
    expect(html).toContain('page-toc');
    expect(html).toContain('1 年级');
    expect(html).toContain('3 年级');
  });

  // ── 程序员/架构师风格（科技感） ──
  // 设计原则：关键词前置、k=v badge、无国风装饰、sans + mono
  it('TOC 标题应是单行 markdown 风（# 诗云打印目录）', () => {
    const poems = [{ id: 'g1-下-03', grade: 1, semester: '下', sequence: 3, title: '静夜思', author: '李白', dynasty: '唐' }];
    const html = renderPrintHtml([poems], 'classic');
    // 不再有「·」、「—」之类的装饰符号
    expect(html).not.toContain('诗云 · 打印目录');
    // 改为 markdown 标题
    expect(html).toContain('诗云打印目录');
  });

  it('TOC subtitle 应使用 k=v 形式（date / count / sort）', () => {
    const poems = [{ id: 'g1-下-03', grade: 1, semester: '下', sequence: 3, title: '静夜思', author: '李白', dynasty: '唐' }];
    const html = renderPrintHtml([poems], 'classic');
    expect(html).toContain('date=');
    expect(html).toContain('count=');
    expect(html).toContain('sort=');
  });

  it('TOC 每条目应有 toc-id + toc-dynasty badge', () => {
    const poems = [{ id: 'g1-下-03', grade: 1, semester: '下', sequence: 3, title: '静夜思', author: '李白', dynasty: '唐' }];
    const html = renderPrintHtml([poems], 'classic');
    expect(html).toContain('toc-id');
    expect(html).toContain('toc-dynasty');
    expect(html).toContain('g1-下-03');
  });

  it('classic 页眉应是 k=v 形式（id= / author= / dynasty= / grade=）', () => {
    const poems = [{ id: 'g1-下-03', grade: 1, semester: '下', sequence: 3, title: '静夜思', author: '李白', dynasty: '唐', content: ['床前明月光'], pinyin: ['chuáng qián míng yuè guāng'] }];
    const html = renderPrintHtml([poems], 'classic');
    expect(html).toContain('id=');
    expect(html).toContain('author=');
    expect(html).toContain('dynasty=');
    expect(html).toContain('grade=');
  });

  it('每页底部应有 format=xxx tag 与 [ N / M ] 页码', () => {
    const poems = [{ id: 'g1-下-03', grade: 1, semester: '下', sequence: 3, title: '静夜思', author: '李白', dynasty: '唐', content: ['床前明月光'], pinyin: ['chuáng qián míng yuè guāng'] }];
    const html = renderPrintHtml([poems], 'classic');
    expect(html).toContain('page-format-tag');
    expect(html).toContain('format=classic');
    // CSS ::before/::after 不会出现在 HTML 中，但 page-num 容器应存在
    expect(html).toContain('page-num');
  });

  it('dense 页每张卡应有 id-tag + 编号', () => {
    const poems = [
      { id: 'g1-上-01', grade: 1, semester: '上', sequence: 1, title: '咏鹅', author: '骆宾王', dynasty: '唐', content: ['鹅鹅鹅'], pinyin: ['é é é'] },
      { id: 'g1-下-03', grade: 1, semester: '下', sequence: 3, title: '静夜思', author: '李白', dynasty: '唐', content: ['床前明月光'], pinyin: ['chuáng qián míng yuè guāng'] },
    ];
    const html = renderPrintHtml([poems], 'dense');
    expect(html).toContain('id-tag');
    expect(html).toContain('format=dense');
    expect(html).toContain('g1-上-01');
    expect(html).toContain('g1-下-03');
  });

  it('handout 页 section 标题应是 ## 风格（## 创作背景 · background）', () => {
    const poems = [{ id: 'g1-下-03', grade: 1, semester: '下', sequence: 3, title: '静夜思', author: '李白', dynasty: '唐', content: ['床前明月光'], pinyin: ['chuáng qián míng yuè guāng'] }];
    const html = renderPrintHtml([poems], 'handout');
    expect(html).toContain('创作背景 · background');
    expect(html).toContain('字词注释 · annotations');
    expect(html).toContain('主题思想 · theme');
    expect(html).toContain('关键词 · keywords');
    expect(html).toContain('format=handout');
  });
});

// 回归：build_learning.py 把每个 ES 模块包成 IIFE + var 声明同名列。
// src/js/print.js 和 src/js/ui/learn.js 历史上都 export function filterPoems，
// 后者（后处理）会覆盖前者，导致打印页调用旧版 → 空 criteria 返回 112 首。
// 修复：learn.js 的同名函数重命名为 filterLearnPoems。
describe('filterPoems 命名空间不冲突（构建 inlining 回归）', () => {
  it('print.js 应 export filterPoems（数组语义）', () => {
    expect(typeof printNs.filterPoems).toBe('function');
    // 新语义：criteria.grades 是数组
    const r = printNs.filterPoems(
      [{ id: 'g1-01', grade: 1, dynasty: '唐', author: '李白', title: '静夜思' }],
      { grades: [1] }
    );
    expect(r).toHaveLength(1);
  });

  it('learn.js 不应再 export filterPoems（避免构建期 IIFE 变量覆盖）', () => {
    expect(learnUiNs.filterPoems).toBeUndefined();
  });

  it('learn.js 应 export filterLearnPoems（单值语义）', () => {
    expect(typeof learnUiNs.filterLearnPoems).toBe('function');
    const r = learnUiNs.filterLearnPoems(
      [{ id: 'g1-01', grade: 1, dynasty: '唐', author: '李白' }],
      { grade: 1, dynasty: '', author: '', keyword: '' }
    );
    expect(r).toHaveLength(1);
  });
});
