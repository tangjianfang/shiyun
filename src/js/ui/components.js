/**
 * 诗云 · UI 公共组件生成器
 * 纯函数，返回 HTML 字符串或 DOM Element，供各页面复用。
 * 不依赖任何外部状态；只产出结构与 class，不含内联 style。
 */

// ── HTML 转义 ──
export function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── SVG 线性图标库（离线内联，无字体依赖） ──
const ICON_PATHS = {
  home:    '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5"/><path d="M9.5 21v-6h5v6"/>',
  book:    '<path d="M12 6.5C10.5 5 8 4.3 4.5 4.5v13C8 17.3 10.5 18 12 19.5"/><path d="M12 6.5C13.5 5 16 4.3 19.5 4.5v13C16 17.3 13.5 18 12 19.5"/><path d="M12 6.5v13"/>',
  refresh: '<path d="M3.5 12a8.5 8.5 0 0 1 14.5-6l2 2"/><path d="M20.5 12a8.5 8.5 0 0 1-14.5 6l-2-2"/><path d="M20 4v4h-4"/><path d="M4 20v-4h4"/>',
  edit:    '<path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4z"/><path d="M14 6l3 3"/>',
  chart:   '<path d="M4 20V10"/><path d="M10 20V4"/><path d="M16 20v-6"/><path d="M22 20H2"/>',
  cloud:   '<path d="M17.5 19a4.5 4.5 0 0 0 0-9 6 6 0 0 0-11.5 2A4 4 0 0 0 6 19z"/>',
  play:    '<path d="M7 5.5v13l11-6.5z"/>',
  pause:   '<path d="M8 5v14"/><path d="M16 5v14"/>',
  star:    '<path d="m12 3 2.7 5.7 6.3.9-4.5 4.4 1.1 6.3L12 17.8 6.4 20.3l1.1-6.3L3 9.6l6.3-.9z"/>',
  inbox:   '<path d="M3 13h5l2 3h4l2-3h5"/><path d="M5 13 7 5h10l2 8v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1z"/>',
  clock:   '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  check:   '<path d="M20 6 9 17l-5-5"/>',
  sparkle: '<path d="M12 3v18"/><path d="M3 12h18"/><path d="m5.6 5.6 12.8 12.8"/><path d="m18.4 5.6-12.8 12.8"/>',
};

/**
 * 返回内联 SVG 图标字符串。stroke 跟随 currentColor。
 * @param {string} name  ICON_PATHS 的键
 * @param {number} size  像素尺寸，默认 24
 */
export function icon(name, size = 24) {
  const paths = ICON_PATHS[name];
  if (!paths) return '';
  const fillNames = new Set(['play', 'star']);
  const fill = fillNames.has(name) ? 'currentColor' : 'none';
  const stroke = fillNames.has(name) ? 'none' : 'currentColor';
  return `<svg class="icon" viewBox="0 0 24 24" width="${size}" height="${size}" fill="${fill}" stroke="${stroke}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
}

// ── 状态徽章 ──
const BADGE_MAP = {
  new:      { cls: 'badge--new',      label: '未学' },
  learning: { cls: 'badge--learning', label: '学习中' },
  review:   { cls: 'badge--review',   label: '待复习' },
  mastered: { cls: 'badge--mastered', label: '已掌握' },
};

/**
 * @param {'new'|'learning'|'review'|'mastered'} status
 */
export function badge(status) {
  const m = BADGE_MAP[status] || BADGE_MAP.new;
  return `<span class="badge ${m.cls}">${m.label}</span>`;
}

// ── 统计卡 ──
/**
 * @param {{ label:string, value:string|number, unit?:string, mod?:string, pct?:number }} opts
 */
export function statCard({ label, value, unit = '', mod = '', pct = 0 }) {
  const barStyle = pct > 0
    ? `width:${Math.max(0, Math.min(100, pct))}%;background:var(--cinnabar-500)`
    : '';
  return `
<div class="stat-card fade-in">
  <div class="stat-card__label">${esc(label)}</div>
  <div class="stat-card__value${mod ? ' ' + mod : ''}">
    ${esc(value)}<span class="stat-card__unit">${esc(unit)}</span>
  </div>
  <div class="stat-card__bar-track"><div class="stat-card__bar" style="${barStyle}"></div></div>
</div>`;
}

// ── 诗词卡片（列表项） ──
/**
 * @param {{ poem:object, status:string, onclick?:string }} opts
 */
export function poemCard({ poem, status = 'new', onclick = '' }) {
  const preview = (poem.content || []).slice(0, 1).join('');
  return `
<div class="poem-card fade-in" role="button" tabindex="0" ${onclick ? `onclick="${onclick}"` : ''}
     aria-label="${esc(poem.title)}">
  <div class="poem-card__title">${esc(poem.title)}</div>
  <div class="poem-card__meta">${esc(poem.dynasty || '')}·${esc(poem.author || '')}</div>
  ${preview ? `<div class="poem-card__preview">${esc(preview)}</div>` : ''}
  ${badge(status)}
</div>`;
}

// ── 空状态 ──
/**
 * @param {{ icon?:string, title:string, body?:string, action?:string }} opts
 */
export function emptyState({ icon: ic = '', title, body = '', action = '' }) {
  const iconHtml = ic || icon('inbox', 40);
  return `
<div class="empty-state fade-in">
  <div class="empty-state__icon">${iconHtml}</div>
  <div class="empty-state__title">${esc(title)}</div>
  ${body ? `<p class="empty-state__body">${esc(body)}</p>` : ''}
  ${action}
</div>`;
}

// ── Toast ──
/**
 * 显示一个 toast 通知，2.5s 后自动消失。
 * @param {string} msg
 * @param {'default'|'success'|'warn'|'danger'} type
 */
export function showToast(msg, type = 'default') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const el = document.createElement('div');
  el.className = `toast${type !== 'default' ? ' toast--' + type : ''}`;
  el.textContent = msg;
  container.appendChild(el);
  setTimeout(() => el.remove(), 2700);
}

// ── 骨架屏卡片 ──
export function skeletonCard() {
  return `
<div class="poem-card" aria-hidden="true">
  <div class="skeleton" style="height:1.1rem;width:60%;margin-bottom:8px;"></div>
  <div class="skeleton" style="height:0.9rem;width:40%;margin-bottom:6px;"></div>
  <div class="skeleton" style="height:0.85rem;width:80%;"></div>
</div>`;
}

// ── 音频控件 .audio-bar ──
/**
 * 仅生成 HTML 结构；事件绑定由调用方负责。
 * @param {{ hasSrc:boolean, favored:boolean }} opts
 */
export function audioBar({ hasSrc = false, favored = false } = {}) {
  if (!hasSrc && typeof window !== 'undefined' && !window.speechSynthesis) {
    return `<div class="audio-bar"><span class="audio-bar__unavail">朗读暂不可用</span></div>`;
  }
  return `
<div class="audio-bar" id="audio-bar">
  <button class="btn btn--primary audio-bar__play" id="audio-play" aria-pressed="false">
    ${icon('play', 18)}<span>播放</span>
  </button>
  <div class="audio-bar__speed" role="group" aria-label="播放速度">
    <button class="audio-bar__speed-btn audio-bar__speed-btn--active" data-speed="1" aria-pressed="true">常速</button>
    <button class="audio-bar__speed-btn" data-speed="0.6" aria-pressed="false">慢速</button>
  </div>
  <button class="btn btn--ghost btn--icon audio-bar__fav${favored ? ' audio-bar__fav--active' : ''}"
          id="audio-fav" aria-label="${favored ? '取消收藏' : '收藏此诗'}" aria-pressed="${favored}">
    ${icon('star', 20)}
  </button>
</div>`;
}
