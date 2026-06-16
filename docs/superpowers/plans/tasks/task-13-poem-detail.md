# Task 13: 诗词详情页

**依赖：** 10, 11
**并行组：** learning-ui
**估时：** 1.5 天

**Files:**
- Create: `src/js/ui/learn.js`
- Create: `src/js/audio.js`
- Modify: `src/css/main.css` (扩展)
- Modify: `src/js/main.js` (注册详情路由)

## Step 1: 写失败的测试

[本任务为 UI 渲染，核心逻辑（拼音生成、音频播放）使用 vitest 验证。]

```javascript
// tests/audio.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createAudio, play, pause, stop, setSpeed, getCurrentTime, setOnEnd } from '../src/js/audio.js';

describe('audio', () => {
  let mockAudioInstances;

  beforeEach(() => {
    // 重置 mock
    mockAudioInstances = [];
    global.Audio = vi.fn(function(src) {
      this.src = src;
      this.play = vi.fn().mockResolvedValue(undefined);
      this.pause = vi.fn();
      this.load = vi.fn();
      this.currentTime = 0;
      this.playbackRate = 1;
      mockAudioInstances.push(this);
    });
  });

  it('createAudio 应创建 Audio 元素', () => {
    const audio = createAudio('data:audio/mp3;base64,xxx');
    expect(global.Audio).toHaveBeenCalledWith('data:audio/mp3;base64,xxx');
  });

  it('play 应调用 audio.play()', () => {
    const audio = createAudio('data:audio/mp3;base64,xxx');
    play(audio);
    expect(audio.play).toHaveBeenCalled();
  });

  it('pause 应调用 audio.pause()', () => {
    const audio = createAudio('data:audio/mp3;base64,xxx');
    pause(audio);
    expect(audio.pause).toHaveBeenCalled();
  });

  it('setSpeed 应设置 playbackRate', () => {
    const audio = createAudio('data:audio/mp3;base64,xxx');
    setSpeed(audio, 0.5);
    expect(audio.playbackRate).toBe(0.5);
  });

  it('setOnEnd 应注册 ended 事件回调', () => {
    const audio = createAudio('data:audio/mp3;base64,xxx');
    const cb = vi.fn();
    setOnEnd(audio, cb);
    // 模拟事件
    audio.onended = cb;
    audio.onended();
    expect(cb).toHaveBeenCalled();
  });
});
```

```javascript
// tests/pinyin.test.js
import { describe, it, expect } from 'vitest';
import { pinyinForText, pinyinForLines } from '../src/js/ui/learn.js';

describe('pinyin 工具', () => {
  it('pinyinForText 应返回带空格的拼音', () => {
    const p = pinyinForText('静夜思');
    expect(p).toBeTruthy();
    // 应包含 a-z 字符和数字声调
    expect(p).toMatch(/[a-z]+/);
  });

  it('pinyinForLines 应返回与行数等长的数组', () => {
    const lines = ['床前明月光', '疑是地上霜'];
    const p = pinyinForLines(lines);
    expect(p.length).toBe(2);
    p.forEach(line => expect(line).toBeTruthy());
  });
});
```

## Step 2: 运行测试验证失败

```bash
npm test -- tests/audio.test.js tests/pinyin.test.js
```

Expected: FAIL with "Cannot find module"

## Step 3: 实现最小代码

### 3.1 创建 `src/js/audio.js`

```javascript
/**
 * 音频播放封装
 * - 基于原生 HTMLAudioElement（new Audio()）
 * - 支持 base64 data URL 播放
 * - 支持倍速控制（朗读/慢速/跟读）
 */

/** 创建一个 Audio 实例（不自动播放） */
export function createAudio(src) {
  return new Audio(src);
}

/** 播放 */
export function play(audio) {
  if (!audio) return Promise.resolve();
  return audio.play();
}

/** 暂停 */
export function pause(audio) {
  if (audio) audio.pause();
}

/** 停止（暂停 + 回到开头） */
export function stop(audio) {
  if (!audio) return;
  audio.pause();
  audio.currentTime = 0;
}

/** 设置倍速（0.5 - 2.0） */
export function setSpeed(audio, speed) {
  if (!audio) return;
  audio.playbackRate = Math.max(0.25, Math.min(2.0, speed));
}

/** 获取当前播放位置（秒） */
export function getCurrentTime(audio) {
  return audio ? audio.currentTime : 0;
}

/** 注册播放结束回调 */
export function setOnEnd(audio, callback) {
  if (!audio) return;
  audio.onended = callback;
}

/** 注册播放进度回调（每 250ms 一次） */
export function setOnProgress(audio, callback) {
  if (!audio) return;
  audio.ontimeupdate = callback;
}
```

### 3.2 创建 `src/js/ui/learn.js`

```javascript
/**
 * 诗词详情页 UI
 * 设计文档 7.1 节 + 4.1 节
 *
 * 结构：
 *   - 顶部 AI 配图（视觉锚定）
 *   - 标题 + 作者朝代
 *   - 原文（楷体大字号）
 *   - 拼音（小字号灰色）
 *   - 操作按钮：朗读 / 慢速 / 跟读 / 收藏 / 我学完了
 *   - 创作背景
 *   - 字词注释
 *   - 主题思想
 *   - 关键句挖空展示
 */

import { pinyin } from 'pinyin-pro';
import { getPoem } from '../data.js';
import { getCurrentUserId, getPoemProgress, updatePoemProgress } from '../storage.js';
import { createAudio, play, pause, stop, setSpeed, setOnEnd } from '../audio.js';
import { navigate } from '../router.js';

let currentAudio = null; // 当前播放的 audio 实例

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

  // 拼音
  const pinyinLines = pinyinForLines(poem.content);

  // 渲染
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

  // ===== 事件绑定 =====
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
    // 标记为已学
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

/** 单行文字 → 拼音（带声调、空格分隔） */
export function pinyinForText(text) {
  if (!text) return '';
  return pinyin(text, { toneType: 'symbol', type: 'array', v: true }).join(' ');
}

/** 多行文字 → 拼音数组 */
export function pinyinForLines(lines) {
  if (!Array.isArray(lines)) return [];
  return lines.map(line => pinyinForText(line));
}

// ===== 工具 =====

function escape(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
```

### 3.3 扩展 `src/css/main.css`

在文件末尾追加：

```css
/* ===== 诗词详情页 ===== */
.poem-detail {
  background: white;
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  margin: calc(-1 * var(--space-4));
}
.poem-detail__back {
  position: absolute; top: var(--space-3); left: var(--space-3);
  z-index: 10;
  background: rgba(255, 255, 255, 0.9);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  font-size: 14px;
  font-weight: 500;
  box-shadow: var(--shadow-sm);
}

.poem-detail__image-wrap {
  width: 100%;
  aspect-ratio: 16 / 9;
  background: linear-gradient(135deg, #e0e8f0 0%, #c5d5e5 100%);
  overflow: hidden;
  position: relative;
}
.poem-detail__image {
  width: 100%; height: 100%;
  object-fit: cover;
  display: block;
}
.poem-detail__image--placeholder {
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  color: var(--color-text-light);
  font-size: 48px;
}
.poem-detail__image--placeholder span { font-size: 14px; margin-top: var(--space-2); }

.poem-detail__header {
  text-align: center;
  padding: var(--space-5) var(--space-4) var(--space-4);
  border-bottom: 1px solid var(--color-border);
}
.poem-detail__title {
  font-family: var(--font-kai);
  font-size: 32px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: var(--space-2);
}
.poem-detail__meta {
  display: flex; justify-content: center; gap: var(--space-2);
  color: var(--color-text-light);
  font-size: 14px;
}

.poem-detail__body {
  padding: var(--space-5) var(--space-4);
}
.poem-detail__audio-controls {
  display: flex; gap: var(--space-2);
  margin-bottom: var(--space-5);
  flex-wrap: wrap;
}
.audio-btn {
  display: flex; flex-direction: column; align-items: center; gap: 2px;
  flex: 1; min-width: 64px;
  padding: var(--space-3) var(--space-2);
  background: var(--color-bg);
  border-radius: var(--radius-sm);
  font-size: 12px;
  color: var(--color-text);
  transition: all 0.2s;
}
.audio-btn:active { transform: scale(0.95); }
.audio-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.audio-btn__icon { font-size: 18px; }
.audio-btn--play { background: var(--color-primary); color: white; }
.audio-btn--active { background: var(--color-warning); color: white; }

.poem-detail__text {
  text-align: center;
  margin: var(--space-5) 0;
}
.poem-detail__line {
  margin: var(--space-4) 0;
}
.poem-detail__cn {
  font-family: var(--font-kai);
  font-size: 28px;
  font-weight: 500;
  color: var(--color-text);
  letter-spacing: 0.1em;
  line-height: 1.6;
}
.poem-detail__py {
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--color-text-light);
  margin-top: var(--space-1);
  letter-spacing: 0.05em;
}

.poem-detail__section {
  padding: var(--space-4);
  border-top: 1px solid var(--color-border);
}
.poem-detail__section-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: var(--space-3);
  color: var(--color-text);
}
.poem-detail__section-content {
  font-size: 15px;
  line-height: 1.8;
  color: var(--color-text);
}

.poem-detail__annotations {
  display: grid; gap: var(--space-3);
}
.poem-detail__annotation {
  display: flex; gap: var(--space-3);
  padding: var(--space-2) 0;
  border-bottom: 1px dashed var(--color-border);
}
.poem-detail__annotation:last-child { border-bottom: none; }
.poem-detail__annotation dt {
  flex: 0 0 40px;
  font-weight: 600;
  color: var(--color-primary);
  font-family: var(--font-kai);
  font-size: 18px;
}
.poem-detail__annotation dd { flex: 1; color: var(--color-text); }

.poem-detail__keywords {
  display: flex; flex-wrap: wrap; gap: var(--space-2);
  margin-top: var(--space-3);
}
.poem-detail__keyword {
  background: var(--color-bg);
  padding: var(--space-1) var(--space-3);
  border-radius: 999px;
  font-size: 13px;
  color: var(--color-text);
}

.poem-detail__actions {
  padding: var(--space-5) var(--space-4);
  background: var(--color-bg);
}

/* ===== 通用按钮 ===== */
.btn {
  display: inline-flex; align-items: center; justify-content: center;
  padding: var(--space-3) var(--space-5);
  border-radius: var(--radius-sm);
  font-weight: 600;
  font-size: 15px;
  transition: all 0.2s;
  width: 100%;
}
.btn:active { transform: scale(0.98); }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.btn--primary { background: var(--color-primary); color: white; }
.btn--success { background: var(--color-success); color: white; }
.btn--large { padding: var(--space-4); font-size: 16px; }
```

### 3.4 修改 `src/js/main.js` 注册详情路由

把 Task 10 中的：

```javascript
const routes = {
  '#/': renderHome,
  '#/learn': renderLearnPlaceholder,
  ...
  '#/poem/:id': renderPoemDetailPlaceholder,
};
```

改为：

```javascript
import { renderPoemDetail } from './ui/learn.js';
// 移除 renderPoemDetailPlaceholder
import { renderPoemList } from './ui/learn.js'; // Task 14 实现

const routes = {
  '#/': renderHome,
  '#/learn': renderPoemList, // Task 14 实现
  '#/review': renderReviewPlaceholder,
  '#/quiz': renderQuizPlaceholder,
  '#/progress': renderProgressPlaceholder,
  '#/poem/:id': renderPoemDetail,
};
```

（注：Task 14 在 `learn.js` 同一文件加 `renderPoemList` 函数。本任务先在 `main.js` 引用，Task 14 加上函数实现。）

## Step 4: 运行测试验证通过

```bash
npm test -- tests/audio.test.js tests/pinyin.test.js
```

Expected: PASS (8+ tests)

## Step 5: 提交

```bash
git add src/js/ui/learn.js src/js/audio.js src/css/main.css src/js/main.js tests/audio.test.js tests/pinyin.test.js
git commit -m "feat(learn): 诗词详情页（拼音/朗读/收藏/注释/主题）"
```

## 完成标志

```bash
echo done > .tasks/done/13
```

## 关键说明

- **拼音库**：用 `pinyin-pro` 的 `pinyin(text, { toneType: 'symbol' })` 生成带声调符号的拼音（jīng yè sī）
- **拼音布局**：原诗和拼音分两行（不在每个字上方标注），移动端可读性更好
- **音频**：用 `new Audio(base64)` 创建，支持倍速（正常 1.0 / 慢速 0.6），跟读模式由慢速按钮 + 暂停模拟
- **AI 配图占位**：如果 `poem.image` 为空，显示"🎨 暂无配图"占位框
- **AI 内容容错**：所有 `poem.background/annotations/theme/translation` 都有默认值，生成器尚未生成时不报错
- **收藏**：点击切换 ⭐/☆ 状态，写入 `poemProgress.favorite`
- **"我学完了"按钮**：标记 `status: 'learning'`，learnCount +1，跳转考核页（Task 15-18 之一）
- **响应式**：图片用 `aspect-ratio: 16/9` 保持比例；字号在 @media 中可调
- **安全**：所有用户/AI 生成内容用 `escape()` HTML 转义，避免 XSS
- **音频单例**：模块级 `currentAudio` 变量，切换诗时先 `stop` 旧的再创建新的
- **构建时**：所有 ES Module 会被内联到单 HTML，pinyin-pro 单独打包进 `src/lib/pinyin-pro.min.js`
