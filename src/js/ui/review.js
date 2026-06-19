/**
 * 复习流程 UI
 *
 * 流程：
 *   1. 首页 "今日复习" 卡片显示待复习数
 *   2. 进入复习页，列出所有待复习诗
 *   3. 用户点击 "开始" → 逐首进入考核（默认填空）
 *   4. 完成一题 → processReviewResult 更新进度 + 记录结果
 *   5. 全部完成 → 显示复习报告 + 更新首页数字
 */

import { getTodayReviewList, nextReview } from '../srs.js';
import { getPoem, getAllPoems } from '../data.js';
import { getCurrentUserId, getPoemProgress, updatePoemProgress, addQuizHistory } from '../storage.js';
import { startQuiz } from './quiz.js';
import { badge, emptyState, esc } from './components.js';

const AVAILABLE_MODES = ['fill', 'choice', 'order', 'listen'];

export function buildReviewSession(opts = {}) {
  const config = {
    mode: opts.mode || 'fill',
    grades: opts.grades || null,
    statuses: opts.statuses || null,
    limit: opts.limit || null,
  };

  const userId = getCurrentUserId();
  const allProgress = JSON.parse(localStorage.getItem('shiyun_user_state') || '{}')?.users?.[userId]?.poemProgress || {};
  let poemIds = getTodayReviewList(allProgress);

  if (config.grades && config.grades.length > 0) {
    poemIds = poemIds.filter(id => {
      const p = getPoem(id);
      return p && config.grades.includes(p.grade);
    });
  }
  if (config.statuses && config.statuses.length > 0) {
    poemIds = poemIds.filter(id => {
      const p = getPoemProgress(userId, id);
      return p && config.statuses.includes(p.status);
    });
  }

  if (config.limit && poemIds.length > config.limit) {
    poemIds = poemIds.slice(0, config.limit);
  }

  const poems = poemIds.map(id => {
    const poem = getPoem(id);
    const progress = getPoemProgress(userId, id);
    return {
      id,
      title: poem ? poem.title : id,
      author: poem ? poem.author : '',
      grade: poem ? poem.grade : 0,
      status: progress ? progress.status : 'new',
    };
  });

  return {
    poems,
    poemIds,
    currentIdx: 0,
    results: [],
    config,
  };
}

export function pickQuizMode(config, poem) {
  if (!config || !config.mode || config.mode === 'fill') return 'fill';
  if (config.mode && config.mode !== 'mixed') return config.mode;

  const candidates = AVAILABLE_MODES.filter(mode => isModeAvailable(mode, poem));
  if (candidates.length === 0) return 'choice';
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function isModeAvailable(mode, poem) {
  if (!poem) return true;
  switch (mode) {
    case 'fill':
    case 'order':
      return !!(poem.keySentences && poem.keySentences.length > 0) &&
             (poem.content && poem.content.length >= 2);
    case 'listen':
      return !!poem.audio;
    case 'choice':
    default:
      return true;
  }
}

export function processReviewResult(session, poemId, result) {
  const userId = getCurrentUserId();
  const current = getPoemProgress(userId, poemId) || {};
  const srsResult = nextReview(current, result.score);

  updatePoemProgress(userId, poemId, {
    status: srsResult.status,
    nextReviewAt: srsResult.nextReviewAt,
    interval: srsResult.interval,
    easeFactor: srsResult.easeFactor,
    recentScores: srsResult.recentScores,
  });
  addQuizHistory(userId, {
    poemId,
    score: result.score,
    mode: result.mode,
    at: new Date().toISOString(),
  });

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
    else needReview++;
  }
  return {
    total,
    mastered,
    needReview,
    avgScore: Math.round(sum / total),
  };
}

export function getDuePoemsForReview() {
  const userId = getCurrentUserId();
  const allProgress = JSON.parse(localStorage.getItem('shiyun_user_state') || '{}')?.users?.[userId]?.poemProgress || {};
  return getTodayReviewList(allProgress);
}

// === UI 渲染 ===

export function renderReviewPage(container = document.getElementById('app-main')) {
  const userId = getCurrentUserId();
  const allProgress = JSON.parse(localStorage.getItem('shiyun_user_state') || '{}')?.users?.[userId]?.poemProgress || {};
  const poemIds = getTodayReviewList(allProgress);
  const count = poemIds.length;

  if (count === 0) {
    container.innerHTML = `<div class="content-wrap">${emptyState({
      icon: '🎉',
      title: '今日复习全部完成啦！',
      body: '明天还会有新的复习任务，今天先去学新诗吧～',
      action: `<a href="#/learn" class="btn btn--primary">去学新诗</a>`,
    })}</div>`;
    return;
  }

  container.innerHTML = `
    <div class="content-wrap fade-in">
      <header class="page-head">
        <h1 class="page-head__title">🔁 今日复习</h1>
        <p class="page-head__sub">待复习 <strong>${count}</strong> 首诗词</p>
      </header>

      <div class="card" style="margin-bottom:var(--s-5);">
        <div style="display:flex;gap:var(--s-5);flex-wrap:wrap;align-items:center;">
          <label style="display:flex;align-items:center;gap:var(--s-3);">
            <span class="text-sm">考核模式：</span>
            <select class="input select review-page__mode" style="width:auto;">
              <option value="fill">填空（推荐）</option>
              <option value="choice">选择</option>
              <option value="order">排序</option>
              <option value="listen">听诗</option>
              <option value="mixed">混合</option>
            </select>
          </label>
          <label style="display:flex;align-items:center;gap:var(--s-3);">
            <span class="text-sm">每次数量：</span>
            <select class="input select review-page__limit" style="width:auto;">
              <option value="">全部 ${count} 首</option>
              <option value="5">5 首</option>
              <option value="10">10 首</option>
              <option value="20">20 首</option>
            </select>
          </label>
          <button class="btn btn--primary" data-action="start">开始复习 →</button>
        </div>
      </div>

      <div class="review-list">
        ${poemIds.map((id, i) => {
          const poem = getPoem(id);
          const progress = getPoemProgress(userId, id);
          const status = (progress?.status) || 'new';
          return `
            <div class="card" style="display:flex;align-items:center;gap:var(--s-3);">
              <span class="text-meta" style="min-width:2rem;">${i + 1}.</span>
              <span style="flex:1;font-family:var(--font-zh-display);font-size:1.05rem;">${esc(poem?.title || id)}</span>
              <span class="text-sm" style="color:var(--ink-500);">${esc(poem?.author || '')}</span>
              ${badge(status)}
            </div>`;
        }).join('')}
      </div>
    </div>
  `;

  container.querySelector('[data-action="start"]')?.addEventListener('click', () => {
    const mode = container.querySelector('.review-page__mode').value;
    const limitVal = container.querySelector('.review-page__limit').value;
    const limit = limitVal ? parseInt(limitVal, 10) : null;
    const session = buildReviewSession({ mode, limit });
    if (session.poems.length === 0) return;
    runReviewSession(container, session);
  });
}

function runReviewSession(container, session) {
  if (session.currentIdx >= session.poems.length) {
    showReviewReport(container, session);
    return;
  }

  const currentPoemMeta = session.poems[session.currentIdx];
  const poem = getPoem(currentPoemMeta.id);
  if (!poem) {
    session.currentIdx++;
    runReviewSession(container, session);
    return;
  }

  const mode = pickQuizMode(session.config, poem);
  const progress = `${session.currentIdx + 1} / ${session.poems.length}`;

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

  startQuiz(poem, mode, {
    onComplete: (score, result) => {
      processReviewResult(session, poem.id, { ...result, score });
      runReviewSession(container, session);
    },
    onExit: () => {
      if (session.results.length > 0) {
        showReviewReport(container, session);
      } else {
        if (main) {
          const prog = main.querySelector('.review-progress');
          if (prog) prog.remove();
        }
        renderReviewPage(container);
      }
    },
  });
}

function showReviewReport(container, session) {
  const summary = summarizeReview(session);
  const main = container.closest('#app-main') || document.getElementById('app-main');
  if (main) { const prog = main.querySelector('.review-progress'); if (prog) prog.remove(); }

  const stars = summary.avgScore >= 90 ? '⭐⭐⭐' : summary.avgScore >= 70 ? '⭐⭐' : '⭐';

  container.innerHTML = `
    <div class="content-wrap fade-in">
      <div class="review-result card" style="max-width:500px;margin:var(--s-7) auto;">
        <div style="text-align:center;margin-bottom:var(--s-5);">
          <div class="review-result__stars">${stars}</div>
          <h2 style="font-family:var(--font-zh-display);font-size:var(--fs-h1);margin:var(--s-3) 0;">复习完成！</h2>
          <p class="text-meta">${summary.avgScore >= 90 ? '优秀，保持下去！' : summary.avgScore >= 70 ? '不错，继续加油！' : '再接再厉，多多练习～'}</p>
        </div>
        <div class="home-grid" style="margin-bottom:var(--s-5);">
          <div class="stat-card">
            <div class="stat-card__label">本次复习</div>
            <div class="stat-card__value">${summary.total}<span class="stat-card__unit">首</span></div>
          </div>
          <div class="stat-card">
            <div class="stat-card__label">已掌握</div>
            <div class="stat-card__value stat-card__value--jade">${summary.mastered}</div>
          </div>
          <div class="stat-card">
            <div class="stat-card__label">平均得分</div>
            <div class="stat-card__value">${summary.avgScore}</div>
          </div>
        </div>
        <div style="display:flex;gap:var(--s-3);justify-content:center;flex-wrap:wrap;">
          <a href="#/" class="btn btn--primary">返回首页</a>
          <button class="btn btn--secondary" data-action="restart">再来一轮</button>
        </div>
      </div>
    </div>
  `;

  container.querySelector('[data-action="restart"]')?.addEventListener('click', () => renderReviewPage(container));

  window.dispatchEvent(new CustomEvent('shiyun:review-complete', { detail: { summary, session } }));
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

export default { renderReviewPage, buildReviewSession, getDuePoemsForReview };
