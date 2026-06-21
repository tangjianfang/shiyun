/**
 * 学习模块 UI — 明亮国风版
 * 列表（Chip 筛选 + 骨架 + 空状态）+ 详情（音频状态机 + TTS 兜底）
 */

import { pinyin } from 'pinyin-pro';
import { getPoem, poems as poemsMap, getPoemsBySemester } from '../data.js';
import { getCurrentUserId, getPoemProgress, updatePoemProgress } from '../storage.js';
import {
  createAudio, play, pause, stop, setSpeed, setOnEnd,
  createSpeech, speak, stopSpeak, resumeSpeak, speechSupported
} from '../audio.js';
import { navigate } from '../router.js';
import { badge, poemCard, emptyState, skeletonCard, audioBar, showToast, esc, icon } from './components.js';

let currentAudio = null;   // HTMLAudioElement 实例（有 poem.audio 时使用）
let currentSpeech = null;  // SpeechSynthesisUtterance（TTS 兜底时使用）
let audioState = 'idle';   // 'idle' | 'playing' | 'paused'
let audioSpeed = 1;        // 当前速度
let pendingKeyword = '';   // 待搜索关键词（详情页点关键词跳转列表时传递）

/** renderLearnPage：main.js 路由入口 */
export function renderLearnPage() {
  return renderPoemList();
}

export function renderLearnPlaceholder() {
  renderPoemList();
}

// ═══════════════════════════════════════════════════════
// 诗词列表页
// ═══════════════════════════════════════════════════════

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

  const state = { grade: 0, semester: '', dynasty: '', author: '', keyword: '' };

  // 从 URL hash 读取预设筛选（如 #/learn?grade=1&sem=上）
  const hashParams = parseHashParams();
  if (hashParams.grade) state.grade = parseInt(hashParams.grade, 10) || 0;
  if (hashParams.sem)  state.semester = hashParams.sem;
  if (hashParams.dynasty) state.dynasty = decodeURIComponent(hashParams.dynasty);
  if (hashParams.author)  state.author  = decodeURIComponent(hashParams.author);

  // 从详情页关键词跳转过来：预填搜索
  if (pendingKeyword) {
    state.keyword = pendingKeyword;
    pendingKeyword = '';
  }

  const dynasties = getAllDynastiesForFilter(allPoems);
  const authors   = getAllAuthorsForFilter(allPoems);

  // 骨架屏先显示
  main.innerHTML = `
    <div class="content-wrap fade-in">
      <header class="page-head">
        <h1 class="page-head__title">📖 学新诗</h1>
      </header>

      <div class="poem-list">
        <div class="poem-list__search">
          <span class="poem-list__search-icon">🔍</span>
          <input type="search" id="filter-keyword" class="input"
                 placeholder="搜索标题或作者" autocomplete="off">
        </div>

        <!-- 年级 Chip -->
        <div class="poem-list__chips" id="grade-chips">
          <button class="chip ${state.grade === 0 ? 'chip--active' : ''}" data-grade="0">全部年级</button>
          ${[1,2,3,4,5,6].map(g =>
            `<button class="chip ${state.grade === g ? 'chip--active' : ''}" data-grade="${g}">${g} 年级</button>`
          ).join('')}
        </div>

        <!-- 学期 Chip（年级选定后才出现，可选） -->
        <div class="poem-list__chips" id="semester-chips" ${state.grade === 0 ? 'hidden' : ''}>
          <button class="chip ${state.semester === '' ? 'chip--active' : ''}" data-sem="">全部学期</button>
          <button class="chip ${state.semester === '上' ? 'chip--active' : ''}" data-sem="上">上册</button>
          <button class="chip ${state.semester === '下' ? 'chip--active' : ''}" data-sem="下">下册</button>
        </div>

        <!-- 朝代 Chip -->
        <div class="poem-list__chips" id="dynasty-chips">
          <button class="chip chip--active" data-dynasty="">全部朝代</button>
          ${dynasties.map(d =>
            `<button class="chip" data-dynasty="${esc(d)}">${esc(d)}</button>`
          ).join('')}
        </div>

        <div class="poem-list__header">
          <div class="poem-list__count" id="poem-list-count"></div>
        </div>

        <div class="poem-list__grid" id="poem-list-items">
          ${Array(6).fill(0).map(() => skeletonCard()).join('')}
        </div>
      </div>
    </div>
  `;

  // 100ms 后正式渲染（给浏览器机会先绘制骨架屏）
  setTimeout(() => renderItems(), 100);

  function renderItems() {
    const filtered = filterLearnPoems(allPoems, state);
    const itemsEl  = document.getElementById('poem-list-items');
    const countEl  = document.getElementById('poem-list-count');
    if (countEl) countEl.textContent = `共 ${filtered.length} 首`;
    if (!itemsEl) return;

    if (filtered.length === 0) {
      itemsEl.innerHTML = emptyState({
        icon: '🔍',
        title: '没有找到相关诗词',
        body: '换个词试试，或清除筛选条件吧～',
      });
      return;
    }

    itemsEl.innerHTML = filtered.map(poem => {
      const progress = userProgress[poem.id];
      const status   = progressToStatus(progress);
      return poemCard({
        poem,
        status,
        onclick: `window.location.hash='#/poem/${poem.id}'`,
      });
    }).join('');
  }

  // 搜索防抖
  let searchTimer = null;
  const kwInput = document.getElementById('filter-keyword');
  if (kwInput && state.keyword) kwInput.value = state.keyword;
  kwInput?.addEventListener('input', e => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => { state.keyword = e.target.value.trim(); renderItems(); }, 150);
  });

  // 年级 chip 组
  document.getElementById('grade-chips')?.addEventListener('click', e => {
    const btn = e.target.closest('[data-grade]');
    if (!btn) return;
    state.grade = Number(btn.dataset.grade);
    document.querySelectorAll('#grade-chips .chip').forEach(c => c.classList.toggle('chip--active', c === btn));
    // 切换年级时，若学期 chip 与新年级无关，重置学期
    const semGroup = document.getElementById('semester-chips');
    if (state.grade === 0) {
      if (semGroup) semGroup.hidden = true;
      state.semester = '';
    } else {
      if (semGroup) semGroup.hidden = false;
    }
    renderItems();
  });

  // 学期 chip 组（仅在选定年级后出现）
  document.getElementById('semester-chips')?.addEventListener('click', e => {
    const btn = e.target.closest('[data-sem]');
    if (!btn) return;
    state.semester = btn.dataset.sem;
    document.querySelectorAll('#semester-chips .chip').forEach(c => c.classList.toggle('chip--active', c === btn));
    renderItems();
  });

  // 朝代 chip 组
  document.getElementById('dynasty-chips')?.addEventListener('click', e => {
    const btn = e.target.closest('[data-dynasty]');
    if (!btn) return;
    state.dynasty = btn.dataset.dynasty;
    document.querySelectorAll('#dynasty-chips .chip').forEach(c => c.classList.toggle('chip--active', c === btn));
    renderItems();
  });
}

// ═══════════════════════════════════════════════════════
// 诗词详情页
// ═══════════════════════════════════════════════════════

export function renderPoemDetail(params) {
  const main = document.getElementById('app-main');
  if (!main) return;

  // 停止上一首播放
  _stopAll();

  const poem = getPoem(params.id);
  if (!poem) {
    main.innerHTML = emptyState({ icon: '❓', title: `找不到诗词：${esc(params.id)}` });
    return;
  }

  const userId  = getCurrentUserId();
  const progress = getPoemProgress(userId, poem.id);
  const isFavorite = !!(progress && progress.favorite);

  const pinyinLines = pinyinForLines(poem.content || []);

  main.innerHTML = `
    <div class="content-wrap fade-in">
      <div class="poem-detail">
        <div class="poem-detail__back">
          <button class="btn btn--ghost btn--sm" id="poem-back">← 返回</button>
        </div>

        <!-- 配图 -->
        <div class="poem-detail__cover">
          ${poem.image
            ? `<img src="${esc(poem.image)}" alt="${esc(poem.title)}">`
            : `<div class="poem-detail__cover-icon">🖼️</div><span>✨ 配图生成中</span>`}
        </div>

        <!-- 标题区 -->
        <div class="poem-detail__header">
          <div>
            <h1 class="poem-detail__title">${esc(poem.title)}</h1>
            <div class="poem-detail__tags">
              ${poem.dynasty ? `<span class="poem-detail__tag">${esc(poem.dynasty)}</span>` : ''}
              ${poem.author  ? `<span class="poem-detail__tag">${esc(poem.author)}</span>`  : ''}
              ${poem.type    ? `<span class="poem-detail__tag">${esc(poem.type)}</span>`    : ''}
            </div>
          </div>
        </div>

        <!-- 朗读控件（音频状态机） -->
        ${audioBar({ hasSrc: !!poem.audio, favored: isFavorite })}

        <!-- 诗词正文（拼音 + 大字） -->
        <div class="poem-content" id="poem-content">
          ${(poem.content || []).map((line, li) => `
            <div class="poem-line" data-line="${li}">
              ${line.split('').map((ch, ci) => {
                const py = (pinyinLines[li] || '').split(' ')[ci] || '';
                return `<div class="poem-char">
                  <span class="poem-char__pinyin">${esc(py)}</span>
                  <span class="poem-char__text">${esc(ch)}</span>
                </div>`;
              }).join('')}
            </div>
          `).join('')}
        </div>

        <!-- 释义区块 -->
        <div class="poem-sections card">
          <details class="poem-section" open>
            <summary>📖 创作背景</summary>
            <div class="poem-section__body">${esc(poem.background || '暂无背景资料，内容生成中…')}</div>
          </details>
          ${poem.annotations && Object.keys(poem.annotations).length > 0 ? `
          <hr class="ink-divider">
          <details class="poem-section">
            <summary>📝 字词注释</summary>
            <div class="poem-section__body">
              ${Object.entries(poem.annotations).map(([k, v]) =>
                `<p><strong>${esc(k)}</strong>：${esc(v)}</p>`
              ).join('')}
            </div>
          </details>` : ''}
          <hr class="ink-divider">
          <details class="poem-section">
            <summary>💡 主题思想</summary>
            <div class="poem-section__body">${esc(poem.theme || '暂无，内容生成中…')}</div>
          </details>
          ${poem.translation ? `
          <hr class="ink-divider">
          <details class="poem-section">
            <summary>🌐 白话翻译</summary>
            <div class="poem-section__body">${esc(poem.translation)}</div>
          </details>` : ''}
        </div>

        ${(poem.keywords && poem.keywords.length) ? `
        <div class="poem-keywords">
          <span class="poem-keywords__label">联想关键词</span>
          <div class="poem-keywords__tags">
            ${poem.keywords.map(k => `<a class="poem-keyword-tag" href="#/learn" data-kw="${esc(k)}">${esc(k)}</a>`).join('')}
          </div>
        </div>` : ''}

        <div class="poem-detail__actions">
          <button class="btn btn--primary btn--lg" id="poem-finished">✓ 我学完了，去考核 →</button>
        </div>
      </div>
    </div>
  `;

  // ── 音频控件事件绑定 ──
  _bindAudioBar(poem);

  // ── 联想关键词：点击跳转列表并搜索 ──
  main.querySelectorAll('.poem-keyword-tag').forEach(tag => {
    tag.addEventListener('click', (e) => {
      e.preventDefault();
      _stopAll();
      pendingKeyword = tag.dataset.kw || '';
      navigate('#/learn');
    });
  });

  // ── 返回 ──
  document.getElementById('poem-back')?.addEventListener('click', () => {
    _stopAll();
    history.length > 1 ? history.back() : navigate('#/learn');
  });

  // ── 完成学习 ──
  document.getElementById('poem-finished')?.addEventListener('click', () => {
    _stopAll();
    updatePoemProgress(userId, poem.id, {
      status: 'learning',
      learnCount: (progress?.learnCount || 0) + 1,
    });
    navigate('#/quiz?poemId=' + poem.id);
  });
}

// ── 音频状态机 ──

function _bindAudioBar(poem) {
  const playBtn  = document.getElementById('audio-play');
  const favBtn   = document.getElementById('audio-fav');
  const speedBtns = document.querySelectorAll('.audio-bar__speed-btn');

  if (!playBtn) return;

  const userId = getCurrentUserId();

  // 判断音源
  const hasMp3 = !!poem.audio;
  const hasTts  = speechSupported();

  if (!hasMp3 && !hasTts) return; // 按钮已经渲染为"暂不可用"

  if (hasMp3) {
    currentAudio = createAudio(poem.audio);
    setOnEnd(currentAudio, () => { _setAudioState('idle'); _highlightLine(-1); });
    const durMs = poem.audioDurationMs || 0;
    currentAudio.ontimeupdate = () => {
      const dur = (currentAudio.duration && isFinite(currentAudio.duration))
        ? currentAudio.duration : (durMs / 1000);
      const idx = lineAtTime(currentAudio.currentTime, dur, poem.title, poem.content || []);
      _highlightLine(idx);
    };
  }

  playBtn.addEventListener('click', () => {
    if (audioState === 'idle') {
      _startPlay(poem, audioSpeed);
    } else if (audioState === 'playing') {
      _pausePlay();
    } else {
      _resumePlay(poem, audioSpeed);
    }
  });

  speedBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const speed = Number(btn.dataset.speed);
      audioSpeed = speed;
      speedBtns.forEach(b => b.classList.toggle('audio-bar__speed-btn--active', b === btn));
      speedBtns.forEach(b => b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'));
      // 若正在播放，立即切换速度
      if (audioState === 'playing') {
        if (hasMp3 && currentAudio) {
          setSpeed(currentAudio, speed);
        } else if (!hasMp3) {
          _stopAll();
          _startPlay(poem, speed);
        }
      }
    });
  });

  favBtn?.addEventListener('click', () => {
    const isFav = favBtn.getAttribute('aria-pressed') === 'true';
    const next  = !isFav;
    updatePoemProgress(userId, poem.id, { favorite: next });
    favBtn.setAttribute('aria-pressed', String(next));
    favBtn.classList.toggle('audio-bar__fav--active', next);
    favBtn.innerHTML    = icon('star', 20);
    favBtn.setAttribute('aria-label', next ? '取消收藏' : '收藏此诗');
    showToast(next ? '已收藏' : '已取消收藏', next ? 'success' : 'default');
  });
}

function _startPlay(poem, speed) {
  const hasMp3 = !!poem.audio;
  if (hasMp3 && currentAudio) {
    setSpeed(currentAudio, speed);
    play(currentAudio);
  } else if (speechSupported()) {
    currentSpeech = createSpeech(poem.content || [], { rate: speed });
    currentSpeech.onend = () => _setAudioState('idle');
    speak(currentSpeech);
  }
  _setAudioState('playing');
}

function _pausePlay() {
  if (currentAudio) pause(currentAudio);
  else pauseSpeak();
  _setAudioState('paused');
}

function _resumePlay(poem, speed) {
  if (currentAudio) {
    play(currentAudio);
  } else if (speechSupported()) {
    // TTS resume 浏览器支持不稳定，重新朗读
    _startPlay(poem, speed);
    return;
  }
  _setAudioState('playing');
}

function _stopAll() {
  if (currentAudio) { stop(currentAudio); currentAudio = null; }
  stopSpeak();
  audioState  = 'idle';
  audioSpeed  = 1;
  _highlightLine(-1);
}

/** 高亮当前朗读到的诗句；idx<0 表示清除全部高亮 */
function _highlightLine(idx) {
  const lines = document.querySelectorAll('#poem-content .poem-line');
  lines.forEach((el, i) => el.classList.toggle('poem-line--active', i === idx));
}

function _setAudioState(s) {
  audioState = s;
  const playBtn = document.getElementById('audio-play');
  if (!playBtn) return;
  if (s === 'playing') {
    playBtn.innerHTML = `${icon('pause', 18)}<span>暂停</span>`;
    playBtn.setAttribute('aria-pressed', 'true');
  } else {
    playBtn.innerHTML = `${icon('play', 18)}<span>播放</span>`;
    playBtn.setAttribute('aria-pressed', 'false');
  }
}

// ═══════════════════════════════════════════════════════
// 纯函数（可测试）
// ═══════════════════════════════════════════════════════

export function getAllPoemsList() {
  return Array.from(poemsMap.values()).sort((a, b) => {
    if (a.grade !== b.grade) return a.grade - b.grade;
    return (a.sequence || 0) - (b.sequence || 0);
  });
}

export function getAllDynastiesForFilter(poems) {
  return [...new Set(poems.map(p => p.dynasty))].filter(Boolean).sort();
}

export function getAllAuthorsForFilter(poems) {
  return [...new Set(poems.map(p => p.author))].filter(Boolean).sort();
}

export function filterLearnPoems(poems, filters) {
  const f = filters || {};
  return poems.filter(p => {
    if (f.grade    && p.grade   !== f.grade)    return false;
    if (f.semester && p.semester !== f.semester) return false;
    if (f.dynasty  && p.dynasty !== f.dynasty)  return false;
    if (f.author   && p.author  !== f.author)   return false;
    if (f.keyword) {
      const kw = f.keyword.toLowerCase();
      const match = [(p.title||''), (p.author||''), ...(p.content||[]), ...(p.keywords||[])];
      if (!match.some(t => t.toLowerCase().includes(kw))) return false;
    }
    return true;
  });
}

/** 解析 #/learn?grade=1&sem=上 这种 hash 后 query 串。空 / 不存在则 {} */
export function parseHashParams() {
  const hash = window.location.hash || '';
  const queryStart = hash.indexOf('?');
  if (queryStart < 0) return {};
  const params = {};
  const pairs = hash.slice(queryStart + 1).split('&');
  for (const pair of pairs) {
    if (!pair) continue;
    const [k, v] = pair.split('=');
    if (k) params[decodeURIComponent(k)] = v === undefined ? '' : decodeURIComponent(v || '');
  }
  return params;
}

export function getStatusBadge(progress) {
  if (!progress || !progress.status || progress.status === 'new') return { type: 'new',      label: '新诗' };
  if (progress.status === 'mastered')   return { type: 'mastered',  label: '⭐ 已掌握' };
  if (progress.status === 'reviewing')  return { type: 'review',    label: `复习中` };
  return { type: 'learning', label: '学习中' };
}

function progressToStatus(progress) {
  if (!progress || !progress.status || progress.status === 'new') return 'new';
  if (progress.status === 'mastered')  return 'mastered';
  if (progress.status === 'reviewing') return 'review';
  return 'learning';
}

export function searchPoemsCase(poems, keyword) {
  if (!keyword) return poems;
  const kw = keyword.toLowerCase();
  return poems.filter(p =>
    (p.title  || '').toLowerCase().includes(kw) ||
    (p.author || '').toLowerCase().includes(kw)
  );
}

export function pinyinForText(text) {
  if (!text) return '';
  try {
    return pinyin(text, { toneType: 'symbol', type: 'array', v: true }).join(' ');
  } catch { return ''; }
}

export function pinyinForLines(lines) {
  if (!Array.isArray(lines)) return [];
  return lines.map(line => pinyinForText(line));
}

/**
 * 按字符数权重估算当前时间点正在朗读的诗句索引。
 * 朗读文本为「标题。句1，句2，…。」，所以标题占开头一段。
 * @returns {number} 诗句索引，-1 表示仍在读标题或无法估算
 */
export function lineAtTime(currentSec, durationSec, title, lines) {
  if (!durationSec || durationSec <= 0 || !Array.isArray(lines) || lines.length === 0) return -1;
  const titleLen = (title || '').length;
  const lineLens = lines.map(l => (l || '').length);
  const total = titleLen + lineLens.reduce((a, b) => a + b, 0);
  if (total === 0) return -1;
  const pos = (currentSec / durationSec) * total;  // 当前朗读到的字符位置
  if (pos < titleLen) return -1;                   // 仍在读标题
  let acc = titleLen;
  for (let i = 0; i < lines.length; i++) {
    acc += lineLens[i];
    if (pos < acc) return i;
  }
  return lines.length - 1;
}

// pauseSpeak 在 audio.js 中已导出；这里补充仅 learn.js 内部用的同名别名
function pauseSpeak() {
  if (speechSupported()) window.speechSynthesis.pause();
}
