# Task 15: 考核模式-填空

**依赖：** 10, 12
**并行组：** quiz-modes
**估时：** 1 天

**Files:**
- Create: `src/js/quiz/fill.js`
- Create: `src/js/ui/quiz.js` (基础外壳)
- Create: `tests/quiz-fill.test.js`

## 背景

设计文档 4.3 节规定 4 种考核模式之一 —— **A. 诗句填空**。算法从 `poem.keySentences` 取挖空位置，把所有挖空涉及的字放入"字库"，孩子从字库选字填到空位；判分：每空 10 分（满分 100 / 空数向下取整）。

本任务只做考核的**判分纯函数 + 填空模式 UI**（基础外壳 `quiz.js`），其它 3 种模式（Task 16-18）共用 `quiz.js` 外壳并扩展。

---

## Step 1: 写失败的测试

[本任务分两部分：纯函数判分（可测）+ UI 渲染（手动测）。先写纯函数测试。]

```javascript
// tests/quiz-fill.test.js
import { describe, it, expect } from 'vitest';
import { buildFillQuestion, scoreFill, collectFillChars } from '../src/js/quiz/fill.js';

const SAMPLE_POEM = {
  id: 'g1-01',
  title: '静夜思',
  content: ['床前明月光', '疑是地上霜', '举头望明月', '低头思故乡'],
  keySentences: [
    {
      line: 0,
      chars: ['床', '前', '明', '月', '光'],
      blanks: [2, 3], // 挖"明"、"月"
    },
    {
      line: 3,
      chars: ['低', '头', '思', '故', '乡'],
      blanks: [4], // 挖"乡"
    },
  ],
};

describe('collectFillChars', () => {
  it('应从所有挖空处收集正确的字', () => {
    const chars = collectFillChars(SAMPLE_POEM);
    expect(chars).toEqual(expect.arrayContaining(['明', '月', '乡']));
    expect(chars.length).toBe(3);
  });

  it('没有 keySentences 时返回空数组', () => {
    expect(collectFillChars({ content: ['床前明月光'], keySentences: [] })).toEqual([]);
  });

  it('应处理没有挖空的情况', () => {
    const p = { content: ['床前明月光'], keySentences: [{ line: 0, chars: ['床','前','明','月','光'], blanks: [] }] };
    expect(collectFillChars(p)).toEqual([]);
  });
});

describe('buildFillQuestion', () => {
  it('应返回结构化的填空题（含字库、挖空位置）', () => {
    const q = buildFillQuestion(SAMPLE_POEM);

    expect(q.poemId).toBe('g1-01');
    expect(q.title).toBe('静夜思');
    expect(q.lines).toHaveLength(4);

    // 第 1 行有 2 个空
    expect(q.lines[0].blanks).toEqual([2, 3]);
    expect(q.lines[0].chars).toEqual(['床', '前', '明', '月', '光']);

    // 第 4 行有 1 个空
    expect(q.lines[3].blanks).toEqual([4]);

    // 字库应包含 3 个挖空字 + 干扰字（默认 2 倍，取 6 个干扰）
    expect(q.charBank.length).toBeGreaterThanOrEqual(3);
    expect(q.charBank).toEqual(expect.arrayContaining(['明', '月', '乡']));
  });

  it('字库大小应包含挖空字 + 至少 3 个干扰字', () => {
    const q = buildFillQuestion(SAMPLE_POEM, { distractorCount: 3 });
    // 3 个挖空字 + 3 干扰 = 6
    expect(q.charBank.length).toBe(6);
  });
});

describe('scoreFill', () => {
  it('全部正确应得 100 分', () => {
    const answers = {
      0: { 2: '明', 3: '月' },
      3: { 4: '乡' },
    };
    expect(scoreFill(SAMPLE_POEM, answers)).toBe(100);
  });

  it('全部错误应得 0 分', () => {
    const answers = {
      0: { 2: '前', 3: '前' },
      3: { 4: '故' },
    };
    expect(scoreFill(SAMPLE_POEM, answers)).toBe(0);
  });

  it('部分正确按比例给分（每空 10 分，取整）', () => {
    // 3 个空，1 个对 = 33 分
    const answers = {
      0: { 2: '明', 3: '前' }, // 第 2 空错
      3: { 4: '故' },          // 第 3 空错
    };
    expect(scoreFill(SAMPLE_POEM, answers)).toBe(33);
  });

  it('空答案应得 0 分', () => {
    expect(scoreFill(SAMPLE_POEM, {})).toBe(0);
  });

  it('缺回答时应按缺失判错', () => {
    const answers = { 0: { 2: '明' } }; // 缺 3 个空
    expect(scoreFill(SAMPLE_POEM, answers)).toBe(33);
  });

  it('应支持 10 空满分 100 的情况（4 行诗）', () => {
    const p = {
      content: ['一二三四五', '六七八九十'],
      keySentences: [
        { line: 0, chars: ['一','二','三','四','五'], blanks: [0,1,2,3,4] },
        { line: 1, chars: ['六','七','八','九','十'], blanks: [0,1,2,3,4] },
      ],
    };
    const allCorrect = { 0: {0:'一',1:'二',2:'三',3:'四',4:'五'}, 1: {0:'六',1:'七',2:'八',3:'九',4:'十'} };
    expect(scoreFill(p, allCorrect)).toBe(100);
  });
});

describe('scoreFill 错题列表', () => {
  it('应能导出错的空位（给 UI 用于错题回顾）', async () => {
    // 附加导出函数：listWrongBlanks
    const { listWrongBlanks } = await import('../src/js/quiz/fill.js');
    const answers = {
      0: { 2: '明', 3: '前' },
      3: { 4: '故' },
    };
    const wrongs = listWrongBlanks(SAMPLE_POEM, answers);
    expect(wrongs).toEqual([
      { line: 0, blankIdx: 3, userAnswer: '前', correctChar: '月' },
      { line: 3, blankIdx: 4, userAnswer: '故', correctChar: '乡' },
    ]);
  });
});
```

## Step 2: 运行测试验证失败

```bash
npm test -- tests/quiz-fill.test.js
```

Expected: FAIL with "Cannot find module '../src/js/quiz/fill.js'"

## Step 3: 实现最小代码

### 3.1 创建 `src/js/quiz/fill.js`（纯函数判分 + 题目构建）

```javascript
/**
 * 考核模式 A：诗句填空
 *
 * 数据来源：poem.keySentences
 * 判分：每空 10 分（满分 100，按比例取整）
 *
 * 纯函数：所有函数无副作用，方便单测
 */

import { getPoem, getPoemsByGrade } from '../data.js';

/**
 * 从所有挖空位置收集正确的字（用于校验 + 字库种子）
 * @param {Poem} poem
 * @returns {string[]}
 */
export function collectFillChars(poem) {
  if (!poem.keySentences || poem.keySentences.length === 0) return [];
  const chars = [];
  for (const ks of poem.keySentences) {
    for (const idx of ks.blanks) {
      if (ks.chars[idx]) chars.push(ks.chars[idx]);
    }
  }
  return chars;
}

/**
 * 从同年级的其他诗里抽干扰字
 * @param {Poem} poem
 * @param {number} need
 * @returns {string[]}
 */
function pickDistractorChars(poem, need) {
  if (need <= 0) return [];
  const allText = (poem.content || []).join('');
  // 同年级其他诗
  const peers = getPoemsByGrade(poem.grade).filter(p => p.id !== poem.id);
  const pool = [];
  for (const p of peers) {
    pool.push(...(p.content || []).split(''));
  }
  // 过滤：不在挖空字里、不在当前诗里（避免直接揭示答案）
  const correctSet = new Set(collectFillChars(poem));
  const inSamePoem = new Set(allText.split(''));
  const filtered = pool.filter(c => !correctSet.has(c) && !inSamePoem.has(c));
  // 去重
  const unique = [...new Set(filtered)];
  // 打乱
  for (let i = unique.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [unique[i], unique[j]] = [unique[j], unique[i]];
  }
  return unique.slice(0, need);
}

/**
 * 构建填空题数据结构（UI 渲染用）
 * @param {Poem} poem
 * @param {Object} [opts]
 * @param {number} [opts.distractorCount=2] 每个挖空字配几个干扰字
 * @returns {{
 *   poemId: string,
 *   title: string,
 *   lines: Array<{line:number, chars:string[], blanks:number[]}>,
 *   charBank: string[]
 * }}
 */
export function buildFillQuestion(poem, opts = {}) {
  const distractorCount = opts.distractorCount ?? 2;
  const correctChars = collectFillChars(poem);
  const distractors = pickDistractorChars(poem, correctChars.length * distractorCount);
  const charBank = [...correctChars, ...distractors];
  // 打乱字库
  for (let i = charBank.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [charBank[i], charBank[j]] = [charBank[j], charBank[i]];
  }
  return {
    poemId: poem.id,
    title: poem.title,
    lines: poem.keySentences.map(ks => ({
      line: ks.line,
      chars: ks.chars,
      blanks: ks.blanks,
    })),
    charBank,
  };
}

/**
 * 判分：每空 10 分，按正确率取整
 * @param {Poem} poem
 * @param {Object} answers - { [lineIdx]: { [blankIdx]: userChar } }
 * @returns {number} 0-100
 */
export function scoreFill(poem, answers) {
  const total = collectFillChars(poem).length;
  if (total === 0) return 0;
  let correct = 0;
  for (const ks of poem.keySentences) {
    for (const blankIdx of ks.blanks) {
      const userAnswer = answers?.[ks.line]?.[blankIdx];
      const correctChar = ks.chars[blankIdx];
      if (userAnswer && userAnswer === correctChar) correct++;
    }
  }
  return Math.round((correct / total) * 100);
}

/**
 * 列出错的空位（用于错题回顾 UI）
 * @param {Poem} poem
 * @param {Object} answers
 * @returns {Array<{line:number, blankIdx:number, userAnswer:string, correctChar:string}>}
 */
export function listWrongBlanks(poem, answers) {
  const wrongs = [];
  for (const ks of poem.keySentences) {
    for (const blankIdx of ks.blanks) {
      const userAnswer = answers?.[ks.line]?.[blankIdx];
      const correctChar = ks.chars[blankIdx];
      if (userAnswer !== correctChar) {
        wrongs.push({ line: ks.line, blankIdx, userAnswer: userAnswer || '', correctChar });
      }
    }
  }
  return wrongs;
}
```

### 3.2 创建 `src/js/ui/quiz.js`（考核外壳 + 填空模式 UI）

```javascript
/**
 * 考核 UI 外壳
 * - 4 种考核模式共用入口：startQuiz(poem, mode)
 * - 每个模式内部调用对应 ui render 函数
 *
 * 本任务只实现填空模式的 UI；Task 16/17/18 扩展其它 3 种模式。
 */

import { buildFillQuestion, scoreFill, listWrongBlanks } from '../quiz/fill.js';

/**
 * 启动考核
 * @param {Object} poem
 * @param {'fill'|'choice'|'order'|'listen'} mode
 * @param {Object} [opts] - 回调：{ onComplete(score, result) }
 */
export function startQuiz(poem, mode, opts = {}) {
  const main = document.getElementById('app-main');
  if (!main) return;

  switch (mode) {
    case 'fill':
      renderFillQuiz(main, poem, opts);
      break;
    case 'choice':
      // Task 16
      main.innerHTML = '<div class="placeholder">选择题模式（Task 16）</div>';
      break;
    case 'order':
      // Task 17
      main.innerHTML = '<div class="placeholder">排序模式（Task 17）</div>';
      break;
    case 'listen':
      // Task 18
      main.innerHTML = '<div class="placeholder">听诗选诗（Task 18）</div>';
      break;
    default:
      main.innerHTML = '<div class="placeholder">未知考核模式</div>';
  }
}

/**
 * 渲染填空考核 UI
 * - 每行诗显示，挖空处显示下划线
 * - 底部字库按钮
 * - 提交后判分 + 错题回顾
 */
function renderFillQuiz(container, poem, opts) {
  const question = buildFillQuestion(poem);
  const answers = {}; // { [line]: { [blankIdx]: char } }
  let bankIndex = 0;

  function render() {
    const linesHtml = question.lines.map(line => {
      const segs = line.chars.map((ch, idx) => {
        if (line.blanks.includes(idx)) {
          const filled = answers[line.line]?.[idx];
          return `<span class="fill-blank ${filled ? 'filled' : 'empty'}" data-line="${line.line}" data-blank="${idx}">${filled || '　'}</span>`;
        }
        return `<span class="fill-char">${ch}</span>`;
      }).join('');
      return `<div class="fill-line">${segs}</div>`;
    }).join('');

    const bankHtml = question.charBank.map((ch, i) => {
      return `<button class="fill-bank-char" data-bank-i="${i}" data-char="${ch}">${ch}</button>`;
    }).join('');

    container.innerHTML = `
      <div class="quiz quiz-fill">
        <header class="quiz__header">
          <h2 class="quiz__title">${poem.title}</h2>
          <button class="quiz__exit" data-action="exit">← 返回</button>
        </header>
        <div class="quiz__body">
          ${linesHtml}
        </div>
        <div class="quiz__bank">
          <div class="quiz__bank-label">字库（点击填入）</div>
          <div class="quiz__bank-chars">${bankHtml}</div>
        </div>
        <footer class="quiz__footer">
          <button class="btn btn--primary quiz__submit" data-action="submit">提交</button>
        </footer>
      </div>
    `;

    bindEvents();
  }

  function bindEvents() {
    container.querySelectorAll('.fill-bank-char').forEach(btn => {
      btn.addEventListener('click', () => {
        const char = btn.dataset.char;
        const idx = parseInt(btn.dataset.bankI, 10);
        // 找下一个空的空位
        let targetLine = null, targetBlank = null;
        outer: for (const line of question.lines) {
          for (const b of line.blanks) {
            if (!answers[line.line]?.[b]) {
              targetLine = line.line;
              targetBlank = b;
              break outer;
            }
          }
        }
        if (targetLine === null) return;
        if (!answers[targetLine]) answers[targetLine] = {};
        answers[targetLine][targetBlank] = char;
        // 标记字库按钮为已用
        btn.disabled = true;
        btn.classList.add('used');
        render();
      });
    });

    container.querySelectorAll('.fill-blank').forEach(span => {
      span.addEventListener('click', () => {
        const line = parseInt(span.dataset.line, 10);
        const blank = parseInt(span.dataset.blank, 10);
        if (answers[line]?.[blank]) {
          delete answers[line][blank];
          render();
        }
      });
    });

    container.querySelector('[data-action="submit"]').addEventListener('click', () => {
      const score = scoreFill(poem, answers);
      const wrongs = listWrongBlanks(poem, answers);
      showFillResult(container, poem, score, wrongs, opts);
    });

    container.querySelector('[data-action="exit"]').addEventListener('click', () => {
      if (confirm('确定退出考核？进度不会保存。')) {
        if (opts.onExit) opts.onExit();
      }
    });
  }

  render();
}

/**
 * 显示填空结果 + 错题回顾
 */
function showFillResult(container, poem, score, wrongs, opts) {
  const isPerfect = wrongs.length === 0;
  const wrongsHtml = wrongs.length > 0 ? `
    <div class="quiz__review">
      <h3>错题回顾</h3>
      ${wrongs.map(w => `
        <div class="quiz__review-item">
          <span class="quiz__review-line">第 ${w.line + 1} 句：</span>
          你的答案 <span class="quiz__wrong">${w.userAnswer || '（空）'}</span>
          正确答案 <span class="quiz__correct">${w.correctChar}</span>
        </div>
      `).join('')}
    </div>
  ` : '';

  container.innerHTML = `
    <div class="quiz quiz-result">
      <h2 class="quiz__score">${score} 分</h2>
      <p class="quiz__result-msg">${isPerfect ? '🎉 全对！' : '继续加油！'}</p>
      ${wrongsHtml}
      <div class="quiz__actions">
        <button class="btn" data-action="retry">再来一次</button>
        <button class="btn btn--primary" data-action="exit">完成</button>
      </div>
    </div>
  `;

  container.querySelector('[data-action="retry"]').addEventListener('click', () => {
    renderFillQuiz(container, poem, opts);
  });
  container.querySelector('[data-action="exit"]').addEventListener('click', () => {
    if (opts.onComplete) opts.onComplete(score, { mode: 'fill', wrongs });
    else if (opts.onExit) opts.onExit();
  });
}
```

### 3.3 创建 `src/css/main.css` 追加填空 UI 样式（扩展）

在已有 `main.css` 末尾追加（如已存在则跳过）：

```css
/* ===== 考核 - 填空 ===== */
.quiz { padding: 1rem; max-width: 600px; margin: 0 auto; }
.quiz__header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
.quiz__title { margin: 0; font-size: 1.4rem; }
.quiz__exit { background: none; border: none; color: #4a90e2; cursor: pointer; font-size: 1rem; }
.quiz__body { background: #fff; padding: 1.5rem; border-radius: 12px; margin-bottom: 1rem; }
.fill-line { font-size: 1.6rem; line-height: 2.2; text-align: center; margin-bottom: 0.5rem; font-family: "STKaiti", "KaiTi", serif; }
.fill-char { display: inline-block; min-width: 1.5em; }
.fill-blank { display: inline-block; min-width: 1.8em; margin: 0 2px; border-bottom: 2px solid #4a90e2; text-align: center; cursor: pointer; user-select: none; }
.fill-blank.empty { color: transparent; }
.fill-blank.filled { background: #e8f4ff; border-radius: 4px; }
.quiz__bank-label { font-size: 0.9rem; color: #7f8c8d; margin-bottom: 0.5rem; text-align: center; }
.quiz__bank-chars { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; padding: 1rem; background: #fff; border-radius: 12px; }
.fill-bank-char { min-width: 44px; min-height: 44px; padding: 0.5rem 0.8rem; font-size: 1.3rem; background: #f5f7fa; border: 2px solid #e0e6ed; border-radius: 8px; cursor: pointer; transition: all 0.15s; font-family: "STKaiti", "KaiTi", serif; }
.fill-bank-char:hover:not(:disabled) { background: #4a90e2; color: #fff; border-color: #4a90e2; }
.fill-bank-char:disabled { opacity: 0.3; cursor: not-allowed; text-decoration: line-through; }
.quiz__footer { margin-top: 1rem; text-align: center; }
.btn { padding: 0.7rem 1.5rem; border: none; border-radius: 8px; cursor: pointer; font-size: 1rem; background: #f5f7fa; color: #2c3e50; margin: 0 0.3rem; }
.btn--primary { background: #4a90e2; color: #fff; }

/* 错题回顾 */
.quiz__score { font-size: 3rem; text-align: center; margin: 1rem 0; color: #4a90e2; }
.quiz__result-msg { text-align: center; font-size: 1.2rem; margin-bottom: 1rem; }
.quiz__review { background: #fff; padding: 1rem; border-radius: 12px; margin: 1rem 0; }
.quiz__review h3 { margin-top: 0; color: #dc3545; }
.quiz__review-item { padding: 0.5rem 0; border-bottom: 1px dashed #e0e6ed; }
.quiz__wrong { color: #dc3545; text-decoration: line-through; padding: 0 4px; }
.quiz__correct { color: #28a745; font-weight: bold; padding: 0 4px; }
.quiz__actions { text-align: center; margin-top: 1rem; }

/* 移动端：放大触控目标 */
@media (max-width: 640px) {
  .fill-line { font-size: 1.4rem; }
  .fill-bank-char { min-width: 50px; min-height: 50px; font-size: 1.5rem; }
}
```

## Step 4: 运行测试验证通过

```bash
npm test -- tests/quiz-fill.test.js
```

Expected: PASS（10+ 个测试，覆盖 collectFillChars、buildFillQuestion、scoreFill、listWrongBlanks）

## Step 5: 提交

```bash
git add src/js/quiz/fill.js src/js/ui/quiz.js src/css/main.css tests/quiz-fill.test.js
git commit -m "feat(quiz): 考核模式-填空（判分 + UI + 错题回顾）"
```

## 完成标志

```bash
echo done > .tasks/done/15
```

## 关键说明

1. **纯函数优先**：`buildFillQuestion / scoreFill / listWrongBlanks / collectFillChars` 全是无副作用函数，可独立测试。UI 在 `ui/quiz.js` 单独维护。
2. **字库算法**：挖空字 + 2 倍干扰字（默认），从同年级其他诗里抽，去重 + 打乱 + 排除当前诗的字（防止直接揭示）。
3. **判分公式**：每空 10 分不是死值，是 `Math.round((correct / total) * 100)`。一首诗 10 个空时正好 10 分/空；3 个空时约 33 分/空；最大公约数由诗决定。
4. **错误处理**：`collectFillChars` 在 `keySentences` 为空时返回 `[]`，`scoreFill` 此时返回 0；UI 在此情况应当不进入考核（在 review.js 层控制）。
5. **Task 16-18 复用**：`ui/quiz.js` 的 `startQuiz(poem, mode)` 是统一入口；填空 UI 由 `renderFillQuiz` 私有实现，其它模式后续任务补完对应 `render*` 函数。
6. **移动端适配**：所有按钮最小 44×44 px，字号自动放大；挖空点击可清除填错的字（响应式友好）。
7. **退出/重做**：考核页有"返回"按钮（带确认）和"再来一次"按钮；完成时回调 `opts.onComplete(score, result)`，由 review.js 接收并调用 `srs.nextReview()`（Task 19）。

## 依赖关系

- **被依赖：** Task 16/17/18（共用 ui/quiz.js 外壳），Task 19（复习流程）
- **不依赖：** Task 13/14（详情页/列表页）的 UI；只依赖 `data.js` 的 `getPoem/getPoemsByGrade` 与 `poem.keySentences` schema（Task 3 已定义）。