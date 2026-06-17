import { describe, it, expect, beforeEach } from 'vitest';
import { computeStats, computeLearningCurve, computeDynastyDist, evaluateAchievements, ACHIEVEMENT_DEFS } from '../src/js/ui/progress.js';

describe('computeStats', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('空数据时全部为 0', () => {
    const stats = computeStats({}, []);
    expect(stats).toEqual({
      total: 0,
      learned: 0,
      mastered: 0,
      dueForReview: 0,
      learning: 0,
    });
  });

  it('应正确统计各状态数量', () => {
    const userState = {
      poemProgress: {
        'g1-01': { status: 'mastered', learnCount: 5 },
        'g1-02': { status: 'learning', learnCount: 2 },
        'g1-03': { status: 'reviewing', learnCount: 3, nextReviewAt: '2099-01-01' },
        'g1-04': { status: 'new' },
      },
    };
    const stats = computeStats(userState, [
      { id: 'g1-01' }, { id: 'g1-02' }, { id: 'g1-03' }, { id: 'g1-04' },
    ]);
    expect(stats.total).toBe(4);
    expect(stats.mastered).toBe(1);
    expect(stats.learning).toBe(1);
    expect(stats.learned).toBe(3);
  });

  it('应计算待复习数量（nextReviewAt ≤ 今天）', () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const userState = {
      poemProgress: {
        'g1-01': { status: 'reviewing', nextReviewAt: yesterday },
        'g1-02': { status: 'reviewing', nextReviewAt: '2099-01-01' },
      },
    };
    const stats = computeStats(userState, [{ id: 'g1-01' }, { id: 'g1-02' }]);
    expect(stats.dueForReview).toBe(1);
  });
});

describe('computeLearningCurve', () => {
  it('应返回最近 30 天每天学习数', () => {
    const userState = {
      quizHistory: [
        { at: '2026-06-15T10:00:00Z' },
        { at: '2026-06-15T11:00:00Z' },
        { at: '2026-06-10T10:00:00Z' },
      ],
    };
    const curve = computeLearningCurve(userState, 30);
    expect(curve).toHaveLength(30);
    const total = curve.reduce((s, p) => s + p.count, 0);
    expect(total).toBe(3);
  });

  it('应按 yyyy-mm-dd 聚合', () => {
    const userState = {
      quizHistory: [
        { at: '2026-06-15T08:00:00Z' },
        { at: '2026-06-15T20:00:00Z' },
      ],
    };
    const curve = computeLearningCurve(userState, 30);
    const point = curve.find(p => p.date === '2026-06-15');
    expect(point.count).toBe(2);
  });
});

describe('computeDynastyDist', () => {
  it('应按朝代聚合已学数', () => {
    const userState = {
      poemProgress: {
        'g1-01': { status: 'mastered' },
        'g1-02': { status: 'learning' },
        'g2-01': { status: 'new' },
      },
    };
    const poems = [
      { id: 'g1-01', dynasty: '唐' },
      { id: 'g1-02', dynasty: '唐' },
      { id: 'g2-01', dynasty: '宋' },
    ];
    const dist = computeDynastyDist(userState, poems);
    const tangIdx = dist.findIndex(d => d.dynasty === '唐');
    const songIdx = dist.findIndex(d => d.dynasty === '宋');
    expect(dist[tangIdx].count).toBe(2);
    expect(dist[songIdx].count).toBe(0);
  });
});

describe('evaluateAchievements', () => {
  it('first-poem: 学完第一首诗解锁', () => {
    const userState = {
      poemProgress: { 'g1-01': { status: 'learning', learnCount: 1 } },
      achievements: [],
    };
    const unlocked = evaluateAchievements(userState, 112);
    expect(unlocked).toContain('first-poem');
  });

  it('ten-mastered: 掌握 10 首诗解锁', () => {
    const progress = {};
    for (let i = 0; i < 10; i++) {
      progress[`g1-${String(i).padStart(2, '0')}`] = { status: 'mastered' };
    }
    const userState = { poemProgress: progress, achievements: [] };
    const unlocked = evaluateAchievements(userState, 112);
    expect(unlocked).toContain('ten-mastered');
  });

  it('hundred-quizzes: 完成 100 次考核解锁', () => {
    const history = Array.from({ length: 100 }, (_, i) => ({ at: '2026-06-15' }));
    const userState = { poemProgress: {}, quizHistory: history, achievements: [] };
    const unlocked = evaluateAchievements(userState, 112);
    expect(unlocked).toContain('hundred-quizzes');
  });

  it('应至少定义 10 个成就', () => {
    expect(ACHIEVEMENT_DEFS.length).toBeGreaterThanOrEqual(10);
  });

  it('已解锁的不应重复返回', () => {
    const userState = {
      poemProgress: { 'g1-01': { status: 'learning', learnCount: 1 } },
      achievements: ['first-poem'],
    };
    const unlocked = evaluateAchievements(userState, 112);
    expect(unlocked).not.toContain('first-poem');
  });
});
