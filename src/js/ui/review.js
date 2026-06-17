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

export function renderReviewPage(container) {
  const userId = getCurrentUserId();
  const allProgress = JSON.parse(localStorage.getItem('shiyun_user_state') || '{}')?.users?.[userId]?.poemProgress || {};
  const poemIds = getTodayReviewList(allProgress);
  const count = poemIds.length;

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
          ${poemIds.map((id, i) => {
            const poem = getPoem(id);
            const progress = getPoemProgress(userId, id);
            return `
              <li class="review-page__item" data-id="${id}">
                <span class="review-page__num">${i + 1}.</span>
                <span class="review-page__poem-title">${poem ? poem.title : id}</span>
                <span class="review-page__poem-author">${poem && poem.author ? poem.author : ''}</span>
                <span class="review-page__poem-status review-page__poem-status--${progress ? progress.status : 'new'}">${statusLabel(progress ? progress.status : 'new')}</span>
              </li>
            `;
          }).join('')}
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
  if (main) {
    const prog = main.querySelector('.review-progress');
    if (prog) prog.remove();
  }

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

export default { renderReviewPage, buildReviewSession, getDuePoemsForReview };
