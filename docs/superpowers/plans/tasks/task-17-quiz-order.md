# Task 17: 考核模式-排序

**依赖：** 10, 12
**并行组：** quiz-modes
**估时：** 1 天

**Files:**
- Create: `src/js/quiz/order.js`
- Create: `tests/quiz-order.test.js`

## 背景

设计文档 4.3 节规定的 4 种考核模式之一 —— **C. 诗句排序**。给一首诗的所有句子，打乱顺序，孩子拖拽（PC）/ 点击（移动）排序。判分：完全正确 100，否则按正确比例（按位正确率，0-100）。

本任务做**判分纯函数 + 题目构建**，UI 由 Task 15 已建的 `ui/quiz.js` 外壳扩展 `renderOrderQuiz`。移动端用点击 + "上移/下移" 按钮，PC 端用 HTML5 拖拽 API。

---

## Step 1: 写失败的测试

```javascript
// tests/quiz-order.test.js
import { describe, it, expect } from 'vitest';
import { buildOrderQuestion, scoreOrder, listWrongOrderLines, shuffleLines, isFullyCorrect } from '../src/js/quiz/order.js';

const POEM = {
  id: 'g1-01',
  title: '静夜思',
  content: ['床前明月光', '疑是地上霜', '举头望明月', '低头思故乡'],
};

describe('shuffleLines', () => {
  it('应打乱数组顺序', () => {
    const original = ['A', 'B', 'C', 'D'];
    const shuffled = shuffleLines([...original]);
    expect(shuffled).toHaveLength(4);
    expect(shuffled.sort()).toEqual(original.sort());
    // 概率上 4 元素打乱至少偶尔会改变顺序（多次跑）
  });

  it('不应修改原数组', () => {
    const arr = ['A', 'B', 'C'];
    const copy = [...arr];
    shuffleLines(arr);
    expect(arr).toEqual(copy);
  });

  it('少于 2 句应返回原样', () => {
    expect(shuffleLines(['only'])).toEqual(['only']);
    expect(shuffleLines([])).toEqual([]);
  });
});

describe('buildOrderQuestion', () => {
  it('应返回打乱后的句序', () => {
    const q = buildOrderQuestion(POEM);
    expect(q.poemId).toBe('g1-01');
    expect(q.originalLines).toEqual(POEM.content);
    expect(q.shuffledLines).toHaveLength(POEM.content.length);
    // shuffledLines 排序后应等于 content
    expect([...q.shuffledLines].sort()).toEqual([...POEM.content].sort());
  });

  it('题目应至少打乱 1 次（极小概率等于原顺序，但测试允许重试）', () => {
    let foundShuffled = false;
    for (let i = 0; i < 50; i++) {
      const q = buildOrderQuestion(POEM);
      if (JSON.stringify(q.shuffledLines) !== JSON.stringify(POEM.content)) {
        foundShuffled = true;
        break;
      }
    }
    expect(foundShuffled).toBe(true);
  });

  it('少于 2 句的诗不能出排序题（应抛错）', () => {
    expect(() => buildOrderQuestion({ id: 'x', title: 't', content: ['only'] })).toThrow();
  });
});

describe('isFullyCorrect', () => {
  it('顺序完全正确时应返回 true', () => {
    expect(isFullyCorrect(POEM, [0, 1, 2, 3])).toBe(true);
  });

  it('顺序错误时应返回 false', () => {
    expect(isFullyCorrect(POEM, [1, 0, 2, 3])).toBe(false);
  });
});

describe('scoreOrder', () => {
  it('完全正确应得 100 分', () => {
    expect(scoreOrder(POEM, [0, 1, 2, 3])).toBe(100);
  });

  it('完全乱序应得 0 分（按位正确率）', () => {
    // [3,2,1,0] 没有任何一位在正确位置
    expect(scoreOrder(POEM, [3, 2, 1, 0])).toBe(0);
  });

  it('部分正确按位正确率（每对 1 位得 25 分）', () => {
    // [0,1,3,2]: 第 0,1 位对，第 2,3 位错 = 50 分
    expect(scoreOrder(POEM, [0, 1, 3, 2])).toBe(50);
  });

  it('部分正确 1/4 应得 25 分', () => {
    // [0,2,1,3]: 仅第 0 位和第 3 位对 = 2/4 = 50
    // [1,0,2,3]: 第 2,3 位对 = 2/4 = 50
    // 想测 1/4：用 [3,2,1,0] -> 0，但 [0,2,3,1] -> 0,1,3,2(错) -> 第 0 位对 = 25
    expect(scoreOrder(POEM, [0, 2, 3, 1])).toBe(25);
  });

  it('空顺序应得 0 分', () => {
    expect(scoreOrder(POEM, [])).toBe(0);
  });

  it('长度不匹配应得 0 分', () => {
    expect(scoreOrder(POEM, [0, 1, 2])).toBe(0);
  });

  it('4 句诗都换位时应得 0 分', () => {
    expect(scoreOrder(POEM, [2, 3, 0, 1])).toBe(0);
  });
});

describe('listWrongOrderLines', () => {
  it('应列出位置错误的行（用于错题回顾）', () => {
    // [0, 1, 3, 2]: 第 2 行 (idx=2) 错，应该在 idx=3；第 3 行 (idx=3) 错，应该在 idx=2
    const wrongs = listWrongOrderLines(POEM, [0, 1, 3, 2]);
    expect(wrongs).toHaveLength(2);
    expect(wrongs[0].userPosition).toBe(2); // 用户把"举头望明月"放在 idx=2
    expect(wrongs[0].correctPosition).toBe(3);
    expect(wrongs[1].userPosition).toBe(3);
    expect(wrongs[1].correctPosition).toBe(2);
  });

  it('完全正确时应返回空数组', () => {
    expect(listWrongOrderLines(POEM, [0, 1, 2, 3])).toEqual([]);
  });
});
```

## Step 2: 运行测试验证失败

```bash
npm test -- tests/quiz-order.test.js
```

Expected: FAIL with "Cannot find module '../src/js/quiz/order.js'"

## Step 3: 实现最小代码

### 3.1 创建 `src/js/quiz/order.js`（纯函数判分 + 题目构建）

```javascript
/**
 * 考核模式 C：诗句排序
 *
 * 给一首诗的所有句子打乱，孩子拖拽/点击排序。
 *
 * 判分：
 * - 完全正确: 100
 * - 按位正确率: correctPositions / total * 100, 取整
 *
 * 纯函数：所有函数无副作用，方便单测
 */

/**
 * 打乱数组（Fisher-Yates，不修改原数组）
 * @template T
 * @param {T[]} arr
 * @returns {T[]} 新数组
 */
export function shuffleLines(arr) {
  const copy = [...arr];
  if (copy.length < 2) return copy;
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * 构建排序题
 * @param {Object} poem
 * @returns {{
 *   poemId: string,
 *   title: string,
 *   originalLines: string[],
 *   shuffledLines: string[],
 * }}
 */
export function buildOrderQuestion(poem) {
  if (!poem.content || poem.content.length < 2) {
    throw new Error('诗少于 2 句，不能出排序题');
  }
  return {
    poemId: poem.id,
    title: poem.title,
    originalLines: [...poem.content],
    shuffledLines: shuffleLines(poem.content),
  };
}

/**
 * 判分：按位正确率
 * @param {Object} poem
 * @param {number[]} userOrder - 用户排序后每句的下标数组，例如 [2,0,1,3] 表示第 0 位放原句 idx=2
 * @returns {number} 0-100
 */
export function scoreOrder(poem, userOrder) {
  const total = poem.content.length;
  if (!Array.isArray(userOrder) || userOrder.length !== total) return 0;
  let correct = 0;
  for (let i = 0; i < total; i++) {
    if (userOrder[i] === i) correct++;
  }
  return Math.round((correct / total) * 100);
}

/**
 * 是否完全正确（用于 UI 高亮"完美！"）
 * @param {Object} poem
 * @param {number[]} userOrder
 * @returns {boolean}
 */
export function isFullyCorrect(poem, userOrder) {
  return scoreOrder(poem, userOrder) === 100;
}

/**
 * 列出位置错误的行（用于错题回顾）
 * @param {Object} poem
 * @param {number[]} userOrder
 * @returns {Array<{userPosition:number, correctPosition:number, line:string}>}
 */
export function listWrongOrderLines(poem, userOrder) {
  const total = poem.content.length;
  if (!Array.isArray(userOrder) || userOrder.length !== total) {
    return poem.content.map((line, idx) => ({
      userPosition: -1,
      correctPosition: idx,
      line,
    }));
  }
  const wrongs = [];
  for (let i = 0; i < total; i++) {
    if (userOrder[i] !== i) {
      wrongs.push({
        userPosition: i,
        correctPosition: userOrder[i],
        line: poem.content[userOrder[i]],
      });
    }
  }
  return wrongs;
}
```

### 3.2 扩展 `src/js/ui/quiz.js`（追加排序 UI）

在已有 `src/js/ui/quiz.js` 顶部 import 区追加：

```javascript
import { buildOrderQuestion, scoreOrder, listWrongOrderLines } from '../quiz/order.js';
```

在 `startQuiz` 函数的 `switch (mode)` 块中，把 `'order'` 的占位替换为：

```javascript
    case 'order':
      renderOrderQuiz(main, poem, opts);
      break;
```

在文件末尾追加新函数：

```javascript
/**
 * 渲染排序题 UI
 * - PC 端：HTML5 拖拽 API（draggable=true + dragstart/dragover/drop）
 * - 移动端：每行有"上移/下移"按钮 + 长按拖拽（用 touchstart/touchmove 简化）
 */
function renderOrderQuiz(container, poem, opts) {
  const question = buildOrderQuestion(poem);
  // userOrder: 用户当前顺序（每行在原数组中的索引）
  let userOrder = question.shuffledLines.map((line, i) => {
    return question.originalLines.indexOf(line);
  });

  // 防御：万一 shuffledLines 顺序与原数组完全一致（极小概率），则强制打乱一次
  if (userOrder.every((v, i) => v === i)) {
    [userOrder[0], userOrder[1]] = [userOrder[1], userOrder[0]];
  }

  function render() {
    const itemsHtml = userOrder.map((origIdx, currentIdx) => {
      const line = question.originalLines[origIdx];
      return `
        <li class="order-item" draggable="true" data-idx="${currentIdx}">
          <span class="order-item__handle" aria-label="拖动">≡</span>
          <span class="order-item__text">${line}</span>
          <div class="order-item__mobile-controls">
            <button class="order-item__btn" data-action="up" data-idx="${currentIdx}" aria-label="上移">▲</button>
            <button class="order-item__btn" data-action="down" data-idx="${currentIdx}" aria-label="下移">▼</button>
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
    bindDragEvents();
    bindButtonEvents();
  }

  let dragSrcIdx = null;

  function bindDragEvents() {
    const items = container.querySelectorAll('.order-item');
    items.forEach(item => {
      item.addEventListener('dragstart', e => {
        dragSrcIdx = parseInt(item.dataset.idx, 10);
        item.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
      });
      item.addEventListener('dragend', () => {
        item.classList.remove('dragging');
        container.querySelectorAll('.order-item').forEach(i => i.classList.remove('drag-over'));
      });
      item.addEventListener('dragover', e => {
        e.preventDefault();
        item.classList.add('drag-over');
      });
      item.addEventListener('dragleave', () => {
        item.classList.remove('drag-over');
      });
      item.addEventListener('drop', e => {
        e.preventDefault();
        item.classList.remove('drag-over');
        const targetIdx = parseInt(item.dataset.idx, 10);
        if (dragSrcIdx === null || dragSrcIdx === targetIdx) return;
        // 重排 userOrder
        const [moved] = userOrder.splice(dragSrcIdx, 1);
        userOrder.splice(targetIdx, 0, moved);
        render();
      });
    });
  }

  function bindButtonEvents() {
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
      const wrongs = listWrongOrderLines(poem, userOrder);
      showOrderResult(container, poem, score, wrongs, opts);
    });
    container.querySelector('[data-action="exit"]').addEventListener('click', () => {
      if (confirm('确定退出考核？')) {
        if (opts.onExit) opts.onExit();
      }
    });
  }

  render();
}

function showOrderResult(container, poem, score, wrongs, opts) {
  const isPerfect = wrongs.length === 0;
  const wrongsHtml = !isPerfect ? `
    <div class="quiz__review">
      <h3>错位回顾</h3>
      <p class="quiz__correct-order">正确顺序：</p>
      <ol class="quiz__correct-list">
        ${poem.content.map(line => `<li>${line}</li>`).join('')}
      </ol>
    </div>
  ` : '';

  container.innerHTML = `
    <div class="quiz quiz-result">
      <h2 class="quiz__score">${score} 分</h2>
      <p class="quiz__result-msg">${isPerfect ? '🎉 完美排序！' : '继续努力！'}</p>
      ${wrongsHtml}
      <div class="quiz__actions">
        <button class="btn" data-action="retry">再来一次</button>
        <button class="btn btn--primary" data-action="exit">完成</button>
      </div>
    </div>
  `;
  container.querySelector('[data-action="retry"]').addEventListener('click', () => {
    renderOrderQuiz(container, poem, opts);
  });
  container.querySelector('[data-action="exit"]').addEventListener('click', () => {
    if (opts.onComplete) opts.onComplete(score, { mode: 'order', wrongs });
    else if (opts.onExit) opts.onExit();
  });
}
```

### 3.3 在 `src/css/main.css` 追加排序样式

```css
/* ===== 考核 - 排序 ===== */
.quiz__hint { color: #7f8c8d; font-size: 0.9rem; }
.order-list { list-style: none; padding: 0; margin: 1rem 0; }
.order-item {
  display: flex; align-items: center; gap: 0.8rem;
  padding: 1rem 1.2rem; margin-bottom: 0.6rem;
  background: #fff; border: 2px solid #e0e6ed; border-radius: 12px;
  cursor: grab; user-select: none;
  transition: all 0.15s;
  font-size: 1.1rem;
}
.order-item:hover { border-color: #4a90e2; }
.order-item.dragging { opacity: 0.4; cursor: grabbing; }
.order-item.drag-over { border-top: 4px solid #4a90e2; }
.order-item__handle { color: #7f8c8d; font-size: 1.4rem; cursor: grab; }
.order-item__text { flex: 1; font-family: "STKaiti", "KaiTi", serif; }
.order-item__mobile-controls { display: none; gap: 4px; }
.order-item__btn {
  min-width: 36px; min-height: 36px;
  border: 1px solid #e0e6ed; background: #f5f7fa;
  border-radius: 6px; cursor: pointer; font-size: 1rem;
}
.order-item__btn:hover { background: #4a90e2; color: #fff; }

@media (max-width: 640px) {
  .order-item__mobile-controls { display: flex; }
  .order-item__handle { display: none; } /* 移动端隐藏拖拽手柄 */
}

.quiz__correct-order { margin-top: 0.5rem; font-weight: bold; }
.quiz__correct-list { padding-left: 1.5rem; }
.quiz__correct-list li { margin-bottom: 0.3rem; font-family: "STKaiti", "KaiTi", serif; }
```

## Step 4: 运行测试验证通过

```bash
npm test -- tests/quiz-order.test.js
```

Expected: PASS（15+ 个测试，覆盖 shuffle、buildQuestion、scoreOrder、isFullyCorrect、listWrongOrderLines）

## Step 5: 提交

```bash
git add src/js/quiz/order.js src/js/ui/quiz.js src/css/main.css tests/quiz-order.test.js
git commit -m "feat(quiz): 考核模式-排序（拖拽 + 移动端上移下移）"
```

## 完成标志

```bash
echo done > .tasks/done/17
```

## 关键说明

1. **userOrder 的语义**：是"原句索引数组"，例如 `[2, 0, 1, 3]` 表示用户排序后第 0 位放的是 `originalLines[2]`。这比存"句子字符串"更稳定（避免相同句子的歧义）。
2. **防御性打乱**：`buildOrderQuestion` 抽到原顺序时（极小概率），`renderOrderQuiz` 里再强制交换前两个 — 保证用户看到的是打乱后的。
3. **按位判分**：每句在正确位置得 25%（4 句诗），鼓励"先把对的固定、再调整"。比"调换次数"更适合孩子。
4. **PC + 移动端双适配**：
   - PC：HTML5 拖拽（`draggable + dragstart/dragover/drop`）
   - 移动端：每行显示"上移/下移"按钮（`@media (max-width: 640px)` 控制可见性）
   - 也可后续接入 `touchstart/touchmove` 实现长按拖拽（本任务不做）
5. **错题回顾**：直接显示完整正确顺序（4 句按 1-2-3-4 列出），比列出错的位更直观。
6. **少于 2 句的诗不能出排序题**：`buildOrderQuestion` 抛错，UI 层应在 review.js 调用时过滤掉。

## 依赖关系

- **被依赖：** Task 19（复习流程）
- **不依赖：** Task 15/16/18，但共用 `ui/quiz.js` 外壳