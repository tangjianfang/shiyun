/**
 * main.js initApp 测试 — 应用唯一入口，编排：
 * - 加载 splash 进度条 20→55→75→90→100
 * - loadPoemMeta
 * - createRouter + start
 * - 触发首屏路由
 * - 高亮 tab
 * - 短暂延迟后淡出 splash
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// 模拟所有 UI 模块（initApp 不展开它们，只验证调用与 splash 节奏）
vi.mock('../src/js/ui/home.js',     () => ({ renderHome:      vi.fn() }));
vi.mock('../src/js/ui/learn.js',    () => ({ renderLearnPage:  vi.fn(), renderPoemDetail: vi.fn() }));
vi.mock('../src/js/ui/review.js',   () => ({ renderReviewPage: vi.fn() }));
vi.mock('../src/js/ui/quiz.js',     () => ({ startQuiz:         vi.fn() }));
vi.mock('../src/js/ui/progress.js', () => ({ renderProgressPage: vi.fn() }));
vi.mock('../src/js/ui/cloud.js',    () => ({ renderCloudPage:   vi.fn() }));
vi.mock('../src/js/ui/print.js',    () => ({ renderPrintPage:   vi.fn() }));
vi.mock('../src/js/data.js',        () => ({ loadPoemMeta:      vi.fn(), getPoem: vi.fn(), getAllPoems: vi.fn(() => []) }));

import { initApp } from '../src/js/main.js';
import { loadPoemMeta } from '../src/js/data.js';
import { renderHome } from '../src/js/ui/home.js';
import { renderLearnPage } from '../src/js/ui/learn.js';
import { renderCloudPage } from '../src/js/ui/cloud.js';

function makeSplash() {
  document.body.innerHTML = `
    <div id="splash-screen">
      <div id="splash-bar"></div>
      <div id="splash-stage"></div>
    </div>
    <div id="app-main"></div>
    <a class="tab" data-tab="home">Home</a>
    <a class="tab" data-tab="learn">Learn</a>
    <a class="tab" data-tab="cloud">Cloud</a>
  `;
}

describe('initApp', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.location.hash = '';
    makeSplash();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  it('应调用 loadPoemMeta', () => {
    initApp();
    expect(loadPoemMeta).toHaveBeenCalled();
  });

  it('应将 splash-bar 设到 100%', () => {
    initApp();
    const bar = document.getElementById('splash-stage');
    expect(bar.textContent).toBe('完成！');
  });

  it('应触发当前 hash 路由（默认 #/ → renderHome）', () => {
    window.location.hash = '#/';
    initApp();
    expect(renderHome).toHaveBeenCalledTimes(1);
  });

  it('应触发 #/learn → renderLearnPage', () => {
    window.location.hash = '#/learn';
    initApp();
    expect(renderLearnPage).toHaveBeenCalledTimes(1);
  });

  it('应触发 #/cloud → renderCloudPage', () => {
    window.location.hash = '#/cloud';
    initApp();
    expect(renderCloudPage).toHaveBeenCalledTimes(1);
  });

  it('splash 屏 160ms 后应淡出并移除', () => {
    initApp();
    const splash = document.getElementById('splash-screen');
    expect(splash).toBeTruthy();
    vi.advanceTimersByTime(160);
    // 淡出开始（opacity:0），但还没 remove
    expect(splash.style.opacity).toBe('0');
    vi.advanceTimersByTime(420);
    expect(document.getElementById('splash-screen')).toBeNull();
  });

  it('hashchange 后应高亮对应 tab', () => {
    initApp();
    window.location.hash = '#/cloud';
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    const cloudTab = document.querySelector('[data-tab="cloud"]');
    const homeTab  = document.querySelector('[data-tab="home"]');
    expect(cloudTab.classList.contains('active')).toBe(true);
    expect(homeTab.classList.contains('active')).toBe(false);
  });

  it('#/poem 路由应高亮 learn tab 而非 poem tab', () => {
    initApp();
    window.location.hash = '#/poem/g1-上-01';
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    const learnTab = document.querySelector('[data-tab="learn"]');
    expect(learnTab.classList.contains('active')).toBe(true);
  });
});
