# Task 21: 打印-4 种版式

**依赖：** Task 10, Task 13
**并行组：** parallel-visualization（与 Task 20/22 并行）
**估时：** 1.5 天

**Files:**
- Create: `src/css/print.css`
- Create: `src/js/print.js`（核心排版逻辑）
- Create: `src/js/ui/print.js`（UI 入口：筛选+版式选择）
- Create: `tests/print.test.js`

## Step 1: 写失败的测试

测试纯函数 `filterPoems`（按筛选条件过滤诗集）和 `groupForPrint`（按版式分组）。

```javascript
// tests/print.test.js
import { describe, it, expect } from 'vitest';
import { filterPoems, groupForPrint, FORMAT_DEFS } from '../src/js/print.js';

describe('filterPoems', () => {
  const poems = [
    { id: 'g1-01', grade: 1, dynasty: '唐', author: '李白', status: 'mastered', favorite: true },
    { id: 'g2-01', grade: 2, dynasty: '唐', author: '李白', status: 'learning', favorite: false },
    { id: 'g3-01', grade: 3, dynasty: '宋', author: '苏轼', status: 'new', favorite: false },
    { id: 'g4-01', grade: 4, dynasty: '宋', author: '苏轼', status: 'reviewing', favorite: true },
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
});

describe('groupForPrint', () => {
  const poems = [
    { id: 'g1-01' }, { id: 'g1-02' }, { id: 'g1-03' },
    { id: 'g2-01' }, { id: 'g2-02' },
  ];

  it('classic：每组 1 首（每首单独一页）', () => {
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
    expect(groups).toHaveLength(2); // 5首 → 4+1
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
```

## Step 2: 运行测试验证失败

```bash
npm test -- tests/print.test.js
```

Expected: FAIL（模块未找到）

## Step 3: 实现 print.js（核心逻辑）

创建 `src/js/print.js`：

```javascript
/**
 * 诗云 · 打印排版核心逻辑
 *
 * 4 种版式：
 * - classic 经典欣赏版：单页一首 + 配图 + 拼音
 * - dictation 默写练习版：拼音填字 + 理解题
 * - dense 密集复习卡（默认）：一页 4 首 + 教学讲义
 * - handout 学习讲义版：完整教学讲义
 */

import { loadPoemMeta, getPoemsByGrade, getPoemsByDynasty, getAllDynasties } from './data.js';
import { getCurrentUserState } from './storage.js';

/**
 * 版式定义
 */
export const FORMAT_DEFS = [
  {
    id: 'classic',
    name: '经典欣赏版',
    desc: '单页一首，配图、原文、拼音，适合欣赏与朗读',
    perPage: 1,
  },
  {
    id: 'dictation',
    name: '默写练习版',
    desc: '拼音填字 + 理解题，适合默写训练',
    perPage: 1,
  },
  {
    id: 'dense',
    name: '密集复习卡',
    desc: '一页 4-6 首 + 教学讲义，体积小便于携带',
    perPage: 4,
  },
  {
    id: 'handout',
    name: '学习讲义版',
    desc: '完整教学讲义（背景、注释、主题、关键句）',
    perPage: 1,
  },
];

/**
 * 复习需求筛选
 */
export const REVIEW_FILTERS = [
  { id: 'all',       name: '全部' },
  { id: 'learned',   name: '已学' },
  { id: 'due',       name: '今日待复习' },
  { id: 'favorites', name: '已收藏' },
];

/**
 * 筛选诗集
 * @param {Array} poems - 全部诗（含 status / favorite / nextReviewAt 等运行时字段）
 * @param {Object} criteria
 * @param {number[]} [criteria.grades] - 年级列表
 * @param {string[]} [criteria.dynasties] - 朝代列表
 * @param {string[]} [criteria.authors] - 作者列表
 * @param {string} [criteria.reviewFilter] - all/learned/due/favorites
 * @param {string} [criteria.keyword] - 标题/作者关键词
 * @returns {Array}
 */
export function filterPoems(poems, criteria = {}) {
  const { grades, dynasties, authors, reviewFilter = 'all', keyword } = criteria;
  const today = new Date().toISOString().slice(0, 10);
  return poems.filter(p => {
    if (grades && grades.length > 0 && !grades.includes(p.grade)) return false;
    if (dynasties && dynasties.length > 0 && !dynasties.includes(p.dynasty)) return false;
    if (authors && authors.length > 0 && !authors.includes(p.author)) return false;
    if (keyword && keyword.trim()) {
      const kw = keyword.trim().toLowerCase();
      if (!p.title.toLowerCase().includes(kw) && !p.author.toLowerCase().includes(kw)) return false;
    }
    switch (reviewFilter) {
      case 'learned':   if (!['learning', 'reviewing', 'mastered'].includes(p.status)) return false; break;
      case 'due':       if (!(p.nextReviewAt && p.nextReviewAt <= today && p.status !== 'mastered')) return false; break;
      case 'favorites': if (!p.favorite) return false; break;
      case 'all':
      default: break;
    }
    return true;
  });
}

/**
 * 按版式分组（每组一页）
 * @param {Array} poems
 * @param {string} formatId - classic / dictation / dense / handout
 * @returns {Array<Array>}
 */
export function groupForPrint(poems, formatId) {
  const def = FORMAT_DEFS.find(f => f.id === formatId);
  if (!def) throw new Error(`未知版式：${formatId}`);
  const groups = [];
  for (let i = 0; i < poems.length; i += def.perPage) {
    groups.push(poems.slice(i, i + def.perPage));
  }
  return groups;
}

/**
 * 把诗数组附带用户进度（status / favorite / nextReviewAt）合并
 */
export function attachUserState(poems) {
  const userState = getCurrentUserState();
  const progress = userState.poemProgress || {};
  return poems.map(p => ({
    ...p,
    status: progress[p.id]?.status || 'new',
    favorite: progress[p.id]?.favorite || false,
    nextReviewAt: progress[p.id]?.nextReviewAt || null,
  }));
}

/**
 * 拼接所有诗为完整 HTML 字符串，准备写入 iframe / window.print
 * @param {Array<Array>} groups
 * @param {string} formatId
 * @returns {string}
 */
export function renderPrintHtml(groups, formatId) {
  const pages = groups.map((group, idx) => {
    return renderPage(group, formatId, idx + 1, groups.length);
  }).join('\n');
  return `<div class="print-doc format-${formatId}">${pages}</div>`;
}

/**
 * 渲染单页 HTML
 */
function renderPage(poemList, formatId, pageNum, totalPages) {
  switch (formatId) {
    case 'classic':   return renderClassicPage(poemList[0], pageNum, totalPages);
    case 'dictation': return renderDictationPage(poemList[0], pageNum, totalPages);
    case 'dense':     return renderDensePage(poemList, pageNum, totalPages);
    case 'handout':   return renderHandoutPage(poemList[0], pageNum, totalPages);
    default:          return '';
  }
}

function renderClassicPage(poem, pageNum, totalPages) {
  if (!poem) return '';
  return `
    <article class="page page-classic">
      <header class="poem-header">
        <h1 class="poem-title">《${escapeHtml(poem.title)}》</h1>
        <p class="poem-meta">${escapeHtml(poem.author)} · ${escapeHtml(poem.dynasty)} · ${poem.grade} 年级 · ${escapeHtml(poem.type)}</p>
      </header>
      ${poem.image ? `<figure class="poem-image"><img src="${poem.image}" alt="${escapeHtml(poem.title)}"></figure>` : ''}
      <div class="poem-body">
        ${poem.content.map((line, i) => `
          <p class="poem-line">
            <span class="poem-char-row">${[...line].map(c => `<span class="char">${escapeHtml(c)}</span>`).join('')}</span>
            <span class="poem-pinyin-row">${(poem.pinyin[i] || '').split(/\s+/).map(py => `<span class="pinyin">${escapeHtml(py)}</span>`).join(' ')}</span>
          </p>
        `).join('')}
      </div>
      <footer class="poem-footer">
        <p class="page-num">${pageNum} / ${totalPages}</p>
      </footer>
    </article>
  `;
}

function renderDictationPage(poem, pageNum, totalPages) {
  if (!poem) return '';
  // 把每行第一个字留空，作为默写
  return `
    <article class="page page-dictation">
      <header><h2>《${escapeHtml(poem.title)}》默写练习</h2></header>
      <div class="poem-body">
        ${poem.content.map((line, i) => `
          <p class="poem-line">
            <span class="poem-pinyin-row">${(poem.pinyin[i] || '').split(/\s+/).map(py => `<span class="pinyin">${escapeHtml(py)}</span>`).join(' ')}</span>
            <span class="poem-char-row">${[...line].map((c, idx) => idx === 0
              ? `<span class="char blank">___</span>`
              : `<span class="char">${escapeHtml(c)}</span>`).join('')}</span>
          </p>
        `).join('')}
      </div>
      <section class="comprehension">
        <h3>理解题</h3>
        <ol>
          <li>这首诗的作者是 ______，朝代是 ______。</li>
          <li>请用一句话概括这首诗的主题：______</li>
          <li>诗中你最喜欢的句子是：______，因为：______</li>
        </ol>
      </section>
      <footer><p class="page-num">${pageNum} / ${totalPages}</p></footer>
    </article>
  `;
}

function renderDensePage(poemList, pageNum, totalPages) {
  return `
    <article class="page page-dense">
      <header><h2>诗词复习卡（${poemList.length} 首）</h2></header>
      ${poemList.map(poem => `
        <section class="poem-card">
          <h3>《${escapeHtml(poem.title)}》· ${escapeHtml(poem.author)}</h3>
          <p class="poem-content">${poem.content.map(escapeHtml).join(' / ')}</p>
          ${poem.translation ? `<p class="poem-translation"><strong>译文：</strong>${escapeHtml(poem.translation)}</p>` : ''}
          ${poem.background ? `<p class="poem-bg"><strong>背景：</strong>${escapeHtml(poem.background)}</p>` : ''}
          ${poem.annotations && Object.keys(poem.annotations).length > 0
            ? `<p class="poem-ann"><strong>注释：</strong>${Object.entries(poem.annotations).map(([k, v]) => `${escapeHtml(k)}：${escapeHtml(v)}`).join('；')}</p>`
            : ''}
          ${poem.theme ? `<p class="poem-theme"><strong>主题：</strong>${escapeHtml(poem.theme)}</p>` : ''}
        </section>
      `).join('<hr class="card-sep">')}
      <footer><p class="page-num">${pageNum} / ${totalPages}</p></footer>
    </article>
  `;
}

function renderHandoutPage(poem, pageNum, totalPages) {
  if (!poem) return '';
  return `
    <article class="page page-handout">
      <header class="poem-header">
        <h1>《${escapeHtml(poem.title)}》</h1>
        <p class="poem-meta">${escapeHtml(poem.author)} · ${escapeHtml(poem.dynasty)} · ${poem.grade} 年级 · ${escapeHtml(poem.type)}</p>
      </header>
      ${poem.image ? `<figure class="poem-image"><img src="${poem.image}" alt="${escapeHtml(poem.title)}"></figure>` : ''}
      <section class="poem-body">
        ${poem.content.map((line, i) => `
          <p class="poem-line">
            <span class="poem-char-row">${[...line].map(c => `<span class="char">${escapeHtml(c)}</span>`).join('')}</span>
            <span class="poem-pinyin-row">${(poem.pinyin[i] || '').split(/\s+/).map(py => `<span class="pinyin">${escapeHtml(py)}</span>`).join(' ')}</span>
          </p>
        `).join('')}
      </section>
      <section class="handout-section">
        <h3>创作背景</h3>
        <p>${escapeHtml(poem.background || '暂无')}</p>
      </section>
      <section class="handout-section">
        <h3>字词注释</h3>
        ${poem.annotations && Object.keys(poem.annotations).length > 0
          ? `<ul>${Object.entries(poem.annotations).map(([k, v]) => `<li><strong>${escapeHtml(k)}</strong>：${escapeHtml(v)}</li>`).join('')}</ul>`
          : '<p>暂无</p>'}
      </section>
      <section class="handout-section">
        <h3>主题思想</h3>
        <p>${escapeHtml(poem.theme || '暂无')}</p>
      </section>
      <section class="handout-section">
        <h3>关键词</h3>
        <p>${(poem.keywords || []).map(escapeHtml).join('、') || '暂无'}</p>
      </section>
      <footer><p class="page-num">${pageNum} / ${totalPages}</p></footer>
    </article>
  `;
}

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

/**
 * 触发浏览器打印
 * @param {HTMLElement} container - 含 print-doc 的容器
 */
export function triggerPrint(container) {
  const printDoc = container.querySelector('.print-doc');
  if (!printDoc) {
    alert('没有可打印的内容');
    return;
  }
  // 把 .print-doc 注入到 body 临时节点
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '-10000px';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);
  const idoc = iframe.contentDocument || iframe.contentWindow.document;
  idoc.open();
  idoc.write(`<!doctype html><html><head><meta charset="utf-8"><title>诗云 打印</title>
    <link rel="stylesheet" href="${getMainCssPath()}">
    <link rel="stylesheet" href="${getPrintCssPath()}">
  </head><body>${printDoc.outerHTML}</body></html>`);
  idoc.close();
  iframe.contentWindow.focus();
  setTimeout(() => {
    iframe.contentWindow.print();
    setTimeout(() => document.body.removeChild(iframe), 1000);
  }, 200);
}

function getMainCssPath() {
  // 在构建产物中，CSS 会内嵌；开发态用相对路径
  return window.__SHIYUN_CSS_PATH__ || './css/main.css';
}

function getPrintCssPath() {
  return window.__SHIYUN_PRINT_CSS_PATH__ || './css/print.css';
}
```

## Step 4: 实现 print.css（4 种版式样式）

创建 `src/css/print.css`：

```css
/* 诗云 · 打印样式
 * 配合 src/js/print.js 使用
 * 4 种版式：classic / dictation / dense / handout
 * 打印：@media print 隐藏 UI 元素
 */

/* ===== 屏幕预览样式（编辑态） ===== */
.print-doc {
  background: #f5f7fa;
  padding: 2rem;
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
  color: #2c3e50;
}
.print-doc .page {
  background: #fff;
  margin: 0 auto 2rem auto;
  padding: 2.5rem 2rem;
  width: 210mm;
  min-height: 297mm;
  box-sizing: border-box;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  page-break-after: always;
  position: relative;
}
.print-doc .page:last-child { page-break-after: auto; }
.print-doc .page-num {
  position: absolute; bottom: 1rem; right: 1.5rem;
  color: #999; font-size: 0.85rem;
}

/* 经典欣赏版 */
.page-classic .poem-header { text-align: center; margin-bottom: 1.5rem; }
.page-classic .poem-title { font-family: "STKaiti", "KaiTi", serif; font-size: 2rem; margin: 0; }
.page-classic .poem-meta { color: #7f8c8d; font-size: 0.95rem; margin-top: 0.5rem; }
.page-classic .poem-image { text-align: center; margin: 1rem 0; }
.page-classic .poem-image img { max-width: 100%; max-height: 200px; }
.page-classic .poem-body { margin: 1.5rem 0; }
.page-classic .poem-line {
  text-align: center; margin: 0.8rem 0;
  display: flex; flex-direction: column; gap: 0.2rem;
}
.page-classic .poem-char-row .char {
  font-family: "STKaiti", "KaiTi", serif;
  font-size: 1.8rem; margin: 0 0.2rem; display: inline-block;
}
.page-classic .poem-pinyin-row .pinyin {
  font-family: monospace; font-size: 0.9rem; color: #555;
  margin: 0 0.2rem; display: inline-block;
}

/* 默写练习版 */
.page-dictation .poem-line {
  display: flex; flex-direction: column; gap: 0.2rem;
  margin: 1rem 0; padding-bottom: 0.5rem; border-bottom: 1px dashed #ccc;
}
.page-dictation .poem-pinyin-row .pinyin {
  font-family: monospace; font-size: 1rem; color: #555;
}
.page-dictation .poem-char-row .char {
  font-family: "STKaiti", "KaiTi", serif; font-size: 1.5rem;
  margin: 0 0.15rem; display: inline-block;
}
.page-dictation .poem-char-row .char.blank {
  display: inline-block; min-width: 2rem; border-bottom: 2px solid #333;
}
.page-dictation .comprehension { margin-top: 2rem; }
.page-dictation .comprehension ol li { margin: 0.5rem 0; line-height: 1.8; }

/* 密集复习卡 */
.page-dense h2 { font-size: 1.1rem; text-align: center; color: #555; }
.page-dense .poem-card { margin: 0.75rem 0; }
.page-dense .poem-card h3 { font-family: "STKaiti", "KaiTi", serif; margin: 0 0 0.25rem 0; font-size: 1rem; }
.page-dense .poem-content {
  font-family: "STKaiti", "KaiTi", serif; font-size: 0.95rem;
  color: #333; line-height: 1.6; margin: 0.25rem 0;
}
.page-dense .poem-translation, .page-dense .poem-bg,
.page-dense .poem-ann, .page-dense .poem-theme {
  font-size: 0.85rem; line-height: 1.5; margin: 0.2rem 0; color: #555;
}
.page-dense .card-sep { border: 0; border-top: 1px dashed #ccc; margin: 0.5rem 0; }

/* 学习讲义版 */
.page-handout .poem-header { text-align: center; margin-bottom: 1rem; }
.page-handout .poem-title { font-family: "STKaiti", "KaiTi", serif; font-size: 1.8rem; margin: 0; }
.page-handout .poem-meta { color: #7f8c8d; font-size: 0.9rem; margin-top: 0.3rem; }
.page-handout .poem-image img { max-width: 60%; display: block; margin: 0.5rem auto; }
.page-handout .poem-body { margin: 1rem 0; }
.page-handout .poem-line { text-align: center; margin: 0.6rem 0; }
.page-handout .poem-char-row .char {
  font-family: "STKaiti", "KaiTi", serif; font-size: 1.5rem; margin: 0 0.2rem;
}
.page-handout .poem-pinyin-row .pinyin {
  font-family: monospace; font-size: 0.85rem; color: #555;
  display: block; margin-top: 0.2rem;
}
.page-handout .handout-section { margin: 0.75rem 0; }
.page-handout .handout-section h3 {
  font-size: 1rem; color: #4a90e2; border-left: 3px solid #4a90e2;
  padding-left: 0.5rem; margin: 0.5rem 0;
}
.page-handout .handout-section p,
.page-handout .handout-section li { font-size: 0.9rem; line-height: 1.6; }

/* ===== 打印设置 ===== */
@media print {
  body { background: #fff !important; }
  .print-doc { background: #fff; padding: 0; }
  .print-doc .page {
    width: 100%; min-height: auto;
    margin: 0; padding: 1.5cm 1cm;
    box-shadow: none;
    page-break-after: always;
  }
  .print-doc .page:last-child { page-break-after: auto; }
  /* 隐藏屏幕 UI */
  .app-header, .tab-bar, .filter-bar, .format-selector, .print-actions, .no-print {
    display: none !important;
  }
  /* 字体颜色强制黑色（节省墨水） */
  .poem-title, .poem-content, .poem-char-row .char { color: #000 !important; }
  /* 避免分页切断一首诗 */
  .page-classic, .page-handout, .page-dictation { page-break-inside: avoid; }
  .poem-card, .handout-section { page-break-inside: avoid; }
  /* 图片限制 */
  .poem-image img { max-height: 5cm; }
  @page {
    size: A4;
    margin: 0;
  }
}
```

## Step 5: 实现 print UI 入口

创建 `src/js/ui/print.js`：

```javascript
/**
 * 诗云 · 打印 UI 入口
 *
 * 流程：进入打印页 → 设置筛选条件 → 选择版式 → 预览 → window.print()
 */

import { loadPoemMeta, getAllDynasties, getAllAuthors } from '../data.js';
import { filterPoems, attachUserState, groupForPrint, renderPrintHtml, triggerPrint, FORMAT_DEFS, REVIEW_FILTERS } from '../print.js';
import { GRADES } from '../../data/poems-meta.js';

export function renderPrintPage(container) {
  loadPoemMeta();
  const poems = (window.__SHIYUN_POEMS__ || []).map(p => ({ ...p }));
  const poemsWithState = attachUserState(poems);

  const dynasties = getAllDynasties();
  const authors = getAllAuthors();

  container.innerHTML = `
    <div class="print-page">
      <h2>🖨️ 打印</h2>

      <section class="card filter-bar no-print">
        <h3>筛选条件</h3>
        <div class="filter-grid">
          <div class="filter-group">
            <label>年级</label>
            <div class="chip-group" id="grades-chips">
              ${GRADES.map(g => `<label class="chip"><input type="checkbox" value="${g}" checked>${g} 年级</label>`).join('')}
            </div>
          </div>
          <div class="filter-group">
            <label>朝代</label>
            <div class="chip-group" id="dynasties-chips">
              ${dynasties.map(d => `<label class="chip"><input type="checkbox" value="${d}" checked>${d}</label>`).join('')}
            </div>
          </div>
          <div class="filter-group">
            <label>作者</label>
            <div class="chip-group scrollable" id="authors-chips">
              ${authors.map(a => `<label class="chip"><input type="checkbox" value="${escapeHtml(a)}" checked>${escapeHtml(a)}</label>`).join('')}
            </div>
          </div>
          <div class="filter-group">
            <label>复习需求</label>
            <select id="review-filter">
              ${REVIEW_FILTERS.map(f => `<option value="${f.id}">${f.name}</option>`).join('')}
            </select>
          </div>
          <div class="filter-group">
            <label>关键词</label>
            <input type="text" id="keyword" placeholder="标题或作者">
          </div>
        </div>
      </section>

      <section class="card format-selector no-print">
        <h3>版式</h3>
        <div class="format-grid">
          ${FORMAT_DEFS.map(f => `
            <label class="format-card">
              <input type="radio" name="format" value="${f.id}" ${f.id === 'dense' ? 'checked' : ''}>
              <div class="format-name">${f.name}</div>
              <div class="format-desc">${f.desc}</div>
              <div class="format-meta">${f.perPage} 首/页</div>
            </label>
          `).join('')}
        </div>
      </section>

      <section class="print-actions no-print">
        <span id="print-summary" class="summary"></span>
        <button class="btn btn-primary" id="btn-print">🖨️ 打印 / 另存为 PDF</button>
      </section>

      <section class="print-preview" id="print-preview">
        <p class="empty-tip">请选择筛选条件和版式</p>
      </section>
    </div>
  `;

  // 实时更新预览
  const updatePreview = () => {
    const criteria = readCriteria();
    const formatId = container.querySelector('input[name="format"]:checked')?.value || 'dense';
    const filtered = filterPoems(poemsWithState, criteria);
    const groups = groupForPrint(filtered, formatId);
    const summary = container.querySelector('#print-summary');
    summary.textContent = `共 ${filtered.length} 首诗 / ${groups.length} 页`;
    const preview = container.querySelector('#print-preview');
    if (groups.length === 0) {
      preview.innerHTML = '<p class="empty-tip">没有符合条件的诗</p>';
      return;
    }
    preview.innerHTML = renderPrintHtml(groups, formatId);
  };

  // 绑定筛选变化
  container.querySelectorAll('input, select').forEach(el => {
    el.addEventListener('change', updatePreview);
    if (el.type === 'text') el.addEventListener('input', updatePreview);
  });

  // 打印按钮
  container.querySelector('#btn-print').addEventListener('click', () => {
    triggerPrint(container);
  });

  // 首次渲染
  updatePreview();
}

function readCriteria() {
  const container = document.querySelector('.print-page');
  if (!container) return {};
  const grades = Array.from(container.querySelectorAll('#grades-chips input:checked')).map(i => parseInt(i.value, 10));
  const dynasties = Array.from(container.querySelectorAll('#dynasties-chips input:checked')).map(i => i.value);
  const authors = Array.from(container.querySelectorAll('#authors-chips input:checked')).map(i => i.value);
  const reviewFilter = container.querySelector('#review-filter').value;
  const keyword = container.querySelector('#keyword').value;
  return { grades, dynasties, authors, reviewFilter, keyword };
}

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

export default { renderPrintPage };
```

## Step 6: 在 main.css 追加打印页 UI 样式

在 `src/css/main.css` 末尾追加：

```css
/* ===== 打印页 ===== */
.print-page { padding: 1rem; max-width: 1000px; margin: 0 auto; }
.print-page h2 { margin-bottom: 1rem; }
.print-page .card { padding: 1rem; margin-bottom: 1rem; }
.filter-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.filter-group label { font-weight: 600; color: #555; font-size: 0.9rem; display: block; margin-bottom: 0.4rem; }
.chip-group { display: flex; flex-wrap: wrap; gap: 0.4rem; }
.chip-group.scrollable { max-height: 100px; overflow-y: auto; padding: 0.25rem; background: #f9fafb; border-radius: 4px; }
.chip { display: inline-flex; align-items: center; gap: 0.2rem; padding: 0.25rem 0.5rem;
  background: #fff; border: 1px solid #e0e6ed; border-radius: 16px; font-size: 0.85rem; cursor: pointer; }
.chip input { margin: 0; }

.format-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.75rem; }
.format-card { display: block; padding: 1rem; border: 2px solid #e0e6ed; border-radius: 8px;
  cursor: pointer; transition: all 0.2s; }
.format-card:hover { border-color: #4a90e2; }
.format-card input { display: none; }
.format-card:has(input:checked) { border-color: #4a90e2; background: #e8f1fb; }
.format-name { font-weight: 600; margin-bottom: 0.25rem; }
.format-desc { font-size: 0.85rem; color: #7f8c8d; line-height: 1.4; }
.format-meta { font-size: 0.75rem; color: #4a90e2; margin-top: 0.5rem; }

.print-actions { display: flex; justify-content: space-between; align-items: center; padding: 0 1rem; }
.summary { color: #555; }
.btn-primary { background: #4a90e2; color: #fff; border: 0; padding: 0.6rem 1.5rem;
  border-radius: 6px; cursor: pointer; font-size: 1rem; }
.btn-primary:hover { background: #3a7bc8; }
.empty-tip { text-align: center; color: #999; padding: 2rem; }

.print-preview { background: #f5f7fa; padding: 1rem; }
```

## Step 7: 运行测试

```bash
npm test -- tests/print.test.js
```

Expected: PASS（filterPoems / groupForPrint / FORMAT_DEFS 测试全部通过）

## Step 8: 手动验证

1. 启动学习版
2. 进入「打印」tab
3. 调整筛选（勾选/取消勾选年级、朝代、作者）
4. 切换复习需求（已学 / 今日待复习 / 收藏）
5. 切换 4 种版式，预览实时更新
6. 点「打印」→ 浏览器打印对话框 → 另存为 PDF → 验证 4 种版式都正确
7. 在打印对话框中：A4 纸张、纵向、无页眉页脚

## Step 9: 提交

```bash
git add src/css/print.css src/js/print.js src/js/ui/print.js src/css/main.css tests/print.test.js
git commit -m "feat(print): 4 种版式（经典/默写/密集/讲义）+ 浏览器原生打印"
```

## 完成标志

```bash
echo done > .tasks/done/21
```

## 关键说明

- **零依赖**：不引入 print.js / jsPDF 等打印库，只用浏览器原生 `window.print()` + `@media print`
- **4 种版式**：参考设计文档 4.4 节
  - `classic`（经典欣赏版）：单页一首 + 配图 + 拼音 — 欣赏用
  - `dictation`（默写练习版）：拼音填字（每行首字留空）+ 理解题 — 默写用
  - `dense`（密集复习卡，默认）：一页 4 首 + 教学讲义 — 携带用
  - `handout`（学习讲义版）：完整教学讲义（背景/注释/主题/关键词）— 备课用
- **筛选维度**：年级 + 朝代 + 作者 + 复习需求（all/learned/due/favorites）+ 关键词
- **iframe 打印**：通过隐藏 iframe 加载 print.css + print-doc，避免污染主页 DOM
- **A4 设置**：`@page { size: A4; margin: 0; }` + 边距在 .page 内 padding 控制
- **避免分页切诗**：`page-break-inside: avoid` 用在 .page 和 .poem-card
- **节省墨水**：打印时强制文字黑色、隐藏 UI 元素
