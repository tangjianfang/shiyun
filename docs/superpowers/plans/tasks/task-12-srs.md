# Task 12: SM-2 算法

**依赖：** 3
**并行组：** learning-foundation
**估时：** 1 天

**Files:**
- Create: `src/js/srs.js`
- Create: `tests/srs.test.js`

## Step 1: 写失败的测试

[测试 SM-2 简化版算法：nextReview、getTodayReviewList、shouldMaster 三大函数。]

```javascript
// tests/srs.test.js
import { describe, it, expect } from 'vitest';
import { nextReview, getTodayReviewList, shouldMaster, INITIAL_PROGRESS } from '../src/js/srs.js';

describe('nextReview · 满分 100', () => {
  it('第 1 次满分：interval 应为 1 天，status 转为 learning', () => {
    const result = nextReview(INITIAL_PROGRESS, 100);
    expect(result.status).toBe('learning');
    expect(result.learnCount).toBe(1);
    expect(result.avgScore).toBe(100);
  });

  it('满分应增加 easeFactor', () => {
    const r1 = nextReview(INITIAL_PROGRESS, 100);
    expect(r1.easeFactor).toBeGreaterThan(2.5);
  });

  it('满分应设置 nextReviewAt 为明天', () => {
    const today = new Date('2026-06-16');
    const r = nextReview(INITIAL_PROGRESS, 100, today);
    expect(r.nextReviewAt).toBe('2026-06-17');
  });

  it('满分后 interval 应逐渐变长', () => {
    let p = INITIAL_PROGRESS;
    const intervals = [];
    for (let i = 0; i < 4; i++) {
      p = nextReview(p, 100, new Date(`2026-06-${16 + i}`));
      intervals.push(daysBetween(p.lastLearnedAt, p.nextReviewAt));
    }
    // 后续 interval 应比前一次更大（简化版 ×2.5）
    expect(intervals[3]).toBeGreaterThan(intervals[0]);
  });
});

describe('nextReview · 中等分 70-89', () => {
  it('85 分：interval 应为前一次的 ~1.5 倍', () => {
    // 先连续 2 次满分建立 baseline
    const p1 = nextReview(INITIAL_PROGRESS, 100, new Date('2026-06-16'));
    const p2 = nextReview(p1, 100, new Date('2026-06-17'));
    // 第 3 次 85 分
    const p3 = nextReview(p2, 85, new Date('2026-06-19'));
    // interval 从 1 天（p2 的 lastLearnedAt 6-17 到 nextReviewAt 6-19）变为 p3 的 1.5 倍
    expect(p3.avgScore).toBeGreaterThan(0);
    expect(p3.status).toBe('learning');
  });

  it('70 分：仍应保持 learning 状态', () => {
    const p = nextReview(INITIAL_PROGRESS, 70, new Date('2026-06-16'));
    expect(p.status).toBe('learning');
  });
});

describe('nextReview · 低分 < 70', () => {
  it('60 分：interval 应重置为 1 天', () => {
    const p1 = nextReview(INITIAL_PROGRESS, 100, new Date('2026-06-16'));
    const p2 = nextReview(p1, 100, new Date('2026-06-17')); // interval 2.5 天
    const p3 = nextReview(p2, 60, new Date('2026-06-19'));
    // nextReviewAt 应是明天
    expect(p3.nextReviewAt).toBe('2026-06-20');
  });

  it('30 分：应回退到 learning 状态', () => {
    const p = nextReview(INITIAL_PROGRESS, 30);
    expect(p.status).toBe('learning');
  });

  it('低分应降低 easeFactor', () => {
    const p1 = nextReview(INITIAL_PROGRESS, 100, new Date('2026-06-16'));
    const p2 = nextReview(p1, 100, new Date('2026-06-17'));
    const p3 = nextReview(p2, 50, new Date('2026-06-19'));
    expect(p3.easeFactor).toBeLessThan(p2.easeFactor);
  });

  it('0 分也应正常工作', () => {
    const p = nextReview(INITIAL_PROGRESS, 0);
    expect(p.status).toBe('learning');
    expect(p.easeFactor).toBeGreaterThanOrEqual(1.3); // easeFactor 下限
  });
});

describe('nextReview · 得分边界', () => {
  it('89 分应按中分处理（interval 增长但不到 2.5x）', () => {
    const p = nextReview(INITIAL_PROGRESS, 89, new Date('2026-06-16'));
    // 第二次的中分 interval 是 1.5 天
    const next = new Date(p.nextReviewAt);
    const last = new Date(p.lastLearnedAt);
    const diff = Math.round((next - last) / 86400000);
    expect(diff).toBeGreaterThanOrEqual(1);
  });

  it('90 分应按高分处理（interval 增长到 2.5x）', () => {
    const p1 = nextReview(INITIAL_PROGRESS, 100, new Date('2026-06-16'));
    const p2 = nextReview(p1, 90, new Date('2026-06-17'));
    const next = new Date(p2.nextReviewAt);
    const last = new Date(p2.lastLearnedAt);
    const diff = Math.round((next - last) / 86400000);
    expect(diff).toBeGreaterThan(1); // 至少 2 天以上
  });
});

describe('shouldMaster', () => {
  it('连续 3 次 ≥ 90 应为 mastered', () => {
    const p = { recentScores: [95, 92, 90] };
    expect(shouldMaster(p)).toBe(true);
  });

  it('连续 2 次 ≥ 90 不应 mastered', () => {
    const p = { recentScores: [95, 92] };
    expect(shouldMaster(p)).toBe(false);
  });

  it('中间断了不应 mastered', () => {
    const p = { recentScores: [95, 60, 95, 92] };
    expect(shouldMaster(p)).toBe(false);
  });

  it('少于 3 次不应 mastered', () => {
    expect(shouldMaster({ recentScores: [] })).toBe(false);
    expect(shouldMaster({ recentScores: [100] })).toBe(false);
  });
});

describe('getTodayReviewList', () => {
  it('应返回 nextReviewAt ≤ today 的诗', () => {
    const today = new Date('2026-06-16');
    const userProgress = {
      'g1-01': { nextReviewAt: '2026-06-15' }, // 昨天到期
      'g1-02': { nextReviewAt: '2026-06-16' }, // 今天到期
      'g1-03': { nextReviewAt: '2026-06-20' }, // 未来
    };
    const list = getTodayReviewList(userProgress, today);
    expect(list).toContain('g1-01');
    expect(list).toContain('g1-02');
    expect(list).not.toContain('g1-03');
  });

  it('无 nextReviewAt 的诗不应在列表中', () => {
    const list = getTodayReviewList({ 'g1-01': { status: 'new' } }, new Date());
    expect(list).toEqual([]);
  });

  it('空进度应返回空数组', () => {
    expect(getTodayReviewList({}, new Date())).toEqual([]);
    expect(getTodayReviewList(null, new Date())).toEqual([]);
  });

  it('今天日期格式应正确处理（YYYY-MM-DD 字符串比较）', () => {
    const list = getTodayReviewList(
      { 'g1-01': { nextReviewAt: '2026-06-16' } },
      new Date('2026-06-16T23:59:59')
    );
    expect(list).toContain('g1-01');
  });
});

// 辅助
function daysBetween(a, b) {
  return Math.round((new Date(b) - new Date(a)) / 86400000);
}
```

## Step 2: 运行测试验证失败

```bash
npm test -- tests/srs.test.js
```

Expected: FAIL with "Cannot find module '../src/js/srs.js'"

## Step 3: 实现最小代码

### 3.1 替换 `src/js/srs.js`（完整实现）

```javascript
/**
 * SM-2 间隔重复算法（简化版）
 *
 * 设计文档 3.3 节：
 *   考核得分 ≥ 90  →  interval = interval × 2.5（已掌握）
 *   考核得分 70-89 →  interval = interval × 1.5（待巩固）
 *   考核得分 < 70  →  interval = 1（重置）
 *   连续 3 次 ≥ 90 →  status = 'mastered'
 *
 * 注：标准 SM-2 用 easeFactor 调节（1.3 - 2.5+），本实现是简化版：
 *   - 得分 ≥ 90: ease += 0.1
 *   - 得分 70-89: ease 不变
 *   - 得分 < 70: ease -= 0.2
 *   - interval 按 ease 计算
 */

import { poems as _poems } from './data.js'; // 避免循环引用时可不导入

export const INITIAL_PROGRESS = Object.freeze({
  status: 'new',
  learnCount: 0,
  quizCount: 0,
  avgScore: 0,
  lastLearnedAt: null,
  nextReviewAt: null,
  easeFactor: 2.5,
  interval: 0, // 上次复习间隔（天），首次为 0
  recentScores: [], // 最近 N 次得分，用于判断 mastered
  favorite: false,
  notes: '',
});

const EASE_MIN = 1.3;
const EASE_MAX = 3.0;
const RECENT_SCORES_MAX = 10; // 保留最近 10 次得分

/**
 * 输入当前进度和得分，返回新进度
 * @param {Object} currentProgress - 当前进度
 * @param {number} score - 得分（0-100）
 * @param {Date} [today] - 今天的日期（用于测试注入）
 * @returns {Object} 新进度
 */
export function nextReview(currentProgress, score, today) {
  const today_ = today || new Date();
  const todayStr = formatDate(today_);

  const cur = { ...INITIAL_PROGRESS, ...currentProgress };
  const scoreNum = Math.max(0, Math.min(100, Number(score) || 0));

  // 1. 更新状态字段
  const newProgress = {
    ...cur,
    learnCount: cur.learnCount + 1,
    quizCount: cur.quizCount + 1,
    lastLearnedAt: todayStr,
    // 平均分（加权）
    avgScore: cur.quizCount === 0
      ? scoreNum
      : Math.round((cur.avgScore * cur.quizCount + scoreNum) / (cur.quizCount + 1)),
    // 记录最近得分
    recentScores: [...(cur.recentScores || []), scoreNum].slice(-RECENT_SCORES_MAX),
  };

  // 2. 计算新的 interval 和 easeFactor
  let newInterval;
  let newEase = cur.easeFactor;

  if (scoreNum >= 90) {
    // 高分：interval × 2.5，ease +0.1
    newEase = Math.min(EASE_MAX, newEase + 0.1);
    newInterval = Math.max(1, Math.round(cur.interval * 2.5));
  } else if (scoreNum >= 70) {
    // 中分：interval × 1.5，ease 不变
    newInterval = Math.max(1, Math.round(cur.interval * 1.5));
  } else {
    // 低分：interval 重置为 1，ease -0.2
    newEase = Math.max(EASE_MIN, newEase - 0.2);
    newInterval = 1;
  }

  // 第一次学习时：如果得分 ≥ 70，interval 应是 1（明天复习）；< 70 也是 1（重学）
  if (cur.learnCount === 0) {
    newInterval = scoreNum >= 70 ? 1 : 1;
  }

  newProgress.interval = newInterval;
  newProgress.easeFactor = Math.round(newEase * 100) / 100;

  // 3. 计算 nextReviewAt
  const nextDate = new Date(today_);
  nextDate.setDate(nextDate.getDate() + newInterval);
  newProgress.nextReviewAt = formatDate(nextDate);

  // 4. 更新 status
  // - new → learning（首次学习）
  // - learning → reviewing（3 天内进入稳定复习期）
  // - reviewing → mastered（连续 3 次 ≥ 90）
  // - 任何状态收到 < 70 回到 learning
  if (scoreNum < 70) {
    newProgress.status = 'learning';
  } else if (cur.status === 'new') {
    newProgress.status = 'learning';
  } else if (shouldMaster(newProgress)) {
    newProgress.status = 'mastered';
  } else if (cur.status === 'mastered' && scoreNum < 90) {
    newProgress.status = 'reviewing'; // 退步
  } else if (cur.status === 'reviewing' || newInterval >= 5) {
    newProgress.status = 'reviewing';
  } else {
    newProgress.status = 'learning';
  }

  return newProgress;
}

/**
 * 是否标记为已掌握
 * 条件：最近 3 次得分都 ≥ 90
 * @param {Object} progress
 * @returns {boolean}
 */
export function shouldMaster(progress) {
  if (!progress || !Array.isArray(progress.recentScores)) return false;
  const scores = progress.recentScores;
  if (scores.length < 3) return false;
  const last3 = scores.slice(-3);
  return last3.every(s => s >= 90);
}

/**
 * 获取今日待复习的诗列表
 * @param {Object} userProgress - { [poemId]: progress }
 * @param {Date} [today]
 * @returns {string[]} 诗 ID 列表
 */
export function getTodayReviewList(userProgress, today) {
  if (!userProgress || typeof userProgress !== 'object') return [];
  const todayStr = formatDate(today || new Date());
  return Object.entries(userProgress)
    .filter(([_, p]) => {
      if (!p || !p.nextReviewAt) return false;
      // 字符串比较（YYYY-MM-DD 格式可正确排序）
      return p.nextReviewAt <= todayStr;
    })
    .map(([id]) => id);
}

// ===== 工具 =====

/** 格式化为 YYYY-MM-DD */
export function formatDate(d) {
  if (typeof d === 'string') return d.slice(0, 10);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * 计算平均得分（供 progress 页用）
 * @param {Object[]} quizHistory
 * @returns {number}
 */
export function averageScore(quizHistory) {
  if (!Array.isArray(quizHistory) || quizHistory.length === 0) return 0;
  const sum = quizHistory.reduce((acc, r) => acc + (r.score || 0), 0);
  return Math.round(sum / quizHistory.length);
}

/**
 * 距离今天多少天（用于"X 天后复习"提示）
 * @param {string} dateStr - YYYY-MM-DD
 * @param {Date} [today]
 * @returns {number} 天数（负数=已过期）
 */
export function daysFromToday(dateStr, today) {
  if (!dateStr) return Infinity;
  const today_ = today || new Date();
  const target = new Date(dateStr);
  const diff = target.getTime() - today_.setHours(0, 0, 0, 0);
  return Math.round(diff / 86400000);
}
```

## Step 4: 运行测试验证通过

```bash
npm test -- tests/srs.test.js
```

Expected: PASS (20+ tests)

## Step 5: 提交

```bash
git add src/js/srs.js tests/srs.test.js
git commit -m "feat(srs): SM-2 简化版算法（nextReview/getTodayReviewList/shouldMaster）"
```

## 完成标志

```bash
echo done > .tasks/done/12
```

## 关键说明

- **简化版 SM-2**：标准 SM-2 用 q 值（0-5 质量）调节 easeFactor，本实现按 0-100 分三段处理
- **easeFactor 范围**：[1.3, 3.0]，避免极端值
- **interval 计算**：
  - 首次学习：1 天
  - ≥ 90：× 2.5
  - 70-89：× 1.5
  - < 70：重置 1
- **mastered 判定**：最近 3 次都 ≥ 90（不是历史任意 3 次）
- **状态机**（设计文档 3.4 节）：
  - new → learning（首次学）
  - learning → reviewing（interval ≥ 5 天进入稳定期）
  - reviewing → mastered（连续 3 次 ≥ 90）
  - 任何状态收到 < 70 回到 learning
  - mastered 收到 < 90 退回 reviewing
- **avgScore 算法**：加权平均（按考核次数），不是简单平均
- **reasonsScores 数组**：保留最近 10 次得分，避免内存膨胀
- **nextReviewAt 比较**：用 YYYY-MM-DD 字符串直接比较（字典序 = 时间序），避免时区问题
- **依赖关系**：被 home.js（Task 10）、learn.js（Task 14）、quiz-*.js（Task 15-18）使用
