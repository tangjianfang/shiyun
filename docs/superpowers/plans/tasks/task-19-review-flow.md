# Task 19: 复习流程

**依赖：** 12, 15, 16, 17, 18
**并行组：** none（最后一个复习任务）
**估时：** 1 天

**Files:**
- Create: `src/js/ui/review.js`
- Modify: `src/css/main.css` (扩展复习相关样式)

## 背景

设计文档 4.2 节定义了复习流程：

- 入口：首页 "今日复习" 卡片（显示待复习数）
- 流程：
  1. 显示今日待复习诗列表
  2. 逐首进入考核（默认填空模式，可配置）
  3. 完成一题后调 `srs.nextReview()` 更新进度
  4. 全部完成后显示今日复习报告（掌握数、待巩固数）
- 复习完成后更新首页的"今日待复习"数字

本任务做**复习页面 UI + 流程控制**。判分算法已在 Task 15-18 各自实现，`srs.nextReview()` 已在 Task 12 实现。

---

## Step 1: 写失败的测试

[本任务为 UI 流程，先测流程控制函数（纯函数）+ srs 调用集成；UI 渲染手动测。]

```javascript
// tests/review-flow.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  buildReviewSession,
  pickQuizMode,
  processReviewResult,
  summarizeReview,
  getDuePoems,
} from '../src/js/ui/review.js';

// Mock srs
vi.mock('../src/js/srs.js', () => ({
  getDuePoems: vi.fn(),
  nextReview: vi.fn(),
}));

// Mock data
vi.mock('../src/js/data.js', () => ({
  getPoem: vi.fn(id => ({
    id, title: `诗${id}`, author: '测试作者',
    content: ['一二三', '四五六'],
    keySentences: [{ line: 0, chars: ['一','二','三'], blanks: [1] }],
  })),
}));

import { getDuePoems as mockGetDuePoems, nextReview as mockNextReview } from '../src/js/srs.js';

const POEMS = [
  { id: 'g1-01', title: '静夜思', grade: 1, status: 'reviewing' },
  { id: 'g1-02', title: '春晓', grade: 1, status: 'learning' },
  { id: 'g1-03', title: '登鹳雀楼', grade: 1, status: 'reviewing' },
];

describe('buildReviewSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应返回今日待复习的诗列表', () => {
    mockGetDuePoems.mockReturnValue(POEMS);
    const session = buildReviewSession();
    expect(session.poems).toHaveLength(3);
    expect(session.poems[0].id).toBe('g1-01');
  });

  it('应支持配置模式（默认填空）', () => {
    mockGetDuePoems.mockReturnValue(POEMS);
    const session = buildReviewSession({ mode: 'choice' });
    expect(session.config.mode).toBe('choice');
  });

  it('应支持配置范围（年级筛选）', () => {
    mockGetDuePoems.mockReturnValue(POEMS);
    const session = buildReviewSession({ grades: [1] });
    expect(session.config.grades).toEqual([1]);
  });

  it('应支持配置数量限制', () => {
    mockGetDuePoems.mockReturnValue(POEMS);
    const session = buildReviewSession({ limit: 2 });
    expect(session.poems).toHaveLength(2);
  });

  it('无待复习诗时应返回空 session', () => {
    mockGetDuePoems.mockReturnValue([]);
    const session = buildReviewSession();
    expect(session.poems).toEqual([]);
  });
});

describe('pickQuizMode', () => {
  it('默认应返回填空', () => {
    expect(pickQuizMode({})).toBe('fill');
  });

  it('指定单一模式时应返回该模式', () => {
    expect(pickQuizMode({ mode: 'order' })).toBe('order');
  });

  it('混合模式应随机选一种', () => {
    const validModes = ['fill', 'choice', 'order', 'listen'];
    for (let i = 0; i < 20; i++) {
      const m = pickQuizMode({ mode: 'mixed' });
      expect(validModes).toContain(m);
    }
  });

  it('应排除不可用的模式（无音频不能 listen，无 keySentences 不能 fill/order）', () => {
    // poem 没有 audio，没有 keySentences
    const poem = { id: 'x', title: 't', content: ['ab'] };
    // 没有 keySentences -> 排除 fill/order
    // 没有 audio -> 排除 listen
    // 只能选 choice
    expect(pickQuizMode({ mode: 'mixed' }, poem)).toBe('choice');
  });
});

describe('processReviewResult', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNextReview.mockReturnValue({
      poemId: 'g1-01',
      nextInterval: 5,
      nextReviewAt: '2026-06-21',
      newStatus: 'reviewing',
    });
  });

  it('应调用 srs.nextReview 更新进度', () => {
    const session = { poems: [{ id: 'g1-01' }], currentIdx: 0 };
    processReviewResult(session, 'g1-01', { mode: 'fill', score: 90 });
    expect(mockNextReview).toHaveBeenCalledWith('g1-01', 90);
  });

  it('应记录本首考核结果', () => {
    const session = { poems: [{ id: 'g1-01' }], currentIdx: 0, results: [] };
    processReviewResult(session, 'g1-01', { mode: 'fill', score: 90 });
    expect(session.results).toHaveLength(1);
    expect(session.results[0]).toMatchObject({
      poemId: 'g1-01',
      score: 90,
      mode: 'fill',
    });
  });

  it('应推进 currentIdx', () => {
    const session = { poems: [{ id: 'g1-01' }, { id: 'g1-02' }], currentIdx: 0, results: [] };
    processReviewResult(session, 'g1-01', { mode: 'fill', score: 90 });
    expect(session.currentIdx).toBe(1);
  });
});

describe('summarizeReview', () => {
  it('应统计掌握数（≥90分）', () => {
    const session = {
      results: [
        { poemId: 'p1', score: 95 },
        { poemId: 'p2', score: 85 },
        { poemId: 'p3', score: 100 },
        { poemId: 'p4', score: 60 },
      ],
    };
    const summary = summarizeReview(session);
    expect(summary.mastered).toBe(2); // p1, p3
    expect(summary.needReview).toBe(2); // p2 (70-89), p4 (<70)
    expect(summary.total).toBe(4);
    expect(summary.avgScore).toBe(85); // (95+85+100+60)/4 = 85
  });

  it('空 session 应返回零值', () => {
    const summary = summarizeReview({ results: [] });
    expect(summary.mastered).toBe(0);
    expect(summary.needReview).toBe(0);
    expect(summary.total).toBe(0);
    expect(summary.avgScore).toBe(0);
  });

  it('待巩固数应包括 70-89 分段的诗', () => {
    const session = {
      results: [
        { poemId: 'p1', score: 70 },
        { poemId: 'p2', score: 89 },
      ],
    };
    const summary = summarizeReview(session);
    expect(summary.needReview).toBe(2);
    expect(summary.mastered).toBe(0);
  });
});

describe('getDuePoems (wrapper)', () => {
  it('应调用 srs.getDuePoems', () => {
    mockGetDuePoems.mockReturnValue([{ id: 'g1-01' }]);
    const result = getDuePoems();
    expect(mockGetDuePoems).toHaveBeenCalled();
    expect(result).toEqual([{ id: 'g1-01' }]);
  });

  it('应支持按年级筛选', () => {
    mockGetDuePoems.mockReturnValue([
      { id: 'g1-01', grade: 1 },
      { id: 'g2-01', grade: 2 },
      { id: 'g1-02', grade: 1 },
    ]);
    const result = getDuePoems({ grades: [1] });
    expect(result.every(p => p.grade === 1)).toBe(true);
    expect(result).toHaveLength(2);
  });
});
```

## Step 2: 运行测试验证失败

```bash
npm test -- tests/review-flow.test.js
```

Expected: FAIL with "Cannot find module '../src/js/ui/review.js'"

## Step 3: 实现最小代码

### 3.1 创建 `src/js/ui/review.js`

```javascript
/**
 * 复习流程 UI
 *
 * 流程：
 *   1. 首页 "今日复习" 卡片显示待复习数（getDuePoems()）
 *   2. 进入复习页，列出所有待复习诗
 *   3. 用户点击 "开始" → 逐首进入考核（默认填空）
 *   4. 完成一题 → processReviewResult 更新进度 + 记录结果
 *   5. 全部完成 → 显示复习报告 + 更新首页数字
 */

import { getDuePoems, nextReview } from '../srs.js';
import { getPoem, getAllPoems } from '../data.js';
import { startQuiz } from './quiz.js';

const AVAILABLE_MODES = ['fill', 'choice', 'order', 'listen'];

/**
 * 构建一次复习会话
 * @param {Object} [opts]
 * @param {'fill'|'choice'|'order'|'listen'|'mixed'} [opts.mode='fill']
 * @param {number[]} [opts.grades] 限制年级
 * @param {string[]} [opts.statuses] 限制状态 (learning/reviewing)
 * @param {number} [opts.limit] 限制题数
 * @returns {{
 *   poems: Array<{id:string,title:string,grade:number,status:string}>,
 *   currentIdx: number,
 *   results: Array<{poemId:string,score:number,mode:string}>,
 *   config: Object,
 * }}
 */
export function buildReviewSession(opts = {}) {
  const config = {
    mode: opts.mode || 'fill',
    grades: opts.grades || null,
    statuses: opts.statuses || null,
    limit: opts.limit || null,
  };

  let poems = getDuePoems({
    grades: config.grades,
    statuses: config.statuses,
  });

  if (config.limit && poems.length > config.limit) {
    poems = poems.slice(0, config.limit);
  }

  return {
    poems,
    currentIdx: 0,
    results: [],
    config,
  };
}

/**
 * 根据 poem 与配置挑一种考核模式
 * @param {Object} config
 * @param {Object} [poem] 当前诗（用于排除不可用模式）
 * @returns {'fill'|'choice'|'order'|'listen'}
 */
export function pickQuizMode(config, poem) {
  if (config.mode && config.mode !== 'mixed') return config.mode;

  // 混合模式：根据 poem 排除不可用模式
  const candidates = AVAILABLE_MODES.filter(mode => isModeAvailable(mode, poem));
  if (candidates.length === 0) return 'choice'; // 兜底
  return candidates[Math.floor(Math.random() * candidates.length)];
}

/**
 * 判断某模式对当前诗是否可用
 * @param {'fill'|'choice'|'order'|'listen'} mode
 * @param {Object} [poem]
 * @returns {boolean}
 */
function isModeAvailable(mode, poem) {
  if (!poem) return true;
  switch (mode) {
    case 'fill':
    case 'order':
      // 需要 keySentences 且至少 2 句
      return !!(poem.keySentences && poem.keySentences.length > 0) &&
             (poem.content && poem.content.length >= 2);
    case 'listen':
      return !!poem.audio;
    case 'choice':
    default:
      return true; // 选择题永远可用
  }
}

/**
 * 处理单次考核结果
 * - 调用 srs.nextReview 更新 SM-2 进度
 * - 记录到 session.results
 * - 推进 currentIdx
 * @param {Object} session
 * @param {string} poemId
 * @param {{mode:string, score:number, [k:string]:any}} result
 * @returns {Object} srs.nextReview 的返回值
 */
export function processReviewResult(session, poemId, result) {
  const srsResult = nextReview(poemId, result.score);

  session.results.push({
    poemId,
    score: result.score,
    mode: result.mode,
    at: new Date().toISOString(),
    wrongs: result.wrongs || [],
    isCorrect: result.isCorrect,
  });

  session.currentIdx++;
  return srsResult;
}

/**
 * 汇总复习报告
 * @param {Object} session
 * @returns {{total:number, mastered:number, needReview:number, avgScore:number}}
 */
export function summarizeReview(session) {
  const results = session.results || [];
  const total = results.length;
  if (total === 0) {
    return { total: 0, mastered: 0, needReview: 0, avgScore: 0 };
  }
  let mastered = 0, needReview = 0, sum = 0;
  for (const r of results) {
    sum += r.score;
    if (r.score >= 90) mastered++;
    else if (r.score >= 70) needReview++;
    else needReview++; // < 70 也算待巩固
  }
  return {
    total,
    mastered,
    needReview,
    avgScore: Math.round(sum / total),
  };
}

/**
 * 获取待复习诗（wrapper for srs + 筛选）
 * @param {Object} [opts]
 * @returns {Array<{id:string,title:string,grade:number,status:string}>}
 */
export function getDuePoemsForReview(opts = {}) {
  return getDuePoems(opts);
}

// === UI 渲染 ===

/**
 * 渲染复习入口页（诗列表 + 配置 + 开始按钮）
 * @param {HTMLElement} container
 */
export function renderReviewPage(container) {
  const poems = getDuePoems();
  const count = poems.length;

  container.innerHTML = `
    <div class="review-page">
      <header class="review-page__header">
        <h2 class="review-page__title">🔄 今日复习</h2>
        <p class="review-page__subtitle">待复习 <strong class="review-page__count">${count}</strong> 首</p>
      </header>

      ${count === 0 ? `
        <div class="review-page__empty">
          <p>🎉 今日没有待复习的诗</p>
          <a href="#/learn" class="btn btn--primary">去学新诗</a>
        </div>
      ` : `
        <div class="review-page__config">
          <label class="review-page__field">
            <span>考核模式：</span>
            <select class="review-page__mode">
              <option value="fill">填空（默认）</option>
              <option value="choice">选择</option>
              <option value="order">排序</option>
              <option value="listen">听诗选诗</option>
              <option value="mixed">混合（推荐）</option>
            </select>
          </label>
          <label class="review-page__field">
            <span>数量限制：</span>
            <select class="review-page__limit">
              <option value="">全部</option>
              <option value="5">5 首</option>
              <option value="10">10 首</option>
              <option value="20">20 首</option>
            </select>
          </label>
        </div>

        <ul class="review-page__list">
          ${poems.map((p, i) => `
            <li class="review-page__item" data-id="${p.id}">
              <span class="review-page__num">${i + 1}.</span>
              <span class="review-page__poem-title">${p.title}</span>
              <span class="review-page__poem-author">${p.author || ''}</span>
              <span class="review-page__poem-status review-page__poem-status--${p.status}">${statusLabel(p.status)}</span>
            </li>
          `).join('')}
        </ul>

        <div class="review-page__actions">
          <button class="btn btn--primary btn--large" data-action="start">开始复习</button>
        </div>
      `}
    </div>
  `;

  if (count === 0) return;

  container.querySelector('[data-action="start"]').addEventListener('click', () => {
    const mode = container.querySelector('.review-page__mode').value;
    const limitVal = container.querySelector('.review-page__limit').value;
    const limit = limitVal ? parseInt(limitVal, 10) : null;
    const session = buildReviewSession({ mode, limit });
    if (session.poems.length === 0) {
      alert('没有可复习的诗');
      return;
    }
    runReviewSession(container, session);
  });
}

/**
 * 启动复习会话，逐首考核
 * @param {HTMLElement} container
 * @param {Object} session
 */
function runReviewSession(container, session) {
  if (session.currentIdx >= session.poems.length) {
    showReviewReport(container, session);
    return;
  }

  const currentPoemMeta = session.poems[session.currentIdx];
  const poem = getPoem(currentPoemMeta.id);
  if (!poem) {
    // 跳过
    session.currentIdx++;
    runReviewSession(container, session);
    return;
  }

  const mode = pickQuizMode(session.config, poem);

  // 显示进度
  const progress = `${session.currentIdx + 1} / ${session.poems.length}`;

  startQuiz(poem, mode, {
    onComplete: (score, result) => {
      processReviewResult(session, poem.id, { ...result, score });
      runReviewSession(container, session);
    },
    onExit: () => {
      // 用户中途退出：显示已完成的报告
      if (session.results.length > 0) {
        showReviewReport(container, session);
      } else {
        renderReviewPage(container);
      }
    },
  });

  // 在主区域顶部加一个进度条
  const main = container.closest('#app-main') || document.getElementById('app-main');
  if (main) {
    const existing = main.querySelector('.review-progress');
    if (existing) existing.remove();
    const progressEl = document.createElement('div');
    progressEl.className = 'review-progress';
    progressEl.innerHTML = `
      <div class="review-progress__bar" style="width: ${(session.currentIdx / session.poems.length) * 100}%"></div>
      <span class="review-progress__text">${progress}</span>
    `;
    main.insertBefore(progressEl, main.firstChild);
  }
}

/**
 * 显示复习报告
 * @param {HTMLElement} container
 * @param {Object} session
 */
function showReviewReport(container, session) {
  const summary = summarizeReview(session);

  const resultsHtml = session.results.map((r, i) => {
    const poem = session.poems.find(p => p.id === r.poemId);
    return `
      <li class="review-report__item">
        <span class="review-report__num">${i + 1}.</span>
        <span class="review-report__title">${poem ? poem.title : r.poemId}</span>
        <span class="review-report__mode">${modeLabel(r.mode)}</span>
        <span class="review-report__score review-report__score--${scoreClass(r.score)}">${r.score}</span>
      </li>
    `;
  }).join('');

  container.innerHTML = `
    <div class="review-report">
      <h2 class="review-report__title">🎉 今日复习完成</h2>
      <div class="review-report__stats">
        <div class="review-report__stat review-report__stat--mastered">
          <div class="review-report__stat-num">${summary.mastered}</div>
          <div class="review-report__stat-label">已掌握</div>
        </div>
        <div class="review-report__stat review-report__stat--review">
          <div class="review-report__stat-num">${summary.needReview}</div>
          <div class="review-report__stat-label">待巩固</div>
        </div>
        <div class="review-report__stat">
          <div class="review-report__stat-num">${summary.avgScore}</div>
          <div class="review-report__stat-label">平均分</div>
        </div>
      </div>
      <h3 class="review-report__subtitle">本轮详情</h3>
      <ul class="review-report__list">${resultsHtml}</ul>
      <div class="review-report__actions">
        <a href="#/" class="btn btn--primary">返回首页</a>
        <button class="btn" data-action="restart">再来一轮</button>
      </div>
    </div>
  `;

  container.querySelector('[data-action="restart"]').addEventListener('click', () => {
    renderReviewPage(container);
  });

  // 通知首页刷新"今日待复习"数字
  window.dispatchEvent(new CustomEvent('shiyun:review-complete', {
    detail: { summary, session },
  }));
}

function statusLabel(status) {
  return ({
    new: '新诗',
    learning: '学习中',
    reviewing: '复习中',
    mastered: '已掌握',
  })[status] || status;
}

function modeLabel(mode) {
  return ({
    fill: '填空',
    choice: '选择',
    order: '排序',
    listen: '听诗',
  })[mode] || mode;
}

function scoreClass(score) {
  if (score >= 90) return 'high';
  if (score >= 70) return 'mid';
  return 'low';
}

// 导出给 main.js 路由用
export default { renderReviewPage, buildReviewSession, getDuePoemsForReview };
```

### 3.2 在 `src/js/main.js` 中接入复习路由

[如果 Task 10 已把 `renderReviewPlaceholder` 占位，实现时改为：]

```javascript
import { renderReviewPage } from './ui/review.js';

// 在 routes 表中替换占位
const routes = {
  '#/': renderHome,
  '#/learn': renderLearnPlaceholder,
  '#/review': renderReviewPage,  // 修改此处
  // ... 其他
};
```

### 3.3 在 `src/js/ui/home.js` 中显示"今日复习"卡片

[如果 home.js 已实现，本任务追加 review 卡片的"待复习数"刷新逻辑：]

```javascript
// 在 home.js 中
import { getDuePoems } from '../srs.js';

function updateReviewCount() {
  const dueCount = getDuePoems().length;
  const el = document.querySelector('[data-review-count]');
  if (el) el.textContent = dueCount;
}

// 监听复习完成事件
window.addEventListener('shiyun:review-complete', updateReviewCount);
```

### 3.4 在 `src/css/main.css` 追加复习页面样式

```css
/* ===== 复习页面 ===== */
.review-page { padding: 1rem; max-width: 600px; margin: 0 auto; }
.review-page__header { text-align: center; margin-bottom: 1.5rem; }
.review-page__title { margin: 0; font-size: 1.6rem; }
.review-page__subtitle { color: #7f8c8d; margin: 0.5rem 0; }
.review-page__count { color: #dc3545; font-size: 1.5rem; }
.review-page__empty { text-align: center; padding: 3rem 1rem; }
.review-page__config {
  background: #fff; padding: 1rem; border-radius: 12px;
  margin-bottom: 1rem; display: flex; gap: 1rem; flex-wrap: wrap;
}
.review-page__field { display: flex; align-items: center; gap: 0.5rem; flex: 1; min-width: 200px; }
.review-page__field select {
  flex: 1; padding: 0.5rem; border: 1px solid #e0e6ed;
  border-radius: 6px; font-size: 1rem;
}
.review-page__list { list-style: none; padding: 0; margin: 1rem 0; }
.review-page__item {
  display: flex; align-items: center; gap: 0.6rem;
  padding: 0.8rem 1rem; margin-bottom: 0.4rem;
  background: #fff; border-radius: 8px;
  border-left: 4px solid #4a90e2;
}
.review-page__num { color: #7f8c8d; min-width: 1.5em; }
.review-page__poem-title { flex: 1; font-weight: 500; }
.review-page__poem-author { color: #7f8c8d; font-size: 0.9rem; }
.review-page__poem-status {
  padding: 0.2rem 0.6rem; border-radius: 12px;
  font-size: 0.8rem; background: #f5f7fa;
}
.review-page__poem-status--mastered { background: #d4edda; color: #28a745; }
.review-page__poem-status--reviewing { background: #fff3cd; color: #f39c12; }
.review-page__poem-status--learning { background: #cce5ff; color: #4a90e2; }
.review-page__actions { text-align: center; margin-top: 1.5rem; }
.btn--large { padding: 1rem 2rem; font-size: 1.1rem; }

/* 复习进度条 */
.review-progress {
  position: relative; height: 6px;
  background: #e0e6ed; border-radius: 3px;
  margin-bottom: 0.5rem; overflow: hidden;
}
.review-progress__bar {
  height: 100%; background: #4a90e2;
  transition: width 0.3s;
}
.review-progress__text {
  position: absolute; top: 8px; right: 1rem;
  font-size: 0.8rem; color: #7f8c8d;
}

/* 复习报告 */
.review-report { padding: 1rem; max-width: 600px; margin: 0 auto; }
.review-report__title { text-align: center; font-size: 1.6rem; margin: 0 0 1.5rem; }
.review-report__stats {
  display: grid; grid-template-columns: repeat(3, 1fr);
  gap: 0.8rem; margin-bottom: 1.5rem;
}
.review-report__stat {
  text-align: center; padding: 1rem;
  background: #fff; border-radius: 12px;
}
.review-report__stat--mastered { background: #d4edda; }
.review-report__stat--review { background: #fff3cd; }
.review-report__stat-num { font-size: 2rem; font-weight: bold; color: #4a90e2; }
.review-report__stat-label { font-size: 0.9rem; color: #7f8c8d; margin-top: 0.3rem; }
.review-report__subtitle { color: #2c3e50; }
.review-report__list { list-style: none; padding: 0; }
.review-report__item {
  display: flex; align-items: center; gap: 0.6rem;
  padding: 0.6rem 0.8rem; margin-bottom: 0.3rem;
  background: #fff; border-radius: 8px;
}
.review-report__score { font-weight: bold; min-width: 40px; text-align: right; }
.review-report__score--high { color: #28a745; }
.review-report__score--mid { color: #f39c12; }
.review-report__score--low { color: #dc3545; }
.review-report__actions { text-align: center; margin-top: 1.5rem; }
```

## Step 4: 运行测试验证通过

```bash
npm test -- tests/review-flow.test.js
```

Expected: PASS（15+ 个测试，覆盖 buildReviewSession、pickQuizMode、processReviewResult、summarizeReview、getDuePoems）

## Step 5: 提交

```bash
git add src/js/ui/review.js src/js/main.js src/js/ui/home.js src/css/main.css tests/review-flow.test.js
git commit -m "feat(review): 复习流程（待复习列表 + 逐首考核 + 报告 + 进度更新）"
```

## 完成标志

```bash
echo done > .tasks/done/19
```

## 关键说明

1. **流程控制是核心**：复习 = "待复习列表 → 循环考核 → 更新 SRS → 报告"。所有逻辑在 `runReviewSession()` 一个递归函数里完成。
2. **混合模式自动适配**：`pickQuizMode({mode:'mixed'}, poem)` 根据 poem 自动排除不可用的模式（无音频 → 排除 listen；无 keySentences → 排除 fill/order），剩下随机选。
3. **SRS 更新时机**：考核 `onComplete` 回调里立即调 `processReviewResult()` → 内部调 `nextReview(poemId, score)`，不阻塞 UI。
4. **事件解耦**：复习完成后用 `window.dispatchEvent('shiyun:review-complete')` 通知首页刷新数字，无需直接调用 home.js。
5. **首页集成点**：`home.js` 监听 `shiyun:review-complete` 事件 + 初次渲染时调 `getDuePoems().length` 显示数字。
6. **空状态**：没有待复习诗时显示鼓励文案 + "去学新诗"按钮（链接到 `#/learn`）。
7. **报告统计口径**：mastered = ≥90 分；needReview = 70-89 + <70（都算待巩固）。平均分四舍五入。

## 依赖关系

- **被依赖：** 无（4 个考核模式 + 复习流程已完成，可作为 MVP 演示）
- **依赖：** Task 12（srs.js）、Task 15-18（4 个 quiz 模式）、Task 10（main.js 路由）

## 后续任务提示

- Task 20（进度管理）：会读 `quizHistory`（已由本任务的 `processReviewResult` 写入）和 `poemProgress`
- Task 24（端到端测试）：会覆盖复习流程
- Task 19 是 MVP 完整的最后一块：有了它，孩子日常的"学 → 复习 → 巩固 → 复习"循环就完整了