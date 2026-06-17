import { describe, it, expect } from 'vitest';
import { nextReview, getTodayReviewList, shouldMaster, INITIAL_PROGRESS, formatDate, averageScore, daysFromToday } from '../src/js/srs.js';

describe('nextReview · 满分 100', () => {
  it('第 1 次满分：status 应转为 learning', () => {
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
    expect(intervals[3]).toBeGreaterThan(intervals[0]);
  });
});

describe('nextReview · 中等分 70-89', () => {
  it('85 分：avgScore 与 status 应合理', () => {
    const p1 = nextReview(INITIAL_PROGRESS, 100, new Date('2026-06-16'));
    const p2 = nextReview(p1, 100, new Date('2026-06-17'));
    const p3 = nextReview(p2, 85, new Date('2026-06-19'));
    expect(p3.avgScore).toBeGreaterThan(0);
    // interval 从 3 增长到 ~5，应进入 reviewing
    expect(['learning', 'reviewing']).toContain(p3.status);
  });

  it('70 分：仍应保持 learning 状态', () => {
    const p = nextReview(INITIAL_PROGRESS, 70, new Date('2026-06-16'));
    expect(p.status).toBe('learning');
  });
});

describe('nextReview · 低分 < 70', () => {
  it('60 分：interval 应重置为 1 天', () => {
    const p1 = nextReview(INITIAL_PROGRESS, 100, new Date('2026-06-16'));
    const p2 = nextReview(p1, 100, new Date('2026-06-17'));
    const p3 = nextReview(p2, 60, new Date('2026-06-19'));
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
    expect(p.easeFactor).toBeGreaterThanOrEqual(1.3);
  });
});

describe('nextReview · 得分边界', () => {
  it('89 分应按中分处理（interval 增长但不到 2.5x）', () => {
    const p = nextReview(INITIAL_PROGRESS, 89, new Date('2026-06-16'));
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
    expect(diff).toBeGreaterThan(1);
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
      'g1-01': { nextReviewAt: '2026-06-15' },
      'g1-02': { nextReviewAt: '2026-06-16' },
      'g1-03': { nextReviewAt: '2026-06-20' },
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

describe('formatDate', () => {
  it('应输出 YYYY-MM-DD', () => {
    expect(formatDate(new Date('2026-06-16'))).toBe('2026-06-16');
  });
  it('输入字符串应只取前 10 字符', () => {
    expect(formatDate('2026-06-16T12:00:00')).toBe('2026-06-16');
  });
});

describe('averageScore', () => {
  it('空数组返回 0', () => {
    expect(averageScore([])).toBe(0);
  });
  it('正确计算平均', () => {
    expect(averageScore([{ score: 80 }, { score: 90 }])).toBe(85);
  });
});

describe('daysFromToday', () => {
  it('今天返回 0', () => {
    expect(daysFromToday(formatDate(new Date()), new Date())).toBe(0);
  });
  it('明天返回 1', () => {
    const today = new Date('2026-06-16');
    expect(daysFromToday('2026-06-17', today)).toBe(1);
  });
  it('昨天返回 -1', () => {
    const today = new Date('2026-06-16');
    expect(daysFromToday('2026-06-15', today)).toBe(-1);
  });
  it('null 返回 Infinity', () => {
    expect(daysFromToday(null, new Date())).toBe(Infinity);
  });
});

function daysBetween(a, b) {
  return Math.round((new Date(b) - new Date(a)) / 86400000);
}
