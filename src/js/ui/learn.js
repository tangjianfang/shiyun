/**
 * 学习模块 UI（详情页 + 列表占位）
 */

import { pinyin } from 'pinyin-pro';
import { getPoem } from '../data.js';
import { getCurrentUserId, getPoemProgress, updatePoemProgress } from '../storage.js';
import { createAudio, play, pause, stop, setSpeed, setOnEnd } from '../audio.js';
import { navigate } from '../router.js';

let currentAudio = null;

export function renderLearnPlaceholder() {
  setContent('<div class="placeholder">📚 学习模块（Task 14 完整实现）</div>');
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
