/**
 * 学习模块 UI（详情页 + 列表占位）
 */

import { pinyin } from 'pinyin-pro';
import { getPoem, poems as poemsMap } from '../data.js';
import { getCurrentUserId, getPoemProgress, updatePoemProgress } from '../storage.js';
import { createAudio, play, pause, stop, setSpeed, setOnEnd } from '../audio.js';
import { navigate } from '../router.js';

let currentAudio = null;

export function renderLearnPlaceholder() {
  renderPoemList();
}

// ===== 诗词列表页 =====

export function renderPoemList() {
  const main = document.getElementById('app-main');
  if (!main) return;

  const userId = getCurrentUserId();
  const allPoems = getAllPoemsList();
  const userProgress = {};
  for (const poem of allPoems) {
    const p = getPoemProgress(userId, poem.id);
    if (p) userProgress[poem.id] = p;
  }

  const state = { grade: 0, dynasty: '', author: '', keyword: '' };

  main.innerHTML = `
    <section class="poem-list">
      <header class="poem-list__header">
        <h2 class="poem-list__title">📚 学新诗</h2>
        <div class="poem-list__count" id="poem-list-count"></div>
      </header>

      <div class="poem-list__filters">
        <input type="search" id="filter-keyword" class="poem-list__search-input" placeholder="🔍 搜索标题或作者" autocomplete="off">
        <div class="poem-list__filter-row">
          <select id="filter-grade" class="poem-list__select">
            <option value="0">全部年级</option>
            ${[1,2,3,4,5,6].map(g => `<option value="${g}">${g} 年级</option>`).join('')}
          </select>
          <select id="filter-dynasty" class="poem-list__select">
            <option value="">全部朝代</option>
            ${getAllDynastiesForFilter(allPoems).map(d => `<option value="${escape(d)}">${escape(d)}</option>`).join('')}
          </select>
          <select id="filter-author" class="poem-list__select">
            <option value="">全部作者</option>
            ${getAllAuthorsForFilter(allPoems).map(a => `<option value="${escape(a)}">${escape(a)}</option>`).join('')}
          </select>
        </div>
      </div>

      <div class="poem-list__items" id="poem-list-items"></div>
    </section>
  `;

  const renderItems = () => {
    const filtered = filterPoems(allPoems, state);
    const itemsEl = document.getElementById('poem-list-items');
    const countEl = document.getElementById('poem-list-count');
    if (countEl) countEl.textContent = `共 ${filtered.length} 首`;

    if (filtered.length === 0) {
      itemsEl.innerHTML = `<div class="poem-list__empty">没有匹配的诗词</div>`;
      return;
    }

    itemsEl.innerHTML = filtered.map(poem => {
      const progress = userProgress[poem.id];
      const badge = getStatusBadge(progress);
      const thumb = poem.image
        ? `<img src="${poem.image}" alt="${escape(poem.title)}" class="poem-list__thumb" loading="lazy">`
        : `<div class="poem-list__thumb poem-list__thumb--placeholder">📜</div>`;
      return `
        <a href="#/poem/${poem.id}" class="poem-list__item" data-id="${poem.id}">
          ${thumb}
          <div class="poem-list__info">
            <div class="poem-list__item-title">${escape(poem.title)}</div>
            <div class="poem-list__item-meta">
              <span>${escape(poem.dynasty)} · ${escape(poem.author)}</span>
              <span>· ${escape(poem.type)}</span>
            </div>
          </div>
          <span class="poem-list__badge poem-list__badge--${badge.type}">${escape(badge.label)}</span>
        </a>
      `;
    }).join('');
  };

  renderItems();

  let searchTimer = null;
  document.getElementById('filter-keyword')?.addEventListener('input', (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.keyword = e.target.value.trim();
      renderItems();
    }, 150);
  });
  document.getElementById('filter-grade')?.addEventListener('change', (e) => {
    state.grade = Number(e.target.value);
    renderItems();
  });
  document.getElementById('filter-dynasty')?.addEventListener('change', (e) => {
    state.dynasty = e.target.value;
    renderItems();
  });
  document.getElementById('filter-author')?.addEventListener('change', (e) => {
    state.author = e.target.value;
    renderItems();
  });
}

// ===== 纯函数（可测试） =====

export function getAllPoemsList() {
  return Array.from(poemsMap.values()).sort((a, b) => {
    if (a.grade !== b.grade) return a.grade - b.grade;
    return (a.sequence || 0) - (b.sequence || 0);
  });
}

export function getAllDynastiesForFilter(poems) {
  return [...new Set(poems.map(p => p.dynasty))].sort();
}

export function getAllAuthorsForFilter(poems) {
  return [...new Set(poems.map(p => p.author))].sort();
}

/**
 * 过滤诗词
 */
export function filterPoems(poems, filters) {
  const f = filters || {};
  return poems.filter(p => {
    if (f.grade && p.grade !== f.grade) return false;
    if (f.dynasty && p.dynasty !== f.dynasty) return false;
    if (f.author && p.author !== f.author) return false;
    if (f.keyword) {
      const kw = f.keyword.toLowerCase();
      const inTitle = (p.title || '').toLowerCase().includes(kw);
      const inAuthor = (p.author || '').toLowerCase().includes(kw);
      if (!inTitle && !inAuthor) return false;
    }
    return true;
  });
}

/**
 * 状态徽章
 */
export function getStatusBadge(progress) {
  if (!progress || !progress.status || progress.status === 'new') {
    return { type: 'new', label: '新诗' };
  }
  if (progress.status === 'mastered') {
    return { type: 'mastered', label: '⭐ 已掌握' };
  }
  if (progress.status === 'reviewing') {
    return { type: 'reviewing', label: '已学 ' + (progress.learnCount || 0) + ' 次' };
  }
  return { type: 'learning', label: '学习中 ' + (progress.learnCount || 0) + '/' + 3 };
}

/**
 * 关键词搜索（用于搜索框）
 */
export function searchPoemsCase(poems, keyword) {
  if (!keyword) return poems;
  const kw = keyword.toLowerCase();
  return poems.filter(p =>
    (p.title || '').toLowerCase().includes(kw) ||
    (p.author || '').toLowerCase().includes(kw)
  );
}

export function renderPoemDetail(params) {
  const main = document.getElementById('app-main');
  if (!main) return;

  const poem = getPoem(params.id);
  if (!poem) {
    main.innerHTML = `<div class="placeholder">找不到诗词：${params.id}</div>`;
    return;
  }

  const userId = getCurrentUserId();
  const progress = getPoemProgress(userId, poem.id);
  const isFavorite = !!(progress && progress.favorite);

  const pinyinLines = pinyinForLines(poem.content);

  main.innerHTML = `
    <article class="poem-detail">
      <button class="poem-detail__back" id="poem-back">← 返回</button>

      <div class="poem-detail__image-wrap">
        ${poem.image
          ? `<img src="${poem.image}" alt="${poem.title}" class="poem-detail__image">`
          : `<div class="poem-detail__image poem-detail__image--placeholder">🎨<br><span>暂无配图</span></div>`
        }
      </div>

      <header class="poem-detail__header">
        <h1 class="poem-detail__title">${escape(poem.title)}</h1>
        <div class="poem-detail__meta">
          <span>${escape(poem.dynasty)}</span>
          <span>·</span>
          <span>${escape(poem.author)}</span>
          <span>·</span>
          <span>${escape(poem.type)}</span>
        </div>
      </header>

      <section class="poem-detail__body">
        <div class="poem-detail__audio-controls">
          <button class="audio-btn audio-btn--play" id="audio-play" ${poem.audio ? '' : 'disabled'}>
            <span class="audio-btn__icon">▶</span>
            <span class="audio-btn__label">朗读</span>
          </button>
          <button class="audio-btn" id="audio-slow" ${poem.audio ? '' : 'disabled'}>
            <span class="audio-btn__icon">⏪</span>
            <span class="audio-btn__label">慢速</span>
          </button>
          <button class="audio-btn" id="audio-stop" ${poem.audio ? '' : 'disabled'}>
            <span class="audio-btn__icon">⏹</span>
            <span class="audio-btn__label">停止</span>
          </button>
          <button class="audio-btn audio-btn--favorite ${isFavorite ? 'audio-btn--active' : ''}" id="poem-favorite">
            <span class="audio-btn__icon">${isFavorite ? '⭐' : '☆'}</span>
            <span class="audio-btn__label">${isFavorite ? '已收藏' : '收藏'}</span>
          </button>
        </div>

        <div class="poem-detail__text">
          ${poem.content.map((line, i) => `
            <div class="poem-detail__line">
              <div class="poem-detail__cn">${escape(line)}</div>
              <div class="poem-detail__py">${escape(pinyinLines[i] || '')}</div>
            </div>
          `).join('')}
        </div>
      </section>

      <section class="poem-detail__section">
        <h2 class="poem-detail__section-title">📖 创作背景</h2>
        <p class="poem-detail__section-content">${escape(poem.background || '暂无背景资料')}</p>
      </section>

      ${poem.annotations && Object.keys(poem.annotations).length > 0 ? `
      <section class="poem-detail__section">
        <h2 class="poem-detail__section-title">📝 字词注释</h2>
        <dl class="poem-detail__annotations">
          ${Object.entries(poem.annotations).map(([k, v]) => `
            <div class="poem-detail__annotation">
              <dt>${escape(k)}</dt>
              <dd>${escape(v)}</dd>
            </div>
          `).join('')}
        </dl>
      </section>
      ` : ''}

      <section class="poem-detail__section">
        <h2 class="poem-detail__section-title">💡 主题思想</h2>
        <p class="poem-detail__section-content">${escape(poem.theme || '暂无')}</p>
        ${poem.keywords && poem.keywords.length > 0 ? `
          <div class="poem-detail__keywords">
            ${poem.keywords.map(k => `<span class="poem-detail__keyword">${escape(k)}</span>`).join('')}
          </div>
        ` : ''}
      </section>

      ${poem.translation ? `
      <section class="poem-detail__section">
        <h2 class="poem-detail__section-title">🌐 白话翻译</h2>
        <p class="poem-detail__section-content">${escape(poem.translation)}</p>
      </section>
      ` : ''}

      <div class="poem-detail__actions">
        <button class="btn btn--primary btn--large" id="poem-finished">
          ✓ 我学完了（去考核）
        </button>
      </div>
    </article>
  `;

  document.getElementById('poem-back')?.addEventListener('click', () => {
    stop(currentAudio);
    history.length > 1 ? history.back() : navigate('#/learn');
  });

  const playBtn = document.getElementById('audio-play');
  const slowBtn = document.getElementById('audio-slow');
  const stopBtn = document.getElementById('audio-stop');

  if (poem.audio) {
    currentAudio = createAudio(poem.audio);
    setOnEnd(currentAudio, () => updatePlayBtn('▶', '朗读'));

    playBtn?.addEventListener('click', () => {
      setSpeed(currentAudio, 1.0);
      play(currentAudio);
      updatePlayBtn('⏸', '暂停');
    });

    slowBtn?.addEventListener('click', () => {
      stop(currentAudio);
      setSpeed(currentAudio, 0.6);
      play(currentAudio);
      updatePlayBtn('⏸', '暂停');
    });

    stopBtn?.addEventListener('click', () => {
      stop(currentAudio);
      updatePlayBtn('▶', '朗读');
    });
  }

  document.getElementById('poem-favorite')?.addEventListener('click', (e) => {
    const newState = !isFavorite;
    updatePoemProgress(userId, poem.id, { favorite: newState });
    e.currentTarget.classList.toggle('audio-btn--active', newState);
    e.currentTarget.querySelector('.audio-btn__icon').textContent = newState ? '⭐' : '☆';
    e.currentTarget.querySelector('.audio-btn__label').textContent = newState ? '已收藏' : '收藏';
  });

  document.getElementById('poem-finished')?.addEventListener('click', () => {
    stop(currentAudio);
    updatePoemProgress(userId, poem.id, {
      status: 'learning',
      learnCount: (progress?.learnCount || 0) + 1,
    });
    navigate('#/quiz?poemId=' + poem.id);
  });

  function updatePlayBtn(icon, label) {
    if (!playBtn) return;
    playBtn.querySelector('.audio-btn__icon').textContent = icon;
    playBtn.querySelector('.audio-btn__label').textContent = label;
  }
}

// ===== 拼音工具 =====

export function pinyinForText(text) {
  if (!text) return '';
  try {
    return pinyin(text, { toneType: 'symbol', type: 'array', v: true }).join(' ');
  } catch {
    return '';
  }
}

export function pinyinForLines(lines) {
  if (!Array.isArray(lines)) return [];
  return lines.map(line => pinyinForText(line));
}

function escape(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function setContent(html) {
  const main = document.getElementById('app-main');
  if (main) main.innerHTML = html;
}
