/**
 * 首页 UI
 * - 顶部欢迎语（用户姓名 + 日期）
 * - 今日待复习卡片（从 SRS 算法取数）
 * - 4 个快捷入口（学新诗 / 今日复习 / 随机考核 / 我的进度）
 */

import { getUser, getCurrentUserId, getPoemProgress } from '../storage.js';
import { getTodayReviewList } from '../srs.js';
import { poems } from '../data.js';
import { navigate } from '../router.js';

export function renderHome() {
  const main = document.getElementById('app-main');
  if (!main) return;

  const userId = getCurrentUserId();
  const user = getUser(userId);

  // 1. 收集所有诗词进度
  const userProgress = {};
  for (const poem of poems.values()) {
    const progress = getPoemProgress(userId, poem.id);
    if (progress) userProgress[poem.id] = progress;
  }

  // 2. 今日待复习
  const today = new Date();
  const reviewList = getTodayReviewList(userProgress, today);
  const reviewCount = reviewList.length;

  // 3. 统计
  const totalCount = poems.size;
  const learnedCount = Object.values(userProgress).filter(p => p.status !== 'new').length;
  const masteredCount = Object.values(userProgress).filter(p => p.status === 'mastered').length;

  // 4. 渲染
  main.innerHTML = `
    <section class="home">
      <div class="home__welcome">
        <h2 class="home__greeting">${getGreeting()}，${user?.name || '小朋友'} 👋</h2>
        <p class="home__date">${formatDate(today)}</p>
      </div>

      <div class="home__review-card home__review-card--${reviewCount > 0 ? 'has' : 'none'}">
        <div class="home__review-icon">🔄</div>
        <div class="home__review-content">
          <div class="home__review-title">今日待复习</div>
          <div class="home__review-count">${reviewCount} 首</div>
        </div>
        <button class="home__review-btn" id="home-start-review" ${reviewCount === 0 ? 'disabled' : ''}>
          ${reviewCount > 0 ? '开始复习' : '今日完成 ✓'}
        </button>
      </div>

      <div class="home__stats">
        <div class="home__stat">
          <div class="home__stat-num">${learnedCount}</div>
          <div class="home__stat-label">已学</div>
        </div>
        <div class="home__stat">
          <div class="home__stat-num">${masteredCount}</div>
          <div class="home__stat-label">已掌握</div>
        </div>
        <div class="home__stat">
          <div class="home__stat-num">${totalCount}</div>
          <div class="home__stat-label">总数</div>
        </div>
      </div>

      <div class="home__entries">
        <a href="#/learn" class="home__entry">
          <span class="home__entry-icon">📚</span>
          <span class="home__entry-label">学新诗</span>
        </a>
        <a href="#/review" class="home__entry">
          <span class="home__entry-icon">🔄</span>
          <span class="home__entry-label">复习</span>
        </a>
        <a href="#/quiz" class="home__entry">
          <span class="home__entry-icon">✏️</span>
          <span class="home__entry-label">考核</span>
        </a>
        <a href="#/progress" class="home__entry">
          <span class="home__entry-icon">📊</span>
          <span class="home__entry-label">进度</span>
        </a>
      </div>

      <div class="home__quote">
        <p>"${pickQuote()}"</p>
      </div>
    </section>
  `;

  // 绑定"开始复习"按钮
  document.getElementById('home-start-review')?.addEventListener('click', () => {
    navigate('#/review');
  });
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 6) return '夜深了';
  if (h < 12) return '早上好';
  if (h < 18) return '下午好';
  return '晚上好';
}

function formatDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}年${m}月${day}日`;
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
