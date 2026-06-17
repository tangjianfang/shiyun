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

export const INITIAL_PROGRESS = Object.freeze({
  status: 'new',
  learnCount: 0,
  quizCount: 0,
  avgScore: 0,
  lastLearnedAt: null,
  nextReviewAt: null,
  easeFactor: 2.5,
  interval: 0,
  recentScores: [],
  favorite: false,
  notes: '',
});

const EASE_MIN = 1.3;
const EASE_MAX = 3.0;
const RECENT_SCORES_MAX = 10;

/**
 * 输入当前进度和得分，返回新进度
 */
export function nextReview(currentProgress, score, today) {
  const today_ = today || new Date();
  const todayStr = formatDate(today_);

  const cur = { ...INITIAL_PROGRESS, ...currentProgress };
  const scoreNum = Math.max(0, Math.min(100, Number(score) || 0));

  const newProgress = {
    ...cur,
    learnCount: cur.learnCount + 1,
    quizCount: cur.quizCount + 1,
    lastLearnedAt: todayStr,
    avgScore: cur.quizCount === 0
      ? scoreNum
      : Math.round((cur.avgScore * cur.quizCount + scoreNum) / (cur.quizCount + 1)),
    recentScores: [...(cur.recentScores || []), scoreNum].slice(-RECENT_SCORES_MAX),
  };

  let newInterval;
  let newEase = cur.easeFactor;

  if (scoreNum >= 90) {
    newEase = Math.min(EASE_MAX, newEase + 0.1);
    newInterval = Math.max(1, Math.round(cur.interval * 2.5));
  } else if (scoreNum >= 70) {
    newInterval = Math.max(1, Math.round(cur.interval * 1.5));
  } else {
    newEase = Math.max(EASE_MIN, newEase - 0.2);
    newInterval = 1;
  }

  if (cur.learnCount === 0) {
    newInterval = 1;
  }

  newProgress.interval = newInterval;
  newProgress.easeFactor = Math.round(newEase * 100) / 100;

  const nextDate = new Date(today_);
  nextDate.setDate(nextDate.getDate() + newInterval);
  newProgress.nextReviewAt = formatDate(nextDate);

  if (scoreNum < 70) {
    newProgress.status = 'learning';
  } else if (cur.status === 'new') {
    newProgress.status = 'learning';
  } else if (shouldMaster(newProgress)) {
    newProgress.status = 'mastered';
  } else if (cur.status === 'mastered' && scoreNum < 90) {
    newProgress.status = 'reviewing';
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
 */
export function getTodayReviewList(userProgress, today) {
  if (!userProgress || typeof userProgress !== 'object') return [];
  const todayStr = formatDate(today || new Date());
  return Object.entries(userProgress)
    .filter(([_, p]) => {
      if (!p || !p.nextReviewAt) return false;
      return p.nextReviewAt <= todayStr;
    })
    .map(([id]) => id);
}

/** 格式化为 YYYY-MM-DD */
export function formatDate(d) {
  if (typeof d === 'string') return d.slice(0, 10);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * 计算平均得分
 */
export function averageScore(quizHistory) {
  if (!Array.isArray(quizHistory) || quizHistory.length === 0) return 0;
  const sum = quizHistory.reduce((acc, r) => acc + (r.score || 0), 0);
  return Math.round(sum / quizHistory.length);
}

/**
 * 距离今天多少天
 */
export function daysFromToday(dateStr, today) {
  if (!dateStr) return Infinity;
  const today_ = today || new Date();
  const target = new Date(dateStr);
  const diff = target.getTime() - today_.setHours(0, 0, 0, 0);
  return Math.round(diff / 86400000);
}
