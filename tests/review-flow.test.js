import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  buildReviewSession,
  pickQuizMode,
  processReviewResult,
  summarizeReview,
  getDuePoemsForReview,
} from '../src/js/ui/review.js';

vi.mock('../src/js/srs.js', () => ({
  getTodayReviewList: vi.fn(),
  nextReview: vi.fn(),
  INITIAL_PROGRESS: { status: 'new', learnCount: 0, easeFactor: 2.5, interval: 0, recentScores: [] },
}));

vi.mock('../src/js/data.js', () => ({
  getPoem: vi.fn(id => ({
    id, title: `诗${id}`, author: '测试作者',
    content: ['一二三', '四五六'],
    keySentences: [{ line: 0, chars: ['一','二','三'], blanks: [1] }],
    audio: 'data:audio/x',
  })),
  getAllPoems: vi.fn(() => []),
  loadPoemMeta: vi.fn(),
}));

vi.mock('../src/js/storage.js', () => ({
  getCurrentUserId: vi.fn(() => 'xiaoming'),
  getPoemProgress: vi.fn(() => ({ status: 'learning', learnCount: 1, easeFactor: 2.5, interval: 0, recentScores: [80] })),
  updatePoemProgress: vi.fn(),
  addQuizHistory: vi.fn(),
}));

import { getTodayReviewList as mockGetTodayReviewList, nextReview as mockNextReview } from '../src/js/srs.js';

const POEM_IDS = ['g1-01', 'g1-02', 'g1-03'];

beforeEach(() => {
  vi.clearAllMocks();
});

describe('buildReviewSession', () => {
  it('应返回今日待复习的诗列表', () => {
    mockGetTodayReviewList.mockReturnValue(POEM_IDS);
    const session = buildReviewSession();
    expect(session.poems).toHaveLength(3);
    expect(session.poems[0].id).toBe('g1-01');
  });

  it('应支持配置模式（默认填空）', () => {
    mockGetTodayReviewList.mockReturnValue(POEM_IDS);
    const session = buildReviewSession({ mode: 'choice' });
    expect(session.config.mode).toBe('choice');
  });

  it('应支持配置范围（年级筛选）', () => {
    mockGetTodayReviewList.mockReturnValue(POEM_IDS);
    const session = buildReviewSession({ grades: [1] });
    expect(session.config.grades).toEqual([1]);
  });

  it('应支持配置数量限制', () => {
    mockGetTodayReviewList.mockReturnValue(POEM_IDS);
    const session = buildReviewSession({ limit: 2 });
    expect(session.poems).toHaveLength(2);
  });

  it('无待复习诗时应返回空 session', () => {
    mockGetTodayReviewList.mockReturnValue([]);
    const session = buildReviewSession();
    expect(session.poems).toEqual([]);
  });
});

describe('pickQuizMode', () => {
  it('默认应返回填空', () => {
    expect(pickQuizMode({})).toBe('fill');
  });

  it('指定单一模式时应返回该模式', () => {
    expect(pickQuizMode({ mode: 'order' })).toBe('order');
  });

  it('混合模式应随机选一种', () => {
    const validModes = ['fill', 'choice', 'order', 'listen'];
    for (let i = 0; i < 20; i++) {
      const m = pickQuizMode({ mode: 'mixed' });
      expect(validModes).toContain(m);
    }
  });

  it('应排除不可用的模式（无音频不能 listen，无 keySentences 不能 fill/order）', () => {
    const poem = { id: 'x', title: 't', content: ['ab'] };
    expect(pickQuizMode({ mode: 'mixed' }, poem)).toBe('choice');
  });
});

describe('processReviewResult', () => {
  beforeEach(() => {
    mockNextReview.mockReturnValue({
      status: 'reviewing', interval: 5, nextReviewAt: '2026-06-21', easeFactor: 2.6,
    });
  });

  it('应调用 srs.nextReview 更新进度', () => {
    const session = { poems: [{ id: 'g1-01' }], currentIdx: 0, results: [] };
    processReviewResult(session, 'g1-01', { mode: 'fill', score: 90 });
    expect(mockNextReview).toHaveBeenCalled();
  });

  it('应记录本首考核结果', () => {
    const session = { poems: [{ id: 'g1-01' }], currentIdx: 0, results: [] };
    processReviewResult(session, 'g1-01', { mode: 'fill', score: 90 });
    expect(session.results).toHaveLength(1);
    expect(session.results[0]).toMatchObject({
      poemId: 'g1-01',
      score: 90,
      mode: 'fill',
    });
  });

  it('应推进 currentIdx', () => {
    const session = { poems: [{ id: 'g1-01' }, { id: 'g1-02' }], currentIdx: 0, results: [] };
    processReviewResult(session, 'g1-01', { mode: 'fill', score: 90 });
    expect(session.currentIdx).toBe(1);
  });
});

describe('summarizeReview', () => {
  it('应统计掌握数（≥90分）', () => {
    const session = {
      results: [
        { poemId: 'p1', score: 95 },
        { poemId: 'p2', score: 85 },
        { poemId: 'p3', score: 100 },
        { poemId: 'p4', score: 60 },
      ],
    };
    const summary = summarizeReview(session);
    expect(summary.mastered).toBe(2);
    expect(summary.needReview).toBe(2);
    expect(summary.total).toBe(4);
    expect(summary.avgScore).toBe(85);
  });

  it('空 session 应返回零值', () => {
    const summary = summarizeReview({ results: [] });
    expect(summary.mastered).toBe(0);
    expect(summary.needReview).toBe(0);
    expect(summary.total).toBe(0);
    expect(summary.avgScore).toBe(0);
  });

  it('待巩固数应包括 70-89 分段的诗', () => {
    const session = {
      results: [
        { poemId: 'p1', score: 70 },
        { poemId: 'p2', score: 89 },
      ],
    };
    const summary = summarizeReview(session);
    expect(summary.needReview).toBe(2);
    expect(summary.mastered).toBe(0);
  });
});

describe('getDuePoemsForReview', () => {
  it('应返回诗 ID 列表', () => {
    mockGetTodayReviewList.mockReturnValue(['g1-01']);
    const result = getDuePoemsForReview();
    expect(mockGetTodayReviewList).toHaveBeenCalled();
    expect(result).toEqual(['g1-01']);
  });
});
