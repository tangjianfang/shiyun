# Task 10: 学习版 HTML 骨架 + 路由

**依赖：** 1, 3
**并行组：** learning-skeleton
**估时：** 1 天

**Files:**
- Create: `src/learning.html`
- Create: `src/css/main.css`
- Create: `src/js/router.js`
- Create: `src/js/ui/home.js`

## Step 1: 写失败的测试

[本任务为 UI 骨架，路由逻辑使用 vitest + jsdom 验证，UI 渲染手动验证。]

```javascript
// tests/router.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createRouter, navigate, getCurrentRoute } from '../src/js/router.js';

describe('router', () => {
  beforeEach(() => {
    // 重置 hash
    window.location.hash = '';
  });

  it('createRouter 应注册路由表', () => {
    const routes = { '#/': () => 'home' };
    const router = createRouter(routes);
    expect(router.routes).toEqual(routes);
  });

  it('navigate 应更新 window.location.hash', () => {
    navigate('#/learn');
    expect(window.location.hash).toBe('#/learn');
  });

  it('getCurrentRoute 应返回当前 hash（无 hash 时默认为 #/）', () => {
    window.location.hash = '';
    expect(getCurrentRoute()).toBe('#/');
    window.location.hash = '#/learn';
    expect(getCurrentRoute()).toBe('#/learn');
  });
});
```

## Step 2: 运行测试验证失败

```bash
npm test -- tests/router.test.js
```

Expected: FAIL with "Cannot find module '../src/js/router.js'"

## Step 3: 实现最小代码

### 3.1 创建 `src/learning.html`

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <meta name="theme-color" content="#4a90e2">
  <title>诗云 · 古诗词学习</title>
  <link rel="stylesheet" href="./css/main.css">
</head>
<body>
  <!-- 顶部用户栏 -->
  <header class="app-header">
    <div class="app-header__user">
      <span class="app-header__avatar" id="user-avatar">🐯</span>
      <span class="app-header__name" id="user-name">小明</span>
    </div>
    <h1 class="app-header__title">诗云</h1>
    <button class="app-header__settings" id="settings-btn" aria-label="设置">⚙️</button>
  </header>

  <!-- 主内容区 -->
  <main id="app-main" class="app-main">
    <!-- 路由渲染目标 -->
    <div class="loading">加载中…</div>
  </main>

  <!-- 底部 Tab 导航 -->
  <nav class="tab-bar" role="navigation">
    <a href="#/" class="tab-bar__item" data-tab="home">
      <span class="tab-bar__icon">🏠</span>
      <span class="tab-bar__label">首页</span>
    </a>
    <a href="#/learn" class="tab-bar__item" data-tab="learn">
      <span class="tab-bar__icon">📚</span>
      <span class="tab-bar__label">学习</span>
    </a>
    <a href="#/review" class="tab-bar__item" data-tab="review">
      <span class="tab-bar__icon">🔄</span>
      <span class="tab-bar__label">复习</span>
    </a>
    <a href="#/quiz" class="tab-bar__item" data-tab="quiz">
      <span class="tab-bar__icon">✏️</span>
      <span class="tab-bar__label">考核</span>
    </a>
    <a href="#/progress" class="tab-bar__item" data-tab="progress">
      <span class="tab-bar__icon">📊</span>
      <span class="tab-bar__label">进度</span>
    </a>
  </nav>

  <!-- ES Modules 入口（构建时会内嵌） -->
  <script type="module" src="./js/main.js"></script>
  <script type="module">
    // 直接 import 以便双击 HTML 时也能工作（开发态）
    import { initApp } from './js/main.js';
    initApp();
  </script>
</body>
</html>
```

### 3.2 创建 `src/js/main.js`（骨架入口）

```javascript
/**
 * 学习版主入口
 * - 初始化路由
 * - 加载诗词数据
 * - 渲染首页
 */

import { createRouter, navigate, getCurrentRoute } from './router.js';
import { loadPoemMeta } from './data.js';
import { renderHome } from './ui/home.js';
import { getUser, getCurrentUserId } from './storage.js';

const routes = {
  '#/': renderHome,
  '#/learn': renderLearnPlaceholder,
  '#/review': renderReviewPlaceholder,
  '#/quiz': renderQuizPlaceholder,
  '#/progress': renderProgressPlaceholder,
  '#/poem/:id': renderPoemDetailPlaceholder,
};

export function initApp() {
  // 1. 加载元数据
  loadPoemMeta();

  // 2. 更新顶部用户信息
  updateHeaderUser();

  // 3. 注册路由
  const router = createRouter(routes);
  router.start();

  // 4. 首次渲染
  router.handleRoute();

  // 5. 监听 hashchange（由 router 内部处理，保留此处注释便于追踪）
  window.addEventListener('hashchange', () => router.handleRoute());

  // 6. 设置按钮（占位）
  document.getElementById('settings-btn')?.addEventListener('click', () => {
    alert('设置：切换用户、导出/导入进度（即将上线）');
  });
}

function updateHeaderUser() {
  const userId = getCurrentUserId();
  const user = getUser(userId);
  if (!user) return;
  const avatarEl = document.getElementById('user-avatar');
  const nameEl = document.getElementById('user-name');
  if (avatarEl) avatarEl.textContent = user.avatar || '🐯';
  if (nameEl) nameEl.textContent = user.name || '小明';
}

// 占位 UI（后续任务实现）
function renderLearnPlaceholder() { setContent('<div class="placeholder">📚 学习模块（Task 13/14 即将实现）</div>'); }
function renderReviewPlaceholder() { setContent('<div class="placeholder">🔄 复习模块（Task 19 即将实现）</div>'); }
function renderQuizPlaceholder() { setContent('<div class="placeholder">✏️ 考核模块（Task 15-18 即将实现）</div>'); }
function renderProgressPlaceholder() { setContent('<div class="placeholder">📊 进度模块（Task 20 即将实现）</div>'); }
function renderPoemDetailPlaceholder(params) { setContent(`<div class="placeholder">诗词详情：${params.id}（Task 13 即将实现）</div>`); }

function setContent(html) {
  const main = document.getElementById('app-main');
  if (main) main.innerHTML = html;
}

// 暴露 navigate 便于调试
window.__shiyun = { navigate, getCurrentRoute };
```

### 3.3 创建 `src/js/router.js`

```javascript
/**
 * 简易 Hash 路由
 * - 支持静态路由 '#/learn'
 * - 支持参数路由 '#/poem/:id'，匹配时把参数对象传给 handler
 * - hashchange 事件触发路由
 */

export function createRouter(routes) {
  const router = {
    routes,
    start() {
      window.addEventListener('hashchange', () => this.handleRoute());
      return this;
    },
    handleRoute() {
      const hash = getCurrentRoute();
      // 1. 优先匹配参数路由
      for (const pattern in this.routes) {
        if (pattern.includes(':')) {
          const params = matchRoute(pattern, hash);
          if (params) {
            try { this.routes[pattern](params); } catch (e) { console.error('路由 handler 错误:', e); }
            highlightActiveTab(hash);
            return;
          }
        }
      }
      // 2. 精确匹配
      const handler = this.routes[hash];
      if (handler) {
        try { handler(); } catch (e) { console.error('路由 handler 错误:', e); }
      } else {
        console.warn('未匹配路由:', hash);
        const fallback = this.routes['#/'];
        if (fallback) fallback();
      }
      highlightActiveTab(hash);
    },
  };
  return router;
}

/** 编程式导航 */
export function navigate(hash) {
  if (!hash.startsWith('#')) hash = '#' + hash;
  if (window.location.hash === hash) {
    // 强制触发
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  } else {
    window.location.hash = hash;
  }
}

/** 获取当前 hash，没有则返回 '#/' */
export function getCurrentRoute() {
  return window.location.hash || '#/';
}

/** 把 :param 模式转成正则 */
function patternToRegex(pattern) {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
  const regexStr = escaped.replace(/:(\w+)/g, '(?<$1>[^/]+)');
  return new RegExp('^' + regexStr + '$');
}

/** 匹配模式，返回参数对象或 null */
function matchRoute(pattern, hash) {
  const regex = patternToRegex(pattern);
  const m = hash.match(regex);
  if (!m) return null;
  return m.groups || {};
}

/** 高亮底部 tab */
function highlightActiveTab(hash) {
  const items = document.querySelectorAll('.tab-bar__item');
  items.forEach(item => {
    const href = item.getAttribute('href') || '';
    let active = false;
    if (href === '#/' && hash === '#/') active = true;
    else if (href !== '#/' && hash.startsWith(href)) active = true;
    else if (hash.startsWith('#/poem/') && href === '#/learn') active = true;
    item.classList.toggle('tab-bar__item--active', active);
  });
}
```

### 3.4 创建 `src/js/ui/home.js`

```javascript
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
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  return `${y}年${m}月${day}日 星期${weekdays[d.getDay()]}`;
}

const QUOTES = [
  '读书破万卷，下笔如有神。',
  '书山有路勤为径，学海无涯苦作舟。',
  '黑发不知勤学早，白首方悔读书迟。',
  '少壮不努力，老大徒伤悲。',
  '一日不读书，胸臆无佳想。',
  '熟读唐诗三百首，不会作诗也会吟。',
];
function pickQuote() { return QUOTES[Math.floor(Math.random() * QUOTES.length)]; }
```

### 3.5 创建 `src/css/main.css`

```css
/* ===== CSS 变量（设计 token） ===== */
:root {
  --color-primary: #4a90e2;
  --color-success: #28a745;
  --color-warning: #f39c12;
  --color-danger: #dc3545;
  --color-bg: #f5f7fa;
  --color-card: #ffffff;
  --color-text: #2c3e50;
  --color-text-light: #7f8c8d;
  --color-border: #e1e4e8;

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;

  --radius-sm: 6px;
  --radius-md: 12px;
  --radius-lg: 20px;

  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.06);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.08);

  --font-kai: "STKaiti", "KaiTi", "楷体", serif;
  --font-mono: "SF Mono", Consolas, Monaco, monospace;
  --font-sans: "PingFang SC", "Microsoft YaHei", "Hiragino Sans GB", sans-serif;

  --tab-height: 60px;
  --header-height: 56px;
}

/* ===== Reset ===== */
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { height: 100%; }
body {
  font-family: var(--font-sans);
  font-size: 16px;
  color: var(--color-text);
  background: var(--color-bg);
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}
a { color: inherit; text-decoration: none; }
button {
  font-family: inherit; font-size: inherit; cursor: pointer;
  border: none; background: none; color: inherit;
}

/* ===== 顶部 Header ===== */
.app-header {
  position: sticky; top: 0; z-index: 100;
  height: var(--header-height);
  background: var(--color-primary);
  color: white;
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 var(--space-4);
  box-shadow: var(--shadow-sm);
}
.app-header__user { display: flex; align-items: center; gap: var(--space-2); min-width: 80px; }
.app-header__avatar { font-size: 24px; }
.app-header__name { font-weight: 500; }
.app-header__title { font-size: 18px; font-weight: 600; }
.app-header__settings { font-size: 22px; padding: var(--space-2); }

/* ===== 主内容区 ===== */
.app-main {
  min-height: calc(100vh - var(--header-height) - var(--tab-height));
  padding: var(--space-4);
  padding-bottom: calc(var(--tab-height) + var(--space-4));
}

/* ===== 底部 Tab Bar ===== */
.tab-bar {
  position: fixed; bottom: 0; left: 0; right: 0; z-index: 100;
  height: var(--tab-height);
  background: white;
  border-top: 1px solid var(--color-border);
  display: flex;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.04);
}
.tab-bar__item {
  flex: 1;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 2px;
  color: var(--color-text-light);
  font-size: 12px;
  transition: color 0.2s;
}
.tab-bar__icon { font-size: 22px; }
.tab-bar__item--active { color: var(--color-primary); font-weight: 600; }

/* ===== 首页 ===== */
.home__welcome { margin-bottom: var(--space-4); }
.home__greeting { font-size: 22px; font-weight: 600; margin-bottom: var(--space-1); }
.home__date { color: var(--color-text-light); font-size: 14px; }

.home__review-card {
  display: flex; align-items: center; gap: var(--space-4);
  padding: var(--space-4) var(--space-5);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  margin-bottom: var(--space-4);
}
.home__review-card--has { background: linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%); color: white; }
.home__review-card--none { background: white; color: var(--color-text); border: 1px dashed var(--color-border); }
.home__review-icon { font-size: 36px; }
.home__review-content { flex: 1; }
.home__review-title { font-size: 14px; opacity: 0.9; }
.home__review-count { font-size: 28px; font-weight: 700; }
.home__review-btn {
  background: rgba(255, 255, 255, 0.3);
  color: white;
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-sm);
  font-weight: 600;
  backdrop-filter: blur(4px);
}
.home__review-btn:disabled { background: var(--color-bg); color: var(--color-text-light); cursor: default; }
.home__review-card--none .home__review-btn { background: var(--color-bg); color: var(--color-text-light); }

.home__stats {
  display: grid; grid-template-columns: repeat(3, 1fr);
  gap: var(--space-3);
  margin-bottom: var(--space-5);
}
.home__stat {
  background: white; border-radius: var(--radius-md);
  padding: var(--space-4);
  text-align: center;
  box-shadow: var(--shadow-sm);
}
.home__stat-num { font-size: 28px; font-weight: 700; color: var(--color-primary); }
.home__stat-label { font-size: 13px; color: var(--color-text-light); margin-top: var(--space-1); }

.home__entries {
  display: grid; grid-template-columns: repeat(4, 1fr);
  gap: var(--space-3);
  margin-bottom: var(--space-5);
}
.home__entry {
  display: flex; flex-direction: column; align-items: center; gap: var(--space-2);
  background: white; border-radius: var(--radius-md);
  padding: var(--space-4) var(--space-2);
  box-shadow: var(--shadow-sm);
  transition: transform 0.2s;
}
.home__entry:active { transform: scale(0.96); }
.home__entry-icon { font-size: 32px; }
.home__entry-label { font-size: 14px; }

.home__quote {
  background: white; border-radius: var(--radius-md);
  padding: var(--space-4);
  text-align: center;
  color: var(--color-text-light);
  font-family: var(--font-kai);
  font-size: 15px;
  box-shadow: var(--shadow-sm);
}

/* ===== Placeholder ===== */
.placeholder {
  background: white; border-radius: var(--radius-md);
  padding: var(--space-6); text-align: center;
  color: var(--color-text-light);
  box-shadow: var(--shadow-sm);
}

/* ===== Loading ===== */
.loading {
  display: flex; align-items: center; justify-content: center;
  height: 200px;
  color: var(--color-text-light);
}

/* ===== 响应式 ===== */
@media (max-width: 380px) {
  .home__entries { grid-template-columns: repeat(2, 1fr); }
  .home__stat-num { font-size: 22px; }
}
@media (min-width: 768px) {
  body { max-width: 768px; margin: 0 auto; background: white; }
  .app-main { padding: var(--space-5); }
}
@media (min-width: 1024px) {
  body { max-width: 1024px; }
}
```

### 3.6 创建 storage.js 和 srs.js 的 stub（让 home.js 加载不报错）

`src/js/storage.js`（占位，完整实现在 Task 11）：

```javascript
/**
 * localStorage 封装（占位 - Task 11 完整实现）
 * 此处提供最小接口，让 Task 10 骨架可运行。
 */

const KEY = 'shiyun_user_state';
const DEFAULT_USER_ID = 'xiaoming';

function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

function ensureState() {
  let s = loadState();
  if (s) return s;
  s = {
    version: '1.0.0',
    currentUser: DEFAULT_USER_ID,
    users: {
      [DEFAULT_USER_ID]: {
        name: '小明',
        avatar: '🐯',
        grade: 3,
        createdAt: new Date().toISOString(),
        poemProgress: {},
        quizHistory: [],
        achievements: [],
      },
    },
  };
  localStorage.setItem(KEY, JSON.stringify(s));
  return s;
}

ensureState(); // 初始化默认用户

export function getUser(userId) {
  const s = loadState();
  if (!s) return null;
  return s.users[userId] || null;
}

export function getCurrentUserId() {
  const s = loadState();
  return s ? s.currentUser : DEFAULT_USER_ID;
}

export function getPoemProgress(userId, poemId) {
  const u = getUser(userId);
  if (!u) return null;
  return u.poemProgress[poemId] || null;
}
```

`src/js/srs.js`（占位，完整实现在 Task 12）：

```javascript
/**
 * SM-2 算法（占位 - Task 12 完整实现）
 */

export function getTodayReviewList(userProgress, today) {
  if (!userProgress) return [];
  const todayStr = (today || new Date()).toISOString().slice(0, 10);
  return Object.entries(userProgress)
    .filter(([_, p]) => p.nextReviewAt && p.nextReviewAt <= todayStr)
    .map(([id]) => id);
}
```

## Step 4: 运行测试验证通过

```bash
npm test -- tests/router.test.js
```

Expected: PASS (3+ tests)

## Step 5: 提交

```bash
git add src/learning.html src/css/main.css src/js/router.js src/js/ui/home.js src/js/main.js src/js/storage.js src/js/srs.js tests/router.test.js
git commit -m "feat(learning): 学习版 HTML 骨架 + 路由 + 首页"
```

## 完成标志

```bash
echo done > .tasks/done/10
```

## 关键说明

- **学习版最终单 HTML**：构建脚本（Task 23）会内嵌所有 CSS/JS；源码用 ES Modules 便于开发
- **路由参数**：`#/poem/:id` 用正则把 `id` 提取出来传给 handler，下游 Task 13 详情页用得上
- **storage/srs 占位**：本任务为骨架，先让首页能渲染；Task 11/12 完整实现后即可替换
- **响应式**：移动优先（max-width 380），平板（768）以上居中限制最大宽度
- **BEM 命名**：block__element--modifier（如 `home__review-card--has`）
