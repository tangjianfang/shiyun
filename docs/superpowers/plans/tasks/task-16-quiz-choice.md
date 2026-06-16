# Task 16: 考核模式-选择题

**依赖：** 10, 12
**并行组：** quiz-modes
**估时：** 1 天

**Files:**
- Create: `src/js/quiz/choice.js`
- Create: `tests/quiz-choice.test.js`

## 背景

设计文档 4.3 节规定的 4 种考核模式之一 —— **B. 选择题**。两种题型（随机选一种或用户配置）：

- **A. 给句选下句**：题目给一句诗，4 选项里选下句（**注意**：必须是同一首诗的相邻下一句）
- **B. 给作者选作品**：题目给作者，4 选项里选对应作品（4 首诗名里选一首该作者写的）

干扰项自动从所有诗里抽（避免同首诗内）。判分：答对 100，错 0。

本任务做**判分纯函数 + 题目构建**，UI 由 Task 15 已建的 `ui/quiz.js` 外壳扩展 `renderChoiceQuiz`。

---

## Step 1: 写失败的测试

```javascript
// tests/quiz-choice.test.js
import { describe, it, expect } from 'vitest';
import { buildChoiceQuestion, scoreChoice, pickRandomMode } from '../src/js/quiz/choice.js';

// 测试用诗库
const POEMS = [
  { id: 'g1-01', title: '静夜思', author: '李白', dynasty: '唐', grade: 1,
    content: ['床前明月光', '疑是地上霜', '举头望明月', '低头思故乡'] },
  { id: 'g1-02', title: '春晓', author: '孟浩然', dynasty: '唐', grade: 1,
    content: ['春眠不觉晓', '处处闻啼鸟', '夜来风雨声', '花落知多少'] },
  { id: 'g1-05', title: '登鹳雀楼', author: '王之涣', dynasty: '唐', grade: 1,
    content: ['白日依山尽', '黄河入海流', '欲穷千里目', '更上一层楼'] },
  { id: 'g1-08', title: '望庐山瀑布', author: '李白', dynasty: '唐', grade: 2,
    content: ['日照香炉生紫烟', '遥看瀑布挂前川', '飞流直下三千尺', '疑是银河落九天'] },
  { id: 'g2-01', title: '早发白帝城', author: '李白', dynasty: '唐', grade: 2,
    content: ['朝辞白帝彩云间', '千里江陵一日还', '两岸猿声啼不住', '轻舟已过万重山'] },
];

describe('buildChoiceQuestion - 给句选下句 (next-line)', () => {
  it('应返回正确数目的选项 (4个)', () => {
    const q = buildChoiceQuestion(POEMS[0], POEMS, 'next-line');
    expect(q.options).toHaveLength(4);
    expect(q.options).toContain('疑是地上霜'); // 正确答案
  });

  it('应有正确的题目（给出上句）', () => {
    const q = buildChoiceQuestion(POEMS[0], POEMS, 'next-line');
    expect(q.mode).toBe('next-line');
    expect(q.prompt).toContain('床前明月光');
  });

  it('正确答案应是同一首诗的下一句', () => {
    const q = buildChoiceQuestion(POEMS[0], POEMS, 'next-line');
    expect(q.correctAnswer).toBe('疑是地上霜');
  });

  it('干扰项应来自其他诗，且不与正确答案重复', () => {
    const q = buildChoiceQuestion(POEMS[0], POEMS, 'next-line');
    const distractors = q.options.filter(o => o !== q.correctAnswer);
    expect(distractors.length).toBe(3);
    // 干扰项应不来自当前诗
    for (const d of distractors) {
      expect(POEMS[0].content).not.toContain(d);
    }
  });

  it('不能选最后一句（没有下一句）', () => {
    // POEMS[0] 的最后一句是"低头思故乡"，下一句不存在
    // 构建函数应跳过这种情况或用前一句代替
    const allQuestions = [];
    for (const p of POEMS) {
      for (let i = 0; i < p.content.length - 1; i++) {
        allQuestions.push(buildChoiceQuestion(p, POEMS, 'next-line'));
      }
    }
    // 每道题应有 4 个选项
    for (const q of allQuestions) {
      expect(q.options.length).toBe(4);
    }
  });

  it('诗库太小（<4首）时也应工作（允许重复选项作为兜底）', () => {
    const smallPool = [POEMS[0], POEMS[1]];
    const q = buildChoiceQuestion(POEMS[0], smallPool, 'next-line');
    expect(q.options.length).toBe(4); // 即使需要重复
  });
});

describe('buildChoiceQuestion - 给作者选作品 (by-author)', () => {
  it('应返回 4 个诗名选项', () => {
    const q = buildChoiceQuestion(POEMS[3], POEMS, 'by-author'); // 李白的望庐山瀑布
    expect(q.options).toHaveLength(4);
    expect(q.options).toContain('望庐山瀑布'); // 正确答案
  });

  it('题目应展示作者名', () => {
    const q = buildChoiceQuestion(POEMS[3], POEMS, 'by-author');
    expect(q.prompt).toContain('李白');
  });

  it('干扰项应是其他作者的作品', () => {
    const q = buildChoiceQuestion(POEMS[3], POEMS, 'by-author');
    const distractors = q.options.filter(o => o !== q.correctAnswer);
    for (const d of distractors) {
      const foundPoem = POEMS.find(p => p.title === d);
      expect(foundPoem.author).not.toBe('李白');
    }
  });

  it('同一作者有多首作品时应不重复（不把同作者其他作品当干扰项）', () => {
    // 李白有 3 首: 静夜思、望庐山瀑布、早发白帝城
    const q = buildChoiceQuestion(POEMS[3], POEMS, 'by-author'); // 望庐山瀑布
    const distractors = q.options.filter(o => o !== q.correctAnswer);
    for (const d of distractors) {
      const foundPoem = POEMS.find(p => p.title === d);
      expect(foundPoem.author).not.toBe('李白');
    }
  });

  it('作者只有 1 首作品时也能构造题目', () => {
    // 王之涣只有登鹳雀楼一首
    const q = buildChoiceQuestion(POEMS[2], POEMS, 'by-author');
    expect(q.options.length).toBe(4);
    expect(q.correctAnswer).toBe('登鹳雀楼');
  });
});

describe('pickRandomMode', () => {
  it('应返回两种模式之一', () => {
    const mode = pickRandomMode();
    expect(['next-line', 'by-author']).toContain(mode);
  });
});

describe('scoreChoice', () => {
  it('答对应得 100 分', () => {
    expect(scoreChoice(true)).toBe(100);
  });

  it('答错应得 0 分', () => {
    expect(scoreChoice(false)).toBe(0);
  });
});
```

## Step 2: 运行测试验证失败

```bash
npm test -- tests/quiz-choice.test.js
```

Expected: FAIL with "Cannot find module '../src/js/quiz/choice.js'"

## Step 3: 实现最小代码

### 3.1 创建 `src/js/quiz/choice.js`（纯函数判分 + 题目构建）

```javascript
/**
 * 考核模式 B：选择题
 *
 * 两种题型：
 * - next-line: 给上句选下句（同一首诗相邻句）
 * - by-author: 给作者选作品（4 首诗名里选该作者的一首）
 *
 * 判分：答对 100，错 0
 *
 * 纯函数：所有函数无副作用，方便单测
 */

/**
 * @typedef {'next-line'|'by-author'} ChoiceMode
 */

/**
 * 打乱数组（Fisher-Yates）
 * @template T
 * @param {T[]} arr
 * @returns {T[]} 同一个数组引用，已就地打乱
 */
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * 随机选一种题型
 * @returns {ChoiceMode}
 */
export function pickRandomMode() {
  return Math.random() < 0.5 ? 'next-line' : 'by-author';
}

/**
 * 判分：答对 100，错 0
 * @param {boolean} isCorrect
 * @returns {number}
 */
export function scoreChoice(isCorrect) {
  return isCorrect ? 100 : 0;
}

/**
 * 构建选择题（next-line: 给句选下句）
 * @param {Object} poem 当前诗
 * @param {Object[]} allPoems 全部诗（用于抽干扰项）
 * @returns {{
 *   poemId: string,
 *   mode: 'next-line',
 *   prompt: string,
 *   options: string[],
 *   correctAnswer: string,
 *   correctIndex: number,
 * }}
 */
function buildNextLineQuestion(poem, allPoems) {
  // 选一句有下一句的（不能选最后一句）
  const maxLine = poem.content.length - 1;
  if (maxLine < 1) {
    throw new Error('诗少于 2 句，不能出 next-line 题');
  }
  const lineIdx = Math.floor(Math.random() * maxLine); // 0..maxLine-1
  const correctAnswer = poem.content[lineIdx + 1];
  const promptLine = poem.content[lineIdx];

  // 干扰项：从其他诗里抽下一句样式的句子
  const distractorPool = [];
  for (const p of allPoems) {
    if (p.id === poem.id) continue; // 排除同首诗
    for (const line of p.content) {
      if (line !== correctAnswer) distractorPool.push(line);
    }
  }

  let distractors = shuffle([...new Set(distractorPool)]).slice(0, 3);

  // 干扰项不足 3 个时（诗库太小）：用任何非正确句填充（允许与 prompt 重复以保证 4 选项）
  if (distractors.length < 3) {
    const fillers = [];
    for (const p of allPoems) {
      for (const line of p.content) {
        if (line !== correctAnswer) fillers.push(line);
      }
    }
    shuffle(fillers);
    for (const f of fillers) {
      if (distractors.length >= 3) break;
      if (!distractors.includes(f)) distractors.push(f);
    }
    // 极端兜底：重复
    while (distractors.length < 3) {
      distractors.push(correctAnswer); // 强制凑数（实际中诗库足够大不会触发）
    }
  }

  const options = shuffle([correctAnswer, ...distractors]);
  const correctIndex = options.indexOf(correctAnswer);

  return {
    poemId: poem.id,
    mode: 'next-line',
    prompt: `请选择 "${promptLine}" 的下一句：`,
    options,
    correctAnswer,
    correctIndex,
  };
}

/**
 * 构建选择题（by-author: 给作者选作品）
 * @param {Object} poem 当前诗
 * @param {Object[]} allPoems
 * @returns {{
 *   poemId: string,
 *   mode: 'by-author',
 *   prompt: string,
 *   options: string[],
 *   correctAnswer: string,
 *   correctIndex: number,
 * }}
 */
function buildByAuthorQuestion(poem, allPoems) {
  const correctAnswer = poem.title;
  const prompt = `请选择作者 "${poem.author}" 的作品：`;

  // 干扰项：其他作者的作品（不包含同作者其他作品，避免题目歧义）
  const distractorPool = allPoems
    .filter(p => p.id !== poem.id && p.author !== poem.author)
    .map(p => p.title);

  let distractors = shuffle([...new Set(distractorPool)]).slice(0, 3);

  // 干扰项不足 3 个时（诗库小）：用任何非正确诗名填充
  if (distractors.length < 3) {
    const allTitles = allPoems.map(p => p.title).filter(t => t !== correctAnswer);
    shuffle(allTitles);
    for (const t of allTitles) {
      if (distractors.length >= 3) break;
      if (!distractors.includes(t)) distractors.push(t);
    }
    while (distractors.length < 3) {
      distractors.push(correctAnswer);
    }
  }

  const options = shuffle([correctAnswer, ...distractors]);
  const correctIndex = options.indexOf(correctAnswer);

  return {
    poemId: poem.id,
    mode: 'by-author',
    prompt,
    options,
    correctAnswer,
    correctIndex,
  };
}

/**
 * 构建选择题（统一入口，根据 mode 选择）
 * @param {Object} poem 当前诗
 * @param {Object[]} allPoems 全部诗
 * @param {ChoiceMode} [mode] 不传则随机
 * @returns {Object}
 */
export function buildChoiceQuestion(poem, allPoems, mode) {
  const m = mode || pickRandomMode();
  if (m === 'next-line') return buildNextLineQuestion(poem, allPoems);
  return buildByAuthorQuestion(poem, allPoems);
}
```

### 3.2 扩展 `src/js/ui/quiz.js`（追加选择题 UI）

在已有 `src/js/ui/quiz.js` 顶部 import 区追加：

```javascript
import { buildChoiceQuestion, scoreChoice } from '../quiz/choice.js';
```

在 `startQuiz` 函数的 `switch (mode)` 块中，把 `'choice'` 的占位替换为：

```javascript
    case 'choice':
      renderChoiceQuiz(main, poem, opts);
      break;
```

在文件末尾追加新函数：

```javascript
/**
 * 渲染选择题 UI
 * - 4 个选项按钮（A/B/C/D）
 * - 点击立即判分，显示对错 + 解析
 */
function renderChoiceQuiz(container, poem, opts) {
  // 从全局拿全部诗（由 data.js 暴露）
  import('../data.js').then(({ getAllPoems }) => {
    const allPoems = getAllPoems();
    const question = buildChoiceQuestion(poem, allPoems);
    renderQuestion(container, poem, question, opts);
  });
}

function renderQuestion(container, poem, question, opts) {
  const optionLetters = ['A', 'B', 'C', 'D'];
  const optionsHtml = question.options.map((opt, i) => `
    <button class="choice-option" data-idx="${i}">
      <span class="choice-option__letter">${optionLetters[i]}</span>
      <span class="choice-option__text">${opt}</span>
    </button>
  `).join('');

  container.innerHTML = `
    <div class="quiz quiz-choice">
      <header class="quiz__header">
        <h2 class="quiz__title">${poem.title}</h2>
        <span class="quiz__mode">${question.mode === 'next-line' ? '给句选下句' : '给作者选作品'}</span>
        <button class="quiz__exit" data-action="exit">← 返回</button>
      </header>
      <div class="quiz__body">
        <p class="quiz__prompt">${question.prompt}</p>
        <div class="choice-options">${optionsHtml}</div>
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
      // 标记对错
      container.querySelectorAll('.choice-option').forEach((b, i) => {
        if (i === question.correctIndex) b.classList.add('correct');
        else if (i === idx) b.classList.add('wrong');
        b.disabled = true;
      });
      // 延迟展示结果
      setTimeout(() => showChoiceResult(container, poem, isCorrect, question, opts), 800);
    });
  });

  container.querySelector('[data-action="exit"]').addEventListener('click', () => {
    if (confirm('确定退出考核？')) {
      if (opts.onExit) opts.onExit();
    }
  });
}

function showChoiceResult(container, poem, isCorrect, question, opts) {
  const score = scoreChoice(isCorrect);
  container.innerHTML = `
    <div class="quiz quiz-result">
      <h2 class="quiz__score">${score} 分</h2>
      <p class="quiz__result-msg">${isCorrect ? '🎉 答对了！' : '❌ 答错了'}</p>
      <div class="quiz__review">
        <p>题目：${question.prompt}</p>
        <p>正确答案：<span class="quiz__correct">${question.correctAnswer}</span></p>
      </div>
      <div class="quiz__actions">
        <button class="btn btn--primary" data-action="next">继续</button>
      </div>
    </div>
  `;
  container.querySelector('[data-action="next"]').addEventListener('click', () => {
    if (opts.onComplete) opts.onComplete(score, { mode: 'choice', isCorrect, poemId: poem.id });
    else if (opts.onExit) opts.onExit();
  });
}
```

### 3.3 在 `src/js/data.js` 中追加 `getAllPoems`（如已存在则跳过）

```javascript
/** 取所有诗 */
export function getAllPoems() {
  return Array.from(poems.values());
}
```

### 3.4 在 `src/css/main.css` 追加选择题样式

```css
/* ===== 考核 - 选择 ===== */
.quiz-choice .quiz__mode { color: #7f8c8d; font-size: 0.9rem; }
.quiz__prompt { font-size: 1.2rem; text-align: center; margin: 1rem 0; line-height: 1.6; }
.choice-options { display: flex; flex-direction: column; gap: 0.7rem; }
.choice-option {
  display: flex; align-items: center; gap: 1rem;
  padding: 1rem 1.2rem;
  background: #fff; border: 2px solid #e0e6ed;
  border-radius: 12px; cursor: pointer;
  font-size: 1.1rem; text-align: left;
  transition: all 0.15s;
}
.choice-option:hover:not(:disabled) { border-color: #4a90e2; background: #f0f7ff; }
.choice-option__letter {
  min-width: 36px; height: 36px;
  display: inline-flex; align-items: center; justify-content: center;
  background: #4a90e2; color: #fff; border-radius: 50%;
  font-weight: bold; font-size: 1rem;
}
.choice-option.correct { border-color: #28a745; background: #d4edda; }
.choice-option.correct .choice-option__letter { background: #28a745; }
.choice-option.wrong { border-color: #dc3545; background: #f8d7da; }
.choice-option.wrong .choice-option__letter { background: #dc3545; }
```

## Step 4: 运行测试验证通过

```bash
npm test -- tests/quiz-choice.test.js
```

Expected: PASS（14+ 个测试，覆盖 next-line/by-author 两种题型、干扰项、判分）

## Step 5: 提交

```bash
git add src/js/quiz/choice.js src/js/ui/quiz.js src/js/data.js src/css/main.css tests/quiz-choice.test.js
git commit -m "feat(quiz): 考核模式-选择题（next-line + by-author）"
```

## 完成标志

```bash
echo done > .tasks/done/16
```

## 关键说明

1. **两种题型合一**：`buildChoiceQuestion(poem, allPoems, mode)` 统一入口，UI 调用时如果不指定 mode 则随机出题（`pickRandomMode()`）。
2. **干扰项严格性**：
   - `next-line`：必须不是当前诗的句子
   - `by-author`：必须不是同一作者的其他作品（避免题目歧义）
3. **小诗库兜底**：当诗库 < 4 首时，干扰项可能不足，函数会从全部诗填充并允许重复（实际 112 首场景不会触发）。
4. **判分简单**：100 或 0，没部分分。选择题在考核配置里通常按"难度系数"加权（由 review.js 处理，本任务不涉及）。
5. **UI 反馈即时**：选完立即标记对错（绿色/红色高亮），800ms 后弹出结果页 — 比填空模式的"提交后才反馈"更轻量。
6. **getAllPoems 依赖**：本任务需要在 `data.js` 暴露 `getAllPoems()`。如果 Task 3 已实现 `Array.from(poems.values())` 直接用即可，无需新增。

## 依赖关系

- **被依赖：** Task 19（复习流程）
- **不依赖：** Task 15/17/18，但共用 `ui/quiz.js` 外壳（Task 15 已建）