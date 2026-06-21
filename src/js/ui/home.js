/**
 * 首页 UI — 明亮国风版
 */

import { getUser, getCurrentUserId, getPoemProgress } from '../storage.js';
import { getTodayReviewList } from '../srs.js';
import { poems, getPoemsBySemester, ALL_SEMESTERS } from '../data.js';
import { renderUserSwitcher } from './user-switcher.js';
import { statCard, emptyState, esc, icon } from './components.js';

export function renderHome() {
  const main = document.getElementById('app-main');
  if (!main) return;

  // 渲染用户切换器到侧边栏底部
  const switcherSlot = document.getElementById('user-switcher-slot');
  if (switcherSlot) renderUserSwitcher(switcherSlot, () => renderHome());

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
  const userName = esc(user?.name || '小朋友');

  main.innerHTML = `
    <div class="content-wrap fade-in">
      <header class="page-head">
        <p class="page-head__greeting">${formatDate(today)} · ${getGreeting()}</p>
        <h1 class="page-head__title">${userName}，你好！</h1>
      </header>

      <!-- 今日待复习横幅 -->
      <article class="card card--accent review-banner">
        <div class="review-banner__info">
          <div class="review-banner__label">今日待复习</div>
          <div class="review-banner__count-wrap">
            <span class="review-banner__num">${reviewCount}</span>
            <span class="review-banner__unit">首</span>
          </div>
          <p class="review-banner__hint">${reviewCount > 0 ? '科学间隔复习，记忆更深久' : '今日复习全部完成啦 🎉'}</p>
        </div>
        <a href="#/review" class="btn ${reviewCount > 0 ? 'btn--primary btn--lg' : 'btn--secondary'}">
          ${reviewCount > 0 ? '开始复习 →' : '查看进度'}
        </a>
      </article>

      <!-- 学习概览 -->
      <div class="home-grid">
        ${statCard({ label: '已学', value: learnedCount, unit: `/ ${totalCount}`, pct: (learnedCount / totalCount) * 100 })}
        ${statCard({ label: '已掌握', value: masteredCount, unit: `/ ${totalCount}`, mod: 'stat-card__value--jade', pct: (masteredCount / totalCount) * 100 })}
        ${statCard({ label: '待复习', value: reviewCount, mod: 'stat-card__value--amber', pct: Math.min(100, (reviewCount / 20) * 100) })}
      </div>

      <!-- 快捷入口 -->
      <div class="home-quick">
        <a href="#/learn" class="card card--interactive quick-card">
          <div class="quick-card__icon">${icon('book', 26)}</div>
          <span class="quick-card__label">学新诗</span>
        </a>
        <a href="#/review" class="card card--interactive quick-card">
          <div class="quick-card__icon">${icon('refresh', 26)}</div>
          <span class="quick-card__label">今日复习</span>
        </a>
        <a href="#/quiz" class="card card--interactive quick-card">
          <div class="quick-card__icon">${icon('edit', 26)}</div>
          <span class="quick-card__label">闯关考核</span>
        </a>
        <a href="#/progress" class="card card--interactive quick-card">
          <div class="quick-card__icon">${icon('chart', 26)}</div>
          <span class="quick-card__label">我的进度</span>
        </a>
      </div>

      <!-- 12 学期时间线：上学之旅 -->
      <section class="home-semesters">
        <header class="home-semesters__head">
          <h2 class="home-semesters__title">📚 上学之旅 · 12 个学期</h2>
          <p class="home-semesters__sub">按部编版小学语文教材 1-6 年级上下册排布。点击进入该学期诗列表。</p>
        </header>
        <div class="home-semesters__grid">
          ${ALL_SEMESTERS.map((s, i) => {
            const semPoems = getPoemsBySemester(s.grade, s.semester);
            const total = semPoems.length;
            const learned = semPoems.filter(p => {
              const prog = userProgress[p.id];
              return prog && prog.status && prog.status !== 'new';
            }).length;
            const mastered = semPoems.filter(p => {
              const prog = userProgress[p.id];
              return prog && prog.status === 'mastered';
            }).length;
            const pct = total > 0 ? Math.round((learned / total) * 100) : 0;
            const isCurrent = i === Math.min(...ALL_SEMESTERS.map((s2, idx) => {
              const sp = getPoemsBySemester(s2.grade, s2.semester);
              const l = sp.filter(p => userProgress[p.id]?.status === 'mastered').length;
              return l < sp.length ? idx : 999;
            }));
            return `
              <a class="sem-card ${isCurrent ? 'sem-card--current' : ''}"
                 href="#/learn?grade=${s.grade}&sem=${encodeURIComponent(s.semester)}">
                <header class="sem-card__head">
                  <span class="sem-card__idx">${i + 1}</span>
                  <span class="sem-card__label">${s.label}</span>
                </header>
                <div class="sem-card__progress">
                  <div class="sem-card__bar" style="width:${pct}%"></div>
                </div>
                <div class="sem-card__meta">
                  <span class="sem-card__count">${learned}/${total}</span>
                  <span class="sem-card__pct">${pct}%</span>
                </div>
                ${mastered > 0 ? `<span class="sem-card__badge">⭐ ${mastered}</span>` : ''}
              </a>
            `;
          }).join('')}
        </div>
      </section>

      <!-- 每日格言 -->
      <aside class="card" style="margin-top:var(--s-6);text-align:center;border-style:dashed;">
        <p style="font-family:var(--font-zh-display);font-style:italic;color:var(--ink-500);font-size:1.05rem;">"${esc(pickQuote())}"</p>
      </aside>
    </div>
  `;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 6)  return '夜深了';
  if (h < 11) return '早上好';
  if (h < 14) return '午安';
  if (h < 18) return '下午好';
  return '晚上好';
}
function formatDate(d) {
  return `${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日`;
}
const QUOTES = [
  '读书百遍，其义自见。',
  '熟读唐诗三百首，不会作诗也会吟。',
  '不积跬步，无以至千里。',
  '问渠那得清如许，为有源头活水来。',
  '少壮不努力，老大徒伤悲。',
  '书读百遍，其义自见。',
  '旧书不厌百回读，熟读深思子自知。',
];
function pickQuote() {
  return QUOTES[Math.floor(Math.random() * QUOTES.length)];
}
