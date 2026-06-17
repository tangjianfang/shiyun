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
import { renderLearnPlaceholder } from './ui/learn.js';
import { renderReviewPage } from './ui/review.js';
import { startQuiz } from './ui/quiz.js';
import { renderProgressPlaceholder } from './ui/progress.js';
import { renderPoemDetail } from './ui/learn.js';

const routes = {
  '#/': renderHome,
  '#/learn': renderLearnPlaceholder,
  '#/review': renderReviewPage,
  '#/quiz': (params) => {
    const poemId = new URLSearchParams(location.hash.split('?')[1] || '').get('poemId');
    if (poemId) {
      const { getPoem } = window.__shiyun || {};
    }
    const main = document.getElementById('app-main');
    setContent('<div class="placeholder">请从诗词详情页进入考核</div>');
  },
  '#/progress': renderProgressPlaceholder,
  '#/poem/:id': renderPoemDetail,
};

function setContent(html) {
  const main = document.getElementById('app-main');
  if (main) main.innerHTML = html;
}

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

// 暴露 navigate 便于调试
window.__shiyun = { navigate, getCurrentRoute };

// 自动启动
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
}
