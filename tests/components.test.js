/**
 * 组件纯函数测试 — 覆盖 src/js/ui/components.js
 * 多数组件是 HTML 字符串生成器（无 DOM 副作用），单测即覆盖全部。
 * showToast / icon 涉及 DOM 时用 jsdom 真实节点。
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  esc, icon, badge, statCard, poemCard, emptyState, showToast,
  skeletonCard, audioBar,
} from '../src/js/ui/components.js';

describe('esc（HTML 转义）', () => {
  it('空/undefined 应返回空串', () => {
    expect(esc()).toBe('');
    expect(esc(null)).toBe('');
    expect(esc(undefined)).toBe('');
  });
  it('应转义 & < > "', () => {
    expect(esc('a&b')).toBe('a&amp;b');
    expect(esc('<script>')).toBe('&lt;script&gt;');
    expect(esc('"hi"')).toBe('&quot;hi&quot;');
  });
  it('不应转义中文/英文', () => {
    expect(esc('你好世界')).toBe('你好世界');
    expect(esc('hello world')).toBe('hello world');
  });
  it('应把数字/布尔转字符串', () => {
    expect(esc(42)).toBe('42');
    expect(esc(true)).toBe('true');
  });
  it('XSS 注入：title="<img src=x onerror=alert(1)>" 应被中和', () => {
    const out = esc('<img src=x onerror=alert(1)>');
    expect(out).not.toContain('<img');
    expect(out).toContain('&lt;img');
  });
});

describe('icon（SVG 图标）', () => {
  it('已知图标应返回内联 SVG', () => {
    const svg = icon('play', 18);
    expect(svg).toContain('<svg');
    expect(svg).toContain('width="18"');
    expect(svg).toContain('height="18"');
  });
  it('未知图标应返回空串', () => {
    expect(icon('nonexistent-icon')).toBe('');
  });
  it('默认 size 24', () => {
    const svg = icon('book');
    expect(svg).toContain('width="24"');
  });
  it('play/star 应 fill=currentColor（实心），其它应 stroke=currentColor（线性）', () => {
    expect(icon('play')).toContain('fill="currentColor"');
    expect(icon('star')).toContain('fill="currentColor"');
    expect(icon('book')).toContain('fill="none"');
    expect(icon('home')).toContain('fill="none"');
  });
  it('应标记 aria-hidden', () => {
    expect(icon('home')).toContain('aria-hidden="true"');
  });
});

describe('badge（状态徽章）', () => {
  it.each([
    ['new',      'badge--new'],
    ['learning', 'badge--learning'],
    ['review',   'badge--review'],
    ['mastered', 'badge--mastered'],
  ])('%s → %s', (status, cls) => {
    expect(badge(status)).toContain(cls);
  });
  it('未知状态应回退到 new', () => {
    expect(badge('weird')).toContain('badge--new');
  });
});

describe('statCard（统计卡）', () => {
  it('pct=0 时不应生成 inline width 样式', () => {
    const out = statCard({ label: '已学', value: 12, unit: '首' });
    expect(out).toContain('stat-card');
    expect(out).toContain('已学');
    expect(out).toContain('12');
    expect(out).toContain('首');
    expect(out).not.toMatch(/width:0%/);
  });
  it('pct=50 应生成 width:50% 进度条', () => {
    const out = statCard({ label: '进度', value: 50, unit: '%', pct: 50 });
    expect(out).toContain('width:50%');
  });
  it('pct > 100 应被 clamp 到 100', () => {
    expect(statCard({ label: 'x', value: 1, pct: 150 })).toContain('width:100%');
  });
  it('pct <= 0 时不应渲染进度条（空 style）', () => {
    expect(statCard({ label: 'x', value: 1, pct: 0 })).toMatch(/style=""\s*><\/div>/);
    expect(statCard({ label: 'x', value: 1, pct: -10 })).toMatch(/style=""\s*><\/div>/);
  });
  it('应使用 esc 防止 XSS', () => {
    const out = statCard({ label: '<script>', value: 'evil' });
    expect(out).not.toContain('<script>');
  });
});

describe('poemCard（诗词卡）', () => {
  const poem = { title: '静夜思', author: '李白', dynasty: '唐', content: ['床前明月光', '疑是地上霜'] };
  it('应渲染标题+朝代·作者+首行预览', () => {
    const out = poemCard({ poem, status: 'new' });
    expect(out).toContain('静夜思');
    expect(out).toContain('唐·李白');
    expect(out).toContain('床前明月光');
  });
  it('status 应渲染对应徽章', () => {
    expect(poemCard({ poem, status: 'mastered' })).toContain('badge--mastered');
    expect(poemCard({ poem, status: 'review' })).toContain('badge--review');
  });
  it('onclick 应注入到 attribute', () => {
    const out = poemCard({ poem, status: 'new', onclick: "window.location.hash='#/poem/g1-上-01'" });
    expect(out).toContain('onclick="window.location.hash=\'#/poem/g1-上-01\'"');
  });
  it('XSS 注入：title 含 < 应被转义', () => {
    const out = poemCard({ poem: { ...poem, title: '<img onerror=alert(1)>' }, status: 'new' });
    expect(out).not.toContain('<img onerror');
  });
  it('空 content 时不应渲染预览', () => {
    const out = poemCard({ poem: { ...poem, content: [] }, status: 'new' });
    expect(out).not.toContain('poem-card__preview');
  });
});

describe('emptyState（空状态）', () => {
  it('应渲染 title 和 body', () => {
    const out = emptyState({ title: '暂无数据', body: '请先添加' });
    expect(out).toContain('暂无数据');
    expect(out).toContain('请先添加');
  });
  it('未传 icon 应使用默认 inbox SVG', () => {
    const out = emptyState({ title: '空' });
    expect(out).toContain('<svg');
  });
  it('传 emoji icon 应直接使用', () => {
    const out = emptyState({ icon: '🔍', title: '没找到' });
    expect(out).toContain('🔍');
  });
  it('XSS 注入应被 esc 拦截', () => {
    const out = emptyState({ title: '<script>alert(1)</script>' });
    expect(out).not.toContain('<script>');
  });
});

describe('skeletonCard（骨架屏）', () => {
  it('应返回 3 个 skeleton 块', () => {
    const out = skeletonCard();
    const matches = out.match(/class="skeleton"/g) || [];
    expect(matches.length).toBe(3);
  });
  it('应标记 aria-hidden', () => {
    expect(skeletonCard()).toContain('aria-hidden="true"');
  });
});

describe('audioBar（音频控件）', () => {
  it('hasSrc=true 时应包含播放按钮和速度按钮', () => {
    const out = audioBar({ hasSrc: true, favored: false });
    expect(out).toContain('audio-bar__play');
    expect(out).toContain('data-speed="1"');
    expect(out).toContain('data-speed="0.6"');
  });
  it('favored=true 时收藏按钮应标记 active + aria-pressed=true', () => {
    const out = audioBar({ hasSrc: true, favored: true });
    expect(out).toContain('audio-bar__fav--active');
    expect(out).toContain('aria-pressed="true"');
    expect(out).toContain('aria-label="取消收藏"');
  });
  it('favored=false 时 aria-label 应该是"收藏此诗"', () => {
    const out = audioBar({ hasSrc: true, favored: false });
    expect(out).toContain('aria-label="收藏此诗"');
  });
});

describe('showToast（DOM 副作用）', () => {
  let container;
  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  });
  afterEach(() => {
    container?.remove();
    vi.useRealTimers();
  });

  it('应在 toast-container 中追加节点并设 textContent', () => {
    showToast('已收藏', 'success');
    const toast = container.querySelector('.toast');
    expect(toast).toBeTruthy();
    expect(toast.textContent).toBe('已收藏');
    expect(toast.className).toContain('toast--success');
  });

  it('default 类型不应加修饰 class', () => {
    showToast('hi');
    const toast = container.querySelector('.toast');
    expect(toast.className).toBe('toast');
  });

  it('2.7s 后应自动移除', () => {
    vi.useFakeTimers();
    showToast('快闪');
    expect(container.children.length).toBe(1);
    vi.advanceTimersByTime(2700);
    expect(container.children.length).toBe(0);
  });

  it('无 toast-container 时应静默 noop（不抛）', () => {
    container.remove();
    expect(() => showToast('no-op')).not.toThrow();
  });
});
