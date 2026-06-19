/**
 * 学习版主入口 · 明亮国风版
 */

import { createRouter, navigate } from './router.js';
import { loadPoemMeta, getPoem, getAllPoems } from './data.js';
import { renderHome } from './ui/home.js';
import { renderLearnPage, renderPoemDetail } from './ui/learn.js';
import { renderReviewPage } from './ui/review.js';
import { startQuiz } from './ui/quiz.js';
import { renderProgressPage } from './ui/progress.js';
import { renderCloudPage } from './ui/cloud.js';

const routes = {
  '#/': () => renderHome(),
  '#/learn': () => renderLearnPage(),
  '#/poem/:id': (id) => renderPoemDetail(id),
  '#/review': () => renderReviewPage(),
  '#/quiz': (params) => {
    const poemId = new URLSearchParams(location.hash.split('?')[1] || '').get('poemId');
    const poem = poemId ? getPoem(poemId) : getAllPoems().find(p => p.keySentences && p.keySentences.length > 0);
    if (!poem) { navigate('#/learn'); return; }
    startQuiz(poem, 'fill');
  },
  '#/cloud': () => renderCloudPage(),
  '#/progress': () => renderProgressPage(),
  '#/styleguide': () => renderStyleGuide(),
};

export function initApp() {
  // ── 加载进度更新工具 ──
  function setSplash(pct, stage) {
    const bar = document.getElementById('splash-bar');
    const stageEl = document.getElementById('splash-stage');
    if (bar) bar.style.width = pct + '%';
    if (stageEl && stage) stageEl.textContent = stage;
  }
  function hideSplash() {
    const el = document.getElementById('splash-screen');
    if (!el) return;
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 420);
  }

  setSplash(20, '加载诗词数据…');
  loadPoemMeta();
  setSplash(55, '初始化路由…');
  const router = createRouter(routes);
  setSplash(75, '启动应用…');
  router.start();
  setSplash(90, '渲染页面…');
  router.handleRoute();
  highlightActiveTab();
  window.addEventListener('hashchange', highlightActiveTab);
  setSplash(100, '完成！');
  // 短暂停留让进度跑满，然后淡出
  setTimeout(hideSplash, 160);
}

function highlightActiveTab() {
  const hash = location.hash || '#/';
  const route = hash.split('?')[0];
  const tabKey = route.startsWith('#/poem') ? 'learn' : route.replace('#/', '').split('/')[0] || 'home';
  // 同时更新侧边栏 + 底部 tab
  document.querySelectorAll('[data-tab]').forEach(el => {
    el.classList.toggle('active', el.dataset.tab === tabKey);
  });
}

// ── Style Guide（开发用，访问 #/styleguide 可见） ──
function renderStyleGuide() {
  const main = document.getElementById('app-main');
  if (!main) return;
  main.innerHTML = `
    <div class="styleguide">
      <h1 style="font-family:var(--font-zh-display);font-size:var(--fs-h1);color:var(--cinnabar-500);margin-bottom:var(--s-6);">
        诗云 · Style Guide
      </h1>

      <h2>色彩 Tokens</h2>
      <div class="styleguide-row">
        ${[
          ['--paper-0','宣纸底'],['--paper-1','卡片底'],['--paper-2','分隔'],
          ['--cinnabar-500','朱砂'],['--indigo-600','青黛'],
          ['--jade-600','黛绿'],['--amber-600','藤黄'],
          ['--ink-900','墨色'],['--ink-500','辅色'],['--ink-300','禁用'],
        ].map(([v, n]) => `
          <div style="display:flex;flex-direction:column;align-items:center;gap:4px;">
            <div class="color-swatch" style="background:var(${v});"></div>
            <span style="font-size:11px;color:var(--ink-500);">${n}</span>
          </div>`).join('')}
      </div>

      <h2>按钮</h2>
      <div class="styleguide-row">
        <button class="btn btn--primary">主按钮</button>
        <button class="btn btn--primary btn--lg">大主按钮</button>
        <button class="btn btn--secondary">次按钮</button>
        <button class="btn btn--ghost">幽灵</button>
        <button class="btn btn--danger">危险</button>
        <button class="btn btn--primary" disabled>禁用</button>
        <button class="btn btn--icon btn--secondary" aria-label="示例">⭐</button>
      </div>

      <h2>徽章</h2>
      <div class="styleguide-row">
        <span class="badge badge--new">未学</span>
        <span class="badge badge--learning">学习中</span>
        <span class="badge badge--review">待复习</span>
        <span class="badge badge--mastered">已掌握</span>
      </div>

      <h2>Chip 筛选</h2>
      <div class="styleguide-row">
        <button class="chip chip--active">全部年级</button>
        <button class="chip">1 年级</button>
        <button class="chip">2 年级</button>
        <button class="chip chip--answer">静夜思</button>
        <button class="chip chip--answer chip--correct">春晓 ✓</button>
        <button class="chip chip--answer chip--wrong">望岳 ✗</button>
      </div>

      <h2>卡片</h2>
      <div class="styleguide-row">
        <div class="card" style="width:200px;">基础卡</div>
        <div class="card card--interactive" style="width:200px;">可交互卡（hover 我）</div>
        <div class="card card--accent" style="width:200px;">朱砂强调卡</div>
      </div>

      <h2>音频控件</h2>
      <div class="audio-bar" style="max-width:400px;">
        <button class="btn btn--primary audio-bar__play">▶ 播放</button>
        <div class="audio-bar__speed">
          <button class="audio-bar__speed-btn audio-bar__speed-btn--active">常速</button>
          <button class="audio-bar__speed-btn">慢速</button>
        </div>
        <button class="btn btn--ghost btn--icon audio-bar__fav" aria-label="收藏">☆</button>
      </div>

      <h2>Toast</h2>
      <div class="styleguide-row">
        <button class="btn btn--secondary" onclick="(function(){var c=document.getElementById('toast-container');var el=document.createElement('div');el.className='toast toast--success';el.textContent='已收藏 ⭐';c.appendChild(el);setTimeout(()=>el.remove(),2700)})()">触发 Toast</button>
      </div>

      <h2>空状态</h2>
      <div class="empty-state" style="border:1px dashed var(--paper-edge);border-radius:var(--r-lg);max-width:360px;">
        <div class="empty-state__icon">🔍</div>
        <div class="empty-state__title">没有找到相关诗词</div>
        <p class="empty-state__body">换个词试试，或清除筛选条件吧～</p>
        <button class="btn btn--primary btn--sm">去浏览全部</button>
      </div>
    </div>
  `;
}

if (typeof window !== 'undefined') {
  window.__shiyun = { navigate };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
}
