/**
 * 学习版主入口 · 水墨赛博版
 */

import { createRouter, navigate } from './router.js';
import { loadPoemMeta } from './data.js';
import { renderHome } from './ui/home.js';
import { renderLearnPage, renderPoemDetail } from './ui/learn.js';
import { renderReviewPage } from './ui/review.js';
import { startQuiz } from './ui/quiz.js';
import { renderProgressPage } from './ui/progress.js';

const routes = {
  '#/': () => renderHome(),
  '#/learn': () => renderLearnPage(),
  '#/poem/:id': (id) => renderPoemDetail(id),
  '#/review': () => renderReviewPage(),
  '#/quiz': (params) => {
    const poemId = new URLSearchParams(location.hash.split('?')[1] || '').get('poemId');
    startQuiz(poemId);
  },
  '#/progress': () => renderProgressPage(),
};

export function initApp() {
  loadPoemMeta();
  const router = createRouter(routes);
  router.start();
  router.handleRoute();
  highlightActiveTab();
  window.addEventListener('hashchange', highlightActiveTab);
}

function highlightActiveTab() {
  const hash = location.hash || '#/';
  const route = hash.split('?')[0];
  const tabKey = route.startsWith('#/poem') ? 'learn' : route.replace('#/', '').split('/')[0] || 'home';
  document.querySelectorAll('.tab-bar__item').forEach(el => {
    el.classList.toggle('active', el.dataset.tab === tabKey);
  });
}

if (typeof window !== 'undefined') {
  window.__shiyun = { navigate };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
}
