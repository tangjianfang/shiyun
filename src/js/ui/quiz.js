/**
 * 考核模块 UI（Task 15-18 完整实现）
 * - fill: 填空
 * - choice: 选择
 * - order: 排序
 * - listen: 听诗选诗
 */

import { buildFillQuestion, scoreFill, listWrongBlanks } from '../quiz/fill.js';
import { buildChoiceQuestion, scoreChoice } from '../quiz/choice.js';
import { buildOrderQuestion, scoreOrder, listWrongOrderLines, isFullyCorrect } from '../quiz/order.js';
import { buildListenQuestion, scoreListen } from '../quiz/listen.js';
import { getAllPoems } from '../data.js';
import { play as audioPlay } from '../audio.js';

let currentAudio = null;

export function renderQuizPlaceholder() {
  setContent('<div class="placeholder">✏️ 考核模块</div>');
}

/**
 * 启动考核
 * @param {Object} poem
 * @param {string} mode  'fill'|'choice'|'order'|'listen'
 * @param {Object} opts  {onComplete, onExit, onProgress}
 */
export function startQuiz(poem, mode, opts = {}) {
  const main = document.getElementById('app-main');
  if (!main) return;
  switch (mode) {
    case 'fill': renderFillQuiz(main, poem, opts); break;
    case 'choice': renderChoiceQuiz(main, poem, opts); break;
    case 'order': renderOrderQuiz(main, poem, opts); break;
    case 'listen': renderListenQuiz(main, poem, opts); break;
    default: renderFillQuiz(main, poem, opts);
  }
}

// ===== Fill =====

function renderFillQuiz(container, poem, opts) {
  const question = buildFillQuestion(poem);
  const answers = {}; // {line: {blankIdx: char}}

  function render() {
    const linesHtml = question.lines.map((line) => {
      const lineAnswers = answers[line.line] || {};
      const charCells = line.chars.map((c, i) => {
        if (line.blanks.includes(i)) {
          const userAns = lineAnswers[i];
          return `<span class="fill-blank" data-line="${line.line}" data-idx="${i}">${userAns || '?'}</span>`;
        }
        return `<span class="fill-cell">${c}</span>`;
      }).join('');
      return `<div class="fill-line">${charCells}</div>`;
    }).join('');

    const bankHtml = question.charBank.map((c, i) => `
      <button class="fill-bank__chip" data-char="${c}">${c}</button>
    `).join('');

    container.innerHTML = `
      <div class="quiz quiz-fill">
        <header class="quiz__header">
          <h2 class="quiz__title">${poem.title}</h2>
          <span class="quiz__mode">填空模式</span>
          <button class="quiz__exit" data-action="exit">← 返回</button>
        </header>
        <div class="quiz__body">
          <p class="quiz__prompt">把字填到诗里的空位：</p>
          <div class="fill-board">${linesHtml}</div>
          <p class="quiz__bank-label">字库（点击填入）：</p>
          <div class="fill-bank">${bankHtml}</div>
        </div>
        <footer class="quiz__footer">
          <button class="btn" data-action="clear">清空</button>
          <button class="btn btn--primary" data-action="submit">提交</button>
        </footer>
      </div>
    `;
    bindEvents();
  }

  function bindEvents() {
    container.querySelectorAll('.fill-blank').forEach(span => {
      span.addEventListener('click', () => {
        const line = parseInt(span.dataset.line, 10);
        const idx = parseInt(span.dataset.idx, 10);
        if (answers[line]?.[idx]) {
          delete answers[line][idx];
        }
        render();
      });
    });
    container.querySelectorAll('.fill-bank__chip').forEach(btn => {
      btn.addEventListener('click', () => {
        const char = btn.dataset.char;
        // 找第一个空位填入
        for (const line of question.lines) {
          for (const blankIdx of line.blanks) {
            if (!answers[line.line]?.[blankIdx]) {
              if (!answers[line.line]) answers[line.line] = {};
              answers[line.line][blankIdx] = char;
              render();
              return;
            }
          }
        }
      });
    });
    container.querySelector('[data-action="clear"]')?.addEventListener('click', () => {
      for (const k of Object.keys(answers)) delete answers[k];
      render();
    });
    container.querySelector('[data-action="submit"]')?.addEventListener('click', () => {
      const score = scoreFill(poem, answers);
      const wrongs = listWrongBlanks(poem, answers);
      showResult(container, poem, score, wrongs, 'fill', opts);
    });
    container.querySelector('[data-action="exit"]')?.addEventListener('click', () => {
      if (confirm('确定退出考核？')) opts.onExit?.();
    });
  }

  render();
}

// ===== Choice =====

function renderChoiceQuiz(container, poem, opts) {
  const allPoems = getAllPoems();
  const question = buildChoiceQuestion(poem, allPoems);
  const optionLetters = ['A', 'B', 'C', 'D'];

  container.innerHTML = `
    <div class="quiz quiz-choice">
      <header class="quiz__header">
        <h2 class="quiz__title">${poem.title}</h2>
        <span class="quiz__mode">${question.mode === 'next-line' ? '给句选下句' : '给作者选作品'}</span>
        <button class="quiz__exit" data-action="exit">← 返回</button>
      </header>
      <div class="quiz__body">
        <p class="quiz__prompt">${question.prompt}</p>
        <div class="choice-options">
          ${question.options.map((opt, i) => `
            <button class="choice-option" data-idx="${i}">
              <span class="choice-option__letter">${optionLetters[i]}</span>
              <span class="choice-option__text">${opt}</span>
            </button>
          `).join('')}
        </div>
      </div>
    </div>
  `;

  let answered = false;
  container.querySelectorAll('.choice-option').forEach(btn => {
    btn.addEventListener('click', () => {
      if (answered) return;
      answered = true;
      const idx = parseInt(btn.dataset.idx, 10);
      const isCorrect = idx === question.correctIndex;
      container.querySelectorAll('.choice-option').forEach((b, i) => {
        if (i === question.correctIndex) b.classList.add('correct');
        else if (i === idx) b.classList.add('wrong');
        b.disabled = true;
      });
      setTimeout(() => {
        const score = scoreChoice(isCorrect);
        const review = isCorrect
          ? []
          : [{ prompt: question.prompt, userAnswer: question.options[idx], correctAnswer: question.correctAnswer }];
        showResult(container, poem, score, review, 'choice', opts);
      }, 800);
    });
  });
  container.querySelector('[data-action="exit"]').addEventListener('click', () => {
    if (confirm('确定退出考核？')) opts.onExit?.();
  });
}

// ===== Order =====

function renderOrderQuiz(container, poem, opts) {
  let question;
  try {
    question = buildOrderQuestion(poem);
  } catch (e) {
    setContent('<div class="placeholder">该诗不适合出排序题</div>');
    return;
  }
  let userOrder = question.shuffledLines.map((line) => question.originalLines.indexOf(line));
  if (userOrder.every((v, i) => v === i)) {
    [userOrder[0], userOrder[1]] = [userOrder[1], userOrder[0]];
  }

  function render() {
    const itemsHtml = userOrder.map((origIdx, currentIdx) => {
      const line = question.originalLines[origIdx];
      return `
        <li class="order-item" draggable="true" data-idx="${currentIdx}">
          <span class="order-item__handle">≡</span>
          <span class="order-item__text">${line}</span>
          <div class="order-item__mobile-controls">
            <button class="order-item__btn" data-action="up" data-idx="${currentIdx}">▲</button>
            <button class="order-item__btn" data-action="down" data-idx="${currentIdx}">▼</button>
          </div>
        </li>
      `;
    }).join('');

    container.innerHTML = `
      <div class="quiz quiz-order">
        <header class="quiz__header">
          <h2 class="quiz__title">${poem.title}</h2>
          <span class="quiz__hint">拖拽排序</span>
          <button class="quiz__exit" data-action="exit">← 返回</button>
        </header>
        <div class="quiz__body">
          <p class="quiz__prompt">请按正确顺序排列诗句：</p>
          <ul class="order-list">${itemsHtml}</ul>
        </div>
        <footer class="quiz__footer">
          <button class="btn btn--primary" data-action="submit">提交</button>
        </footer>
      </div>
    `;
    bindDrag();
    bindBtns();
  }

  let dragSrcIdx = null;
  function bindDrag() {
    container.querySelectorAll('.order-item').forEach(item => {
      item.addEventListener('dragstart', (e) => {
        dragSrcIdx = parseInt(item.dataset.idx, 10);
        item.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
      });
      item.addEventListener('dragend', () => {
        item.classList.remove('dragging');
        container.querySelectorAll('.order-item').forEach(i => i.classList.remove('drag-over'));
      });
      item.addEventListener('dragover', (e) => {
        e.preventDefault();
        item.classList.add('drag-over');
      });
      item.addEventListener('dragleave', () => item.classList.remove('drag-over'));
      item.addEventListener('drop', (e) => {
        e.preventDefault();
        item.classList.remove('drag-over');
        const targetIdx = parseInt(item.dataset.idx, 10);
        if (dragSrcIdx === null || dragSrcIdx === targetIdx) return;
        const [moved] = userOrder.splice(dragSrcIdx, 1);
        userOrder.splice(targetIdx, 0, moved);
        render();
      });
    });
  }
  function bindBtns() {
    container.querySelectorAll('[data-action="up"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.idx, 10);
        if (idx === 0) return;
        [userOrder[idx - 1], userOrder[idx]] = [userOrder[idx], userOrder[idx - 1]];
        render();
      });
    });
    container.querySelectorAll('[data-action="down"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.idx, 10);
        if (idx === userOrder.length - 1) return;
        [userOrder[idx], userOrder[idx + 1]] = [userOrder[idx + 1], userOrder[idx]];
        render();
      });
    });
    container.querySelector('[data-action="submit"]').addEventListener('click', () => {
      const score = scoreOrder(poem, userOrder);
      const wrongs = isFullyCorrect(poem, userOrder) ? [] : listWrongOrderLines(poem, userOrder);
      showResult(container, poem, score, wrongs, 'order', opts);
    });
    container.querySelector('[data-action="exit"]').addEventListener('click', () => {
      if (confirm('确定退出考核？')) opts.onExit?.();
    });
  }

  render();
}

// ===== Listen =====

function renderListenQuiz(container, poem, opts) {
  let question;
  try {
    question = buildListenQuestion(poem, getAllPoems());
  } catch (e) {
    setContent('<div class="placeholder">该诗无音频，不能出听诗选诗题</div>');
    return;
  }

  container.innerHTML = `
    <div class="quiz quiz-listen">
      <header class="quiz__header">
        <h2 class="quiz__title">听诗选诗</h2>
        <button class="quiz__exit" data-action="exit">← 返回</button>
      </header>
      <div class="quiz__body">
        <div class="listen-player">
          <button class="listen-player__btn" data-action="play" aria-label="播放">▶</button>
          <p class="listen-player__hint">点击播放</p>
        </div>
        <p class="quiz__prompt">你听到的是哪首诗？</p>
        <div class="choice-options">
          ${question.options.map((opt, i) => `
            <button class="choice-option" data-idx="${i}">
              <span class="choice-option__letter">${String.fromCharCode(65 + i)}</span>
              <span class="choice-option__text">${opt}</span>
            </button>
          `).join('')}
        </div>
      </div>
    </div>
  `;

  let audioPlayed = false;
  const playBtn = container.querySelector('[data-action="play"]');
  const hint = container.querySelector('.listen-player__hint');
  playBtn.addEventListener('click', () => {
    try {
      currentAudio = audioPlay(question.audio);
      audioPlayed = true;
      playBtn.textContent = '⏸';
      hint.textContent = '点击重播';
    } catch (e) {
      console.warn('音频播放失败', e);
    }
  });
  // 自动尝试播放一次
  setTimeout(() => {
    try {
      currentAudio = audioPlay(question.audio);
      audioPlayed = true;
    } catch (e) {
      // 浏览器可能要求用户首次交互后才能自动播放
    }
  }, 300);

  let answered = false;
  container.querySelectorAll('.choice-option').forEach(btn => {
    btn.addEventListener('click', () => {
      if (answered) return;
      answered = true;
      const idx = parseInt(btn.dataset.idx, 10);
      const isCorrect = idx === question.correctIndex;
      container.querySelectorAll('.choice-option').forEach((b, i) => {
        if (i === question.correctIndex) b.classList.add('correct');
        else if (i === idx) b.classList.add('wrong');
        b.disabled = true;
      });
      setTimeout(() => {
        const score = scoreListen(isCorrect);
        const review = isCorrect
          ? []
          : [{ prompt: '正确诗名', userAnswer: question.options[idx], correctAnswer: question.correctAnswer }];
        showResult(container, poem, score, review, 'listen', opts);
      }, 800);
    });
  });
  container.querySelector('[data-action="exit"]').addEventListener('click', () => {
    if (confirm('确定退出考核？')) opts.onExit?.();
  });
}

// ===== 结果页 =====

function showResult(container, poem, score, review, mode, opts) {
  const reviewHtml = review && review.length > 0 ? `
    <div class="quiz__review">
      <h3>回顾</h3>
      <ul class="quiz__review-list">
        ${review.map(r => `
          <li>
            <span>${r.prompt || ''}</span>
            ${r.userAnswer ? `<span class="quiz__wrong">你的答案：${r.userAnswer}</span>` : ''}
            <span class="quiz__correct">正确答案：${r.correctAnswer || r.correctChar}</span>
          </li>
        `).join('')}
      </ul>
    </div>
  ` : '';
  const msg = score === 100 ? '🎉 太棒了！' : score >= 60 ? '继续努力！' : '再学一次吧！';

  container.innerHTML = `
    <div class="quiz quiz-result">
      <h2 class="quiz__score">${score} 分</h2>
      <p class="quiz__result-msg">${msg}</p>
      ${reviewHtml}
      <div class="quiz__actions">
        <button class="btn" data-action="retry">再来一次</button>
        <button class="btn btn--primary" data-action="next">完成</button>
      </div>
    </div>
  `;
  container.querySelector('[data-action="retry"]')?.addEventListener('click', () => {
    startQuiz(poem, mode, opts);
  });
  container.querySelector('[data-action="next"]')?.addEventListener('click', () => {
    if (opts.onComplete) opts.onComplete(score, { mode, poemId: poem.id, review });
    else if (opts.onExit) opts.onExit();
  });
}

function setContent(html) {
  const main = document.getElementById('app-main');
  if (main) main.innerHTML = html;
}
