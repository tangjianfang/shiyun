/**
 * 首页 UI — 水墨赛博版
 */

import { getUser, getCurrentUserId, getPoemProgress } from '../storage.js';
import { getTodayReviewList } from '../srs.js';
import { poems } from '../data.js';
import { renderUserSwitcher } from './user-switcher.js';

export function renderHome() {
  const main = document.getElementById('app-main');
  if (!main) return;

  // 渲染用户切换器到侧边栏底部
  const switcherSlot = document.getElementById('user-switcher-slot');
  if (switcherSlot) {
    renderUserSwitcher(switcherSlot, () => renderHome());
  }

  const userId = getCurrentUserId();
  const user = getUser(userId);

  const userProgress = {};
  for (const poem of poems.values()) {
    const progress = getPoemProgress(userId, poem.id);
    if (progress) userProgress[poem.id] = progress;
  }

  const today = new Date();
  const reviewList = getTodayReviewList(userProgress, today);
  const reviewCount = reviewList.length;

  const totalCount = poems.size;
  const learnedCount = Object.values(userProgress).filter(p => p.status !== 'new').length;
  const masteredCount = Object.values(userProgress).filter(p => p.status === 'mastered').length;

  main.innerHTML = `
    <header class="page-head fade-in">
      <div class="page-head__title">
        <span class="eyebrow">${formatDate(today)} · ${getPeriod()}</span>
        <h1>${user?.name || '小朋友'}，${getGreeting()}</h1>
      </div>
      <div class="page-head__meta">
        <span class="page-head__meta-dot"></span>
        <span>SYSTEM ONLINE · ${totalCount} poems</span>
      </div>
    </header>

    <section class="home">
      <article class="card card--glow fade-in" style="margin-bottom: var(--s-5);">
        <div style="display:flex;align-items:center;gap:var(--s-5);flex-wrap:wrap;">
          <div style="flex:1;min-width:240px;">
            <div class="eyebrow" style="margin-bottom:var(--s-3);">今日待复习</div>
            <div style="display:flex;align-items:baseline;gap:var(--s-3);">
              <span style="font-family:var(--font-mono);font-size:5rem;font-weight:600;color:var(--cinnabar);line-height:1;letter-spacing:-0.04em;font-variant-numeric:tabular-nums;">${String(reviewCount).padStart(2, '0')}</span>
              <span style="font-family:var(--font-zh-display);font-size:1.5rem;color:var(--text-md);">首</span>
            </div>
            <p style="margin-top:var(--s-3);color:var(--text-lo);font-size:13px;">${reviewCount > 0 ? '科学的间隔复习让记忆更深' : '今日复习已完成 ✓'}</p>
          </div>
          <a href="#/review" class="btn ${reviewCount > 0 ? 'btn--primary' : 'btn--ghost'} btn--lg">
            ${reviewCount > 0 ? '开始复习 →' : '查看进度'}
          </a>
        </div>
      </article>

      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:var(--s-4);margin-bottom:var(--s-5);">
        <div class="stat-card fade-in">
          <div class="stat-card__label">已学 / Learned</div>
          <div class="stat-card__value">${String(learnedCount).padStart(3, '0')}<span class="stat-card__unit">/ ${totalCount}</span></div>
          <div class="stat-card__bar" style="width:${(learnedCount / totalCount) * 100}%"></div>
        </div>
        <div class="stat-card fade-in">
          <div class="stat-card__label">已掌握 / Mastered</div>
          <div class="stat-card__value jade">${String(masteredCount).padStart(3, '0')}</div>
          <div class="stat-card__bar" style="width:${(masteredCount / totalCount) * 100}%;background:linear-gradient(90deg,var(--jade),transparent)"></div>
        </div>
        <div class="stat-card fade-in">
          <div class="stat-card__label">待复习 / Queue</div>
          <div class="stat-card__value gold">${String(reviewCount).padStart(3, '0')}</div>
          <div class="stat-card__bar" style="width:${Math.min(100, (reviewCount / 20) * 100)}%;background:linear-gradient(90deg,var(--gold),transparent)"></div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:var(--s-4);">
        <a href="#/learn" class="card fade-in" style="text-decoration:none;display:block;cursor:pointer;transition:all var(--t-base) var(--ease);">
          <div style="font-family:var(--font-mono);font-size:11px;color:var(--text-lo);letter-spacing:0.15em;text-transform:uppercase;">01 / Learn</div>
          <h3 style="margin:var(--s-2) 0;">学新诗 ↗</h3>
          <p style="color:var(--text-lo);font-size:13px;margin:0;">浏览 112 首诗词，朗读 · 收藏</p>
        </a>
        <a href="#/review" class="card fade-in" style="text-decoration:none;display:block;cursor:pointer;">
          <div style="font-family:var(--font-mono);font-size:11px;color:var(--text-lo);letter-spacing:0.15em;text-transform:uppercase;">02 / Review</div>
          <h3 style="margin:var(--s-2) 0;">今日复习 ↻</h3>
          <p style="color:var(--text-lo);font-size:13px;margin:0;">SM-2 算法智能安排</p>
        </a>
        <a href="#/quiz" class="card fade-in" style="text-decoration:none;display:block;cursor:pointer;">
          <div style="font-family:var(--font-mono);font-size:11px;color:var(--text-lo);letter-spacing:0.15em;text-transform:uppercase;">03 / Quiz</div>
          <h3 style="margin:var(--s-2) 0;">考核 ✦</h3>
          <p style="color:var(--text-lo);font-size:13px;margin:0;">填空 · 选择 · 排序 · 听诗</p>
        </a>
        <a href="#/progress" class="card fade-in" style="text-decoration:none;display:block;cursor:pointer;">
          <div style="font-family:var(--font-mono);font-size:11px;color:var(--text-lo);letter-spacing:0.15em;text-transform:uppercase;">04 / Stats</div>
          <h3 style="margin:var(--s-2) 0;">进度 ▤</h3>
          <p style="color:var(--text-lo);font-size:13px;margin:0;">学习曲线 · 成就徽章</p>
        </a>
      </div>

      <aside class="card fade-in" style="margin-top:var(--s-6);background:transparent;border-style:dashed;border-color:var(--ink-line-hi);text-align:center;">
        <p style="font-family:var(--font-zh-display);font-style:italic;color:var(--text-md);font-size:1.05rem;margin:0;">"${pickQuote()}"</p>
      </aside>
    </section>
  `;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 6) return '夜深了';
  if (h < 11) return '早安';
  if (h < 14) return '午安';
  if (h < 18) return '下午好';
  return '晚上好';
}
function getPeriod() {
  const h = new Date().getHours();
  if (h < 6) return 'NIGHT';
  if (h < 12) return 'MORNING';
  if (h < 18) return 'AFTERNOON';
  return 'EVENING';
}
function formatDate(d) {
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}
const QUOTES = [
  '读书百遍，其义自见。',
  '熟读唐诗三百首，不会作诗也会吟。',
  '不积跬步，无以至千里。',
  '问渠那得清如许，为有源头活水来。',
  '少壮不努力，老大徒伤悲。',
];
function pickQuote() {
  return QUOTES[Math.floor(Math.random() * QUOTES.length)];
}
