# Task 18: 考核模式-听诗选诗

**依赖：** 10, 12
**并行组：** quiz-modes
**估时：** 1 天

**Files:**
- Create: `src/js/quiz/listen.js`
- Create: `tests/quiz-listen.test.js`

## 背景

设计文档 4.3 节规定的 4 种考核模式之一 —— **D. 听诗选诗**。播放诗的 AI 朗读，4 首诗名选项（1 正确 + 3 干扰）。干扰项：从同年级的其他诗里抽。判分：答对 100，错 0。

本任务做**判分纯函数 + 题目构建**，音频播放由 `audio.js`（项目已有）封装。UI 由 Task 15 已建的 `ui/quiz.js` 外壳扩展 `renderListenQuiz`。

---

## Step 1: 写失败的测试

```javascript
// tests/quiz-listen.test.js
import { describe, it, expect } from 'vitest';
import { buildListenQuestion, scoreListen } from '../src/js/quiz/listen.js';

const POEMS = [
  { id: 'g1-01', title: '静夜思', author: '李白', grade: 1, audio: 'data:audio/mp3;base64,aaa' },
  { id: 'g1-02', title: '春晓', author: '孟浩然', grade: 1, audio: 'data:audio/mp3;base64,bbb' },
  { id: 'g1-03', title: '登鹳雀楼', author: '王之涣', grade: 1, audio: 'data:audio/mp3;base64,ccc' },
  { id: 'g1-04', title: '寻隐者不遇', author: '贾岛', grade: 1, audio: 'data:audio/mp3;base64,ddd' },
  { id: 'g2-01', title: '望庐山瀑布', author: '李白', grade: 2, audio: 'data:audio/mp3;base64,eee' },
  { id: 'g2-02', title: '绝句', author: '杜甫', grade: 2, audio: 'data:audio/mp3;base64,fff' },
];

describe('buildListenQuestion', () => {
  it('应返回 4 个诗名选项', () => {
    const q = buildListenQuestion(POEMS[0], POEMS);
    expect(q.options).toHaveLength(4);
    expect(q.options).toContain('静夜思'); // 正确答案
  });

  it('正确答案应是当前诗', () => {
    const q = buildListenQuestion(POEMS[0], POEMS);
    expect(q.correctAnswer).toBe('静夜思');
    expect(q.correctIndex).toBeGreaterThanOrEqual(0);
    expect(q.correctIndex).toBeLessThan(4);
    expect(q.options[q.correctIndex]).toBe('静夜思');
  });

  it('应包含音频 URL', () => {
    const q = buildListenQuestion(POEMS[0], POEMS);
    expect(q.audio).toBe('data:audio/mp3;base64,aaa');
  });

  it('干扰项应来自同年级的其他诗', () => {
    const q = buildListenQuestion(POEMS[0], POEMS); // g1-01 静夜思
    const distractors = q.options.filter(o => o !== q.correctAnswer);
    for (const d of distractors) {
      const foundPoem = POEMS.find(p => p.title === d);
      expect(foundPoem).toBeDefined();
      expect(foundPoem.grade).toBe(1); // 同年级
      expect(foundPoem.id).not.toBe('g1-01'); // 不是当前诗
    }
  });

  it('同级干扰项不足时应跨年级补足', () => {
    // 一年级只有 4 首 (g1-01 到 g1-04)，干扰项应包括 3 首其他一年级诗
    // 再加一首别的诗
    const q = buildListenQuestion(POEMS[3], POEMS); // g1-04 寻隐者不遇
    const distractors = q.options.filter(o => o !== q.correctAnswer);
    // 一年级其他诗：g1-01, g1-02, g1-03 都是同年级干扰项
    expect(distractors).toContain('静夜思');
    expect(distractors).toContain('春晓');
    expect(distractors).toContain('登鹳雀楼');
  });

  it('诗库太小（<4首）时应也能构造（允许重复兜底）', () => {
    const smallPool = [POEMS[0], POEMS[1]];
    const q = buildListenQuestion(POEMS[0], smallPool);
    expect(q.options.length).toBe(4);
  });

  it('没有音频的诗不能出听诗选诗题（应抛错）', () => {
    const noAudio = { id: 'x', title: '无名诗', grade: 1, audio: '' };
    expect(() => buildListenQuestion(noAudio, POEMS)).toThrow();
  });
});

describe('scoreListen', () => {
  it('答对应得 100 分', () => {
    expect(scoreListen(true)).toBe(100);
  });

  it('答错应得 0 分', () => {
    expect(scoreListen(false)).toBe(0);
  });
});
```

## Step 2: 运行测试验证失败

```bash
npm test -- tests/quiz-listen.test.js
```

Expected: FAIL with "Cannot find module '../src/js/quiz/listen.js'"

## Step 3: 实现最小代码

### 3.1 创建 `src/js/quiz/listen.js`（纯函数判分 + 题目构建）

```javascript
/**
 * 考核模式 D：听诗选诗
 *
 * 播放诗的 AI 朗读，4 首诗名选项（1 正确 + 3 干扰）
 * 干扰项：从同年级的其他诗里抽，不足时跨年级补
 *
 * 判分：答对 100，错 0
 *
 * 纯函数：所有函数无副作用，方便单测
 */

/**
 * 打乱数组（Fisher-Yates）
 * @template T
 * @param {T[]} arr
 * @returns {T[]}
 */
function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * 判分：答对 100，错 0
 * @param {boolean} isCorrect
 * @returns {number}
 */
export function scoreListen(isCorrect) {
  return isCorrect ? 100 : 0;
}

/**
 * 构建听诗选诗题
 * @param {Object} poem 当前诗
 * @param {Object[]} allPoems 全部诗
 * @returns {{
 *   poemId: string,
 *   audio: string,
 *   title: string, // 当前诗标题（答案揭晓后显示）
 *   author: string,
 *   options: string[],     // 4 个诗名
 *   correctAnswer: string,
 *   correctIndex: number,
 * }}
 */
export function buildListenQuestion(poem, allPoems) {
  if (!poem.audio) {
    throw new Error(`诗 ${poem.id} 没有音频，无法出听诗选诗题`);
  }

  const correctAnswer = poem.title;

  // 优先抽同年级其他诗
  let distractorPool = allPoems
    .filter(p => p.id !== poem.id && p.grade === poem.grade)
    .map(p => p.title);

  // 不足 3 个时，跨年级补
  if (distractorPool.length < 3) {
    const others = allPoems
      .filter(p => p.id !== poem.id && p.grade !== poem.grade)
      .map(p => p.title);
    distractorPool = [...distractorPool, ...others];
  }

  // 去重 + 打乱 + 取 3
  let distractors = shuffle([...new Set(distractorPool)]).slice(0, 3);

  // 干扰项仍不足（诗库太小）：从全部诗里硬塞
  if (distractors.length < 3) {
    const allTitles = allPoems.map(p => p.title).filter(t => t !== correctAnswer);
    const moreDistractors = shuffle(allTitles).filter(t => !distractors.includes(t));
    distractors = [...distractors, ...moreDistractors].slice(0, 3);
  }

  // 极端兜底
  while (distractors.length < 3) {
    distractors.push(correctAnswer);
  }

  const options = shuffle([correctAnswer, ...distractors]);
  const correctIndex = options.indexOf(correctAnswer);

  return {
    poemId: poem.id,
    audio: poem.audio,
    title: poem.title,
    author: poem.author,
    options,
    correctAnswer,
    correctIndex,
  };
}
```

### 3.2 扩展 `src/js/ui/quiz.js`（追加听诗选诗 UI）

在已有 `src/js/ui/quiz.js` 顶部 import 区追加：

```javascript
import { buildListenQuestion, scoreListen } from '../quiz/listen.js';
```

在 `startQuiz` 函数的 `switch (mode)` 块中，把 `'listen'` 的占位替换为：

```javascript
    case 'listen':
      renderListenQuiz(main, poem, opts);
      break;
```

在文件末尾追加新函数：

```javascript
/**
 * 渲染听诗选诗 UI
 * - 顶部：一个大"播放"按钮 + 进度条
 * - 中部：4 个诗名选项按钮
 * - 自动播放一次（可重播）
 */
function renderListenQuiz(container, poem, opts) {
  import('../data.js').then(({ getAllPoems }) => {
    const allPoems = getAllPoems();
    const question = buildListenQuestion(poem, allPoems);

    // 使用项目 audio.js 播放
    import('../audio.js').then(({ playAudio }) => {
      let audioPlayed = false;
      const optionsHtml = question.options.map((opt, i) => `
        <button class="choice-option" data-idx="${i}">
          <span class="choice-option__letter">${String.fromCharCode(65 + i)}</span>
          <span class="choice-option__text">${opt}</span>
        </button>
      `).join('');

      container.innerHTML = `
        <div class="quiz quiz-listen">
          <header class="quiz__header">
            <h2 class="quiz__title">听诗选诗</h2>
            <button class="quiz__exit" data-action="exit">← 返回</button>
          </header>
          <div class="quiz__body">
            <div class="listen-player">
              <button class="listen-player__btn" data-action="play" aria-label="播放">▶</button>
              <p class="listen-player__hint">${audioPlayed ? '点击重播' : '点击播放'}</p>
            </div>
            <p class="quiz__prompt">你听到的是哪首诗？</p>
            <div class="choice-options">${optionsHtml}</div>
          </div>
        </div>
      `;

      const playBtn = container.querySelector('[data-action="play"]');
      playBtn.addEventListener('click', () => {
        playAudio(question.audio);
        audioPlayed = true;
        playBtn.textContent = '⏸';
        container.querySelector('.listen-player__hint').textContent = '点击重播';
      });

      // 自动播放一次
      setTimeout(() => {
        try {
          playAudio(question.audio);
          audioPlayed = true;
        } catch (e) {
          console.warn('自动播放失败（需要用户交互）:', e);
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
          setTimeout(() => showListenResult(container, poem, question, isCorrect, opts), 800);
        });
      });

      container.querySelector('[data-action="exit"]').addEventListener('click', () => {
        if (confirm('确定退出考核？')) {
          if (opts.onExit) opts.onExit();
        }
      });
    });
  });
}

function showListenResult(container, poem, question, isCorrect, opts) {
  const score = scoreListen(isCorrect);
  container.innerHTML = `
    <div class="quiz quiz-result">
      <h2 class="quiz__score">${score} 分</h2>
      <p class="quiz__result-msg">${isCorrect ? '🎉 答对了！' : '❌ 答错了'}</p>
      <div class="quiz__review">
        <p>正确答案是：<span class="quiz__correct">${question.title}</span></p>
        <p>作者：${question.author}</p>
      </div>
      <div class="quiz__actions">
        <button class="btn btn--primary" data-action="next">继续</button>
      </div>
    </div>
  `;
  container.querySelector('[data-action="next"]').addEventListener('click', () => {
    if (opts.onComplete) opts.onComplete(score, { mode: 'listen', isCorrect, poemId: poem.id });
    else if (opts.onExit) opts.onExit();
  });
}
```

### 3.3 在 `src/css/main.css` 追加听诗选诗样式

```css
/* ===== 考核 - 听诗选诗 ===== */
.listen-player {
  display: flex; flex-direction: column; align-items: center;
  padding: 2rem 1rem; margin: 1rem 0;
  background: linear-gradient(135deg, #f0f7ff 0%, #e8f4ff 100%);
  border-radius: 16px;
}
.listen-player__btn {
  width: 80px; height: 80px;
  background: #4a90e2; color: #fff;
  border: none; border-radius: 50%;
  font-size: 2rem; cursor: pointer;
  box-shadow: 0 4px 12px rgba(74, 144, 226, 0.3);
  transition: transform 0.15s;
}
.listen-player__btn:hover { transform: scale(1.05); }
.listen-player__btn:active { transform: scale(0.95); }
.listen-player__hint { margin-top: 0.8rem; color: #7f8c8d; font-size: 0.9rem; }
```

## Step 4: 运行测试验证通过

```bash
npm test -- tests/quiz-listen.test.js
```

Expected: PASS（10+ 个测试，覆盖 buildListenQuestion、scoreListen、同年级/跨年级/小诗库兜底）

## Step 5: 提交

```bash
git add src/js/quiz/listen.js src/js/ui/quiz.js src/css/main.css tests/quiz-listen.test.js
git commit -m "feat(quiz): 考核模式-听诗选诗（AI 朗读 + 4 选 1）"
```

## 完成标志

```bash
echo done > .tasks/done/18
```

## 关键说明

1. **音频来自 `audio.js`**：项目已有 `audio.js`（计划 Task 8 实现），本任务 UI 通过 `import('../audio.js').then(({ playAudio }) => ...)` 调用。本地测试可用 mock data URL。
2. **自动播放限制**：浏览器策略要求用户首次交互后才能自动播放音频，因此 `renderListenQuiz` 在 `setTimeout` 里尝试自动播放一次，失败也无妨（用户可点 ▶ 按钮重播）。
3. **干扰项来源优先级**：同年级其他诗 → 跨年级其他诗 → 任何诗（兜底）。这种顺序保证了题目难度一致（同年级的诗孩子都学过）。
4. **判分 100/0**：听诗选诗要么全对要么全错，没有"部分对"的概念。
5. **音频为空时**：buildListenQuestion 抛错，UI 层（review.js）应在配置考核模式时排除没有音频的诗（`isPoemComplete(poem)` 判断）。
6. **复用选择样式**：选项按钮复用 Task 16 的 `.choice-option` 样式，无需新加。

## 依赖关系

- **被依赖：** Task 19（复习流程）
- **依赖：** Task 8（音频生成）— 已实现，但本任务的 mock 音频也能跑测试