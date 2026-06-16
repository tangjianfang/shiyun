# Task 20: 进度管理

**依赖：** Task 11, Task 12
**并行组：** parallel-visualization（与 Task 21/22 并行，互不依赖）
**估时：** 1 天

**Files:**
- Create: `src/js/ui/progress.js`
- Modify: `src/css/main.css`（追加进度管理样式块）
- Create: `tests/progress.test.js`

## Step 1: 写失败的测试

测试纯函数 `computeStats`：给定 localStorage 状态，输出统计数据（已学/已掌握/待复习/总数/曲线/朝代分布/解锁成就）。

```javascript
// tests/progress.test.js
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
    expect(stats.learned).toBe(3); // mastered + learning + reviewing
  });

  it('应计算待复习数量（nextReviewAt ≤ 今天）', () => {
    const today = new Date().toISOString().slice(0, 10);
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
    // 总数 = 3
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
    // 找到 2026-06-15 那一天
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
        'g2-01': { status: 'new' }, // 不计入已学
      },
    };
    const poems = [
      { id: 'g1-01', dynasty: '唐' },
      { id: 'g1-02', dynasty: '唐' },
      { id: 'g2-01', dynasty: '宋' },
    ];
    const dist = computeDynastyDist(userState, poems);
    expect(dist).toEqual([{ dynasty: '唐', count: 2 }, { dynasty: '宋', count: 0 }]);
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
});
```

## Step 2: 运行测试验证失败

```bash
npm test -- tests/progress.test.js
```

Expected: FAIL with "Cannot find module" 或 "computeStats is not defined"

## Step 3: 实现进度模块

创建 `src/js/ui/progress.js`：

```javascript
/**
 * 诗云 · 进度管理模块
 *
 * 负责：
 * - 统计概览（已学/已掌握/待复习/总数）
 * - 学习曲线（最近 30 天）
 * - 朝代分布
 * - 成就徽章解锁
 * - 渲染进度页（纯 SVG 图表，无外部库）
 *
 * 数据来源：localStorage 中当前用户的 poemProgress + quizHistory
 */

import { getCurrentUserState, getCurrentUserId, getAllUsers, switchUser, addUser, resetUserProgress, deleteUser, updateUser } from '../storage.js';
import { loadPoemMeta, getAllDynasties } from '../data.js';

/* ========================= 统计计算（纯函数） ========================= */

/**
 * @typedef {Object} Stats
 * @property {number} total
 * @property {number} learned
 * @property {number} mastered
 * @property {number} dueForReview
 * @property {number} learning
 */

/**
 * 计算统计概览
 * @param {Object} userState - 用户状态
 * @param {Array} poems - 全部诗（用于确定总数）
 * @returns {Stats}
 */
export function computeStats(userState, poems) {
  const progress = userState.poemProgress || {};
  const today = new Date().toISOString().slice(0, 10);
  const stats = { total: poems.length, learned: 0, mastered: 0, dueForReview: 0, learning: 0 };
  for (const poem of poems) {
    const p = progress[poem.id];
    if (!p) continue;
    if (p.status === 'mastered') stats.mastered++;
    if (p.status === 'learning' || p.status === 'reviewing' || p.status === 'mastered') stats.learned++;
    if (p.status === 'learning') stats.learning++;
    if (p.status !== 'mastered' && p.nextReviewAt && p.nextReviewAt <= today) {
      stats.dueForReview++;
    }
  }
  return stats;
}

/**
 * 计算最近 N 天学习曲线
 * @param {Object} userState
 * @param {number} days
 * @returns {Array<{date: string, count: number}>}
 */
export function computeLearningCurve(userState, days = 30) {
  const history = userState.quizHistory || [];
  const result = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 初始化 N 天
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    result.push({ date: d.toISOString().slice(0, 10), count: 0 });
  }

  // 聚合
  const dateMap = new Map(result.map(p => [p.date, p]));
  for (const h of history) {
    const day = (h.at || '').slice(0, 10);
    if (dateMap.has(day)) {
      dateMap.get(day).count++;
    }
  }
  return result;
}

/**
 * 计算朝代分布
 * @param {Object} userState
 * @param {Array} poems
 * @returns {Array<{dynasty: string, count: number}>}
 */
export function computeDynastyDist(userState, poems) {
  const progress = userState.poemProgress || {};
  const dynastySet = new Set(poems.map(p => p.dynasty));
  const dist = new Map();
  for (const d of dynastySet) dist.set(d, 0);
  for (const poem of poems) {
    const p = progress[poem.id];
    if (p && (p.status === 'learning' || p.status === 'reviewing' || p.status === 'mastered')) {
      dist.set(poem.dynasty, (dist.get(poem.dynasty) || 0) + 1);
    }
  }
  return Array.from(dist.entries())
    .map(([dynasty, count]) => ({ dynasty, count }))
    .sort((a, b) => b.count - a.count);
}

/* ========================= 成就系统 ========================= */

/**
 * 成就定义
 * 每个成就：id、name、desc、icon (emoji)、check(state, total) -> bool
 */
export const ACHIEVEMENT_DEFS = [
  { id: 'first-poem',     name: '初窥诗门',     desc: '学完第一首诗',         icon: '🌱', check: (s) => Object.values(s.poemProgress || {}).some(p => p.learnCount >= 1) },
  { id: 'first-master',   name: '初窥诗门·掌握', desc: '掌握第一首诗',         icon: '⭐', check: (s) => Object.values(s.poemProgress || {}).some(p => p.status === 'mastered') },
  { id: 'ten-mastered',   name: '小有所成',     desc: '掌握 10 首诗',         icon: '🌟', check: (s) => Object.values(s.poemProgress || {}).filter(p => p.status === 'mastered').length >= 10 },
  { id: 'thirty-mastered',name: '诗词童子',     desc: '掌握 30 首诗',         icon: '🎖️', check: (s) => Object.values(s.poemProgress || {}).filter(p => p.status === 'mastered').length >= 30 },
  { id: 'fifty-mastered', name: '诗中秀才',     desc: '掌握 50 首诗',         icon: '🏅', check: (s) => Object.values(s.poemProgress || {}).filter(p => p.status === 'mastered').length >= 50 },
  { id: 'hundred-mastered',name: '诗中之圣',    desc: '掌握 100 首诗',        icon: '👑', check: (s) => Object.values(s.poemProgress || {}).filter(p => p.status === 'mastered').length >= 100 },
  { id: 'all-mastered',   name: '诗云之巅',     desc: '掌握全部 112 首诗',    icon: '🏆', check: (s, total) => Object.values(s.poemProgress || {}).filter(p => p.status === 'mastered').length >= total },
  { id: 'ten-quizzes',    name: '勤学不辍',     desc: '完成 10 次考核',       icon: '📝', check: (s) => (s.quizHistory || []).length >= 10 },
  { id: 'hundred-quizzes',name: '考核达人',     desc: '完成 100 次考核',      icon: '🎯', check: (s) => (s.quizHistory || []).length >= 100 },
  { id: 'streak-7',       name: '七日连读',     desc: '连续 7 天有学习记录',  icon: '🔥', check: (s) => hasStreak(s, 7) },
  { id: 'streak-30',      name: '月圆诗成',     desc: '连续 30 天有学习记录', icon: '🌙', check: (s) => hasStreak(s, 30) },
  { id: 'all-dynasty',    name: '博览群朝',     desc: '已学诗覆盖所有朝代',   icon: '📚', check: (s, total, poems) => hasAllDynasties(s, poems) },
];

/**
 * 检查连续 N 天有学习记录
 */
function hasStreak(userState, days) {
  const history = userState.quizHistory || [];
  if (history.length === 0) return false;
  const daySet = new Set(history.map(h => (h.at || '').slice(0, 10)));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (!daySet.has(d.toISOString().slice(0, 10))) return false;
  }
  return true;
}

/**
 * 检查是否覆盖所有朝代
 */
function hasAllDynasties(userState, poems) {
  const all = new Set(poems.map(p => p.dynasty));
  const learned = new Set();
  const progress = userState.poemProgress || {};
  for (const p of poems) {
    const prog = progress[p.id];
    if (prog && (prog.status === 'learning' || prog.status === 'reviewing' || prog.status === 'mastered')) {
      learned.add(p.dynasty);
    }
  }
  for (const d of all) if (!learned.has(d)) return false;
  return true;
}

/**
 * 评估并返回新解锁的成就 ID 列表
 * @param {Object} userState
 * @param {number} total
 * @param {Array} [poems]
 * @returns {string[]}
 */
export function evaluateAchievements(userState, total, poems = []) {
  const already = new Set(userState.achievements || []);
  const newlyUnlocked = [];
  for (const def of ACHIEVEMENT_DEFS) {
    if (already.has(def.id)) continue;
    if (def.check(userState, total, poems)) newlyUnlocked.push(def.id);
  }
  return newlyUnlocked;
}

/* ========================= SVG 图表渲染 ========================= */

/**
 * 渲染学习曲线为 SVG 字符串
 * @param {Array<{date, count}>} curve
 * @param {Object} options
 * @returns {string} SVG 元素
 */
export function renderLearningCurveSvg(curve, { width = 600, height = 200, padding = 30 } = {}) {
  const max = Math.max(1, ...curve.map(p => p.count));
  const stepX = (width - padding * 2) / Math.max(1, curve.length - 1);
  const points = curve.map((p, i) => {
    const x = padding + i * stepX;
    const y = height - padding - (p.count / max) * (height - padding * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  // Y 轴刻度
  const yTicks = [];
  for (let i = 0; i <= 4; i++) {
    const v = Math.round((max / 4) * i);
    const y = height - padding - (i / 4) * (height - padding * 2);
    yTicks.push(`<line x1="${padding}" y1="${y.toFixed(1)}" x2="${width - padding}" y2="${y.toFixed(1)}" stroke="#eee"/>`);
    yTicks.push(`<text x="${padding - 5}" y="${(y + 4).toFixed(1)}" font-size="10" fill="#999" text-anchor="end">${v}</text>`);
  }

  // X 轴：首末日期
  const xLabels = curve.length > 0
    ? `<text x="${padding}" y="${height - 5}" font-size="10" fill="#999">${curve[0].date.slice(5)}</text>
       <text x="${width - padding}" y="${height - 5}" font-size="10" fill="#999" text-anchor="end">${curve[curve.length - 1].date.slice(5)}</text>`
    : '';

  // 数据点
  const dots = curve.map((p, i) => {
    if (p.count === 0) return '';
    const x = padding + i * stepX;
    const y = height - padding - (p.count / max) * (height - padding * 2);
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3" fill="#4a90e2"><title>${p.date}: ${p.count} 次</title></circle>`;
  }).join('');

  return `<svg viewBox="0 0 ${width} ${height}" class="learning-curve" xmlns="http://www.w3.org/2000/svg">
    ${yTicks.join('')}
    <polyline points="${points}" fill="none" stroke="#4a90e2" stroke-width="2"/>
    ${dots}
    ${xLabels}
  </svg>`;
}

/**
 * 渲染朝代分布饼图为 SVG
 * @param {Array<{dynasty, count}>} dist
 * @param {Object} options
 * @returns {string}
 */
export function renderDynastyPieSvg(dist, { size = 220 } = {}) {
  const total = dist.reduce((s, p) => s + p.count, 0);
  if (total === 0) {
    return `<svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 10}" fill="#f5f7fa" stroke="#ccc"/>
      <text x="${size/2}" y="${size/2}" text-anchor="middle" font-size="14" fill="#999">暂无数据</text>
    </svg>`;
  }
  const cx = size / 2, cy = size / 2, r = size / 2 - 10;
  const colors = ['#4a90e2', '#28a745', '#dc3545', '#ffc107', '#9c27b0', '#00bcd4', '#ff9800', '#795548'];
  let startAngle = -Math.PI / 2;
  let paths = '';
  let legend = '';

  dist.forEach((p, i) => {
    if (p.count === 0) return;
    const angle = (p.count / total) * Math.PI * 2;
    const endAngle = startAngle + angle;
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const largeArc = angle > Math.PI ? 1 : 0;
    const color = colors[i % colors.length];
    paths += `<path d="M ${cx} ${cy} L ${x1.toFixed(1)} ${y1.toFixed(1)} A ${r} ${r} 0 ${largeArc} 1 ${x2.toFixed(1)} ${y2.toFixed(1)} Z" fill="${color}"/>`;
    legend += `<rect x="0" y="${i * 18}" width="12" height="12" fill="${color}"/>
               <text x="18" y="${i * 18 + 10}" font-size="12" fill="#333">${p.dynasty}（${p.count}）</text>`;
    startAngle = endAngle;
  });

  return `<svg viewBox="0 0 ${size + 100} ${size}" xmlns="http://www.w3.org/2000/svg" class="dynasty-pie">
    ${paths}
    <g transform="translate(${size + 10} 10)">${legend}</g>
  </svg>`;
}

/* ========================= 进度页 UI 渲染 ========================= */

/**
 * 渲染进度管理页
 * @param {HTMLElement} container
 */
export function renderProgressPage(container) {
  loadPoemMeta(); // 确保 poems 加载
  const userState = getCurrentUserState();
  const userId = getCurrentUserId();
  const poems = window.__SHIYUN_POEMS__ || [];

  const stats = computeStats(userState, poems);
  const curve = computeLearningCurve(userState, 30);
  const dist = computeDynastyDist(userState, poems);
  const curveSvg = renderLearningCurveSvg(curve);
  const pieSvg = renderDynastyPieSvg(dist);

  // 解锁成就
  const newlyUnlocked = evaluateAchievements(userState, poems.length, poems);
  if (newlyUnlocked.length > 0) {
    userState.achievements = [...(userState.achievements || []), ...newlyUnlocked];
  }
  const allAchievements = userState.achievements || [];

  // 个人设置
  const users = getAllUsers();
  const usersList = users.map(u => `
    <li class="user-item ${u.id === userId ? 'active' : ''}" data-user-id="${u.id}">
      <span class="avatar">${u.avatar}</span>
      <span class="name">${escapeHtml(u.name)}</span>
      <span class="grade">${u.grade} 年级</span>
    </li>
  `).join('');

  container.innerHTML = `
    <div class="progress-page">
      <h2>📊 学习进度</h2>

      <section class="user-bar" id="user-bar">
        <div class="current-user" id="current-user-btn">
          <span class="avatar">${userState.avatar || '🌱'}</span>
          <span class="name">${escapeHtml(userState.name || '未命名')}</span>
          <span class="grade">${userState.grade || '-'} 年级</span>
          <span class="caret">▾</span>
        </div>
        <div class="user-dropdown" id="user-dropdown" hidden>
          <ul class="users-list">${usersList}</ul>
          <div class="user-actions">
            <button class="btn btn-sm" id="btn-add-user">+ 新建用户</button>
            <button class="btn btn-sm btn-danger" id="btn-reset-progress">重置进度</button>
            <button class="btn btn-sm" id="btn-export-progress">导出进度</button>
            <label class="btn btn-sm">
              导入进度
              <input type="file" id="input-import-progress" accept=".json" hidden>
            </label>
          </div>
        </div>
      </section>

      <section class="stats-cards">
        <div class="card stat-card">
          <div class="stat-num">${stats.total}</div>
          <div class="stat-label">总数</div>
        </div>
        <div class="card stat-card">
          <div class="stat-num">${stats.learned}</div>
          <div class="stat-label">已学</div>
        </div>
        <div class="card stat-card">
          <div class="stat-num" style="color:#28a745">${stats.mastered}</div>
          <div class="stat-label">已掌握</div>
        </div>
        <div class="card stat-card">
          <div class="stat-num" style="color:#dc3545">${stats.dueForReview}</div>
          <div class="stat-label">待复习</div>
        </div>
      </section>

      <section class="chart-section card">
        <h3>学习曲线（最近 30 天）</h3>
        ${curveSvg}
      </section>

      <section class="chart-section card">
        <h3>朝代分布</h3>
        ${pieSvg}
      </section>

      <section class="achievements-section card">
        <h3>🏆 成就徽章</h3>
        <div class="achievements-grid">
          ${ACHIEVEMENT_DEFS.map(def => {
            const unlocked = allAchievements.includes(def.id);
            return `<div class="achievement ${unlocked ? 'unlocked' : 'locked'}" title="${escapeHtml(def.desc)}">
              <div class="ach-icon">${def.icon}</div>
              <div class="ach-name">${escapeHtml(def.name)}</div>
              <div class="ach-desc">${escapeHtml(def.desc)}</div>
            </div>`;
          }).join('')}
        </div>
      </section>

      <section class="user-mgmt card" id="user-mgmt-section">
        <h3>⚙️ 个人设置</h3>
        <div class="form-row">
          <label>姓名 <input type="text" id="input-user-name" value="${escapeHtml(userState.name || '')}"></label>
          <label>头像（emoji）<input type="text" id="input-user-avatar" value="${escapeHtml(userState.avatar || '')}" maxlength="2"></label>
          <label>年级
            <select id="input-user-grade">
              ${[1,2,3,4,5,6].map(g => `<option value="${g}" ${g === userState.grade ? 'selected' : ''}>${g} 年级</option>`).join('')}
            </select>
          </label>
          <button class="btn btn-primary" id="btn-save-user">保存</button>
        </div>
      </section>
    </div>
  `;

  // 事件绑定
  bindProgressEvents(container);
}

/**
 * 绑定进度页事件
 */
function bindProgressEvents(container) {
  const dropdown = container.querySelector('#user-dropdown');
  container.querySelector('#current-user-btn')?.addEventListener('click', () => {
    dropdown.hidden = !dropdown.hidden;
  });

  // 切换用户
  container.querySelectorAll('.user-item').forEach(item => {
    item.addEventListener('click', () => {
      const uid = item.dataset.userId;
      if (uid && uid !== getCurrentUserId()) {
        switchUser(uid);
        renderProgressPage(container);
      }
    });
  });

  // 新建用户
  container.querySelector('#btn-add-user')?.addEventListener('click', () => {
    const name = prompt('请输入新用户姓名：');
    if (!name) return;
    const grade = parseInt(prompt('请输入年级（1-6）：', '1'), 10);
    if (!grade || grade < 1 || grade > 6) return alert('年级无效');
    const avatar = prompt('请输入 emoji 头像（如 🌸、🐯、📚）：', '🌱') || '🌱';
    const id = addUser({ name, grade, avatar });
    switchUser(id);
    renderProgressPage(container);
  });

  // 重置进度
  container.querySelector('#btn-reset-progress')?.addEventListener('click', () => {
    if (!confirm('⚠️ 确定要重置当前用户的全部学习进度吗？\n此操作不可撤销！')) return;
    if (!confirm('请再次确认：所有学习记录将被清除，是否继续？')) return;
    resetUserProgress(getCurrentUserId());
    renderProgressPage(container);
  });

  // 导出进度
  container.querySelector('#btn-export-progress')?.addEventListener('click', () => {
    const data = JSON.stringify(getCurrentUserState(), null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `诗云-进度-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  // 导入进度
  container.querySelector('#input-import-progress')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        // 简单合并：覆盖 poemProgress / quizHistory / achievements
        const cur = getCurrentUserState();
        cur.poemProgress = data.poemProgress || {};
        cur.quizHistory = data.quizHistory || [];
        cur.achievements = data.achievements || [];
        alert('导入成功');
        renderProgressPage(container);
      } catch (err) {
        alert('导入失败：JSON 格式错误');
      }
    };
    reader.readAsText(file);
  });

  // 保存个人信息
  container.querySelector('#btn-save-user')?.addEventListener('click', () => {
    const name = container.querySelector('#input-user-name').value.trim();
    const avatar = container.querySelector('#input-user-avatar').value.trim() || '🌱';
    const grade = parseInt(container.querySelector('#input-user-grade').value, 10);
    if (!name) return alert('姓名不能为空');
    updateUser(getCurrentUserId(), { name, avatar, grade });
    alert('已保存');
    renderProgressPage(container);
  });
}

/**
 * HTML 转义辅助
 */
function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

// 导出供路由调用
export default { renderProgressPage };
```

## Step 4: 在 main.css 末尾追加进度页样式

修改 `src/css/main.css`，在文件末尾追加：

```css
/* ===== 进度管理页 ===== */
.progress-page { padding: 1rem; max-width: 960px; margin: 0 auto; }
.progress-page h2 { color: #2c3e50; margin-bottom: 1rem; }

.user-bar { position: relative; margin-bottom: 1rem; }
.current-user {
  display: inline-flex; align-items: center; gap: 0.5rem;
  padding: 0.5rem 1rem; background: #fff; border: 1px solid #e0e6ed;
  border-radius: 24px; cursor: pointer; user-select: none;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}
.current-user:hover { box-shadow: 0 2px 6px rgba(0,0,0,0.1); }
.current-user .avatar { font-size: 1.5rem; }
.current-user .caret { color: #999; margin-left: 0.25rem; }

.user-dropdown {
  position: absolute; top: 100%; left: 0; margin-top: 0.5rem;
  background: #fff; border: 1px solid #e0e6ed; border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1); padding: 0.75rem;
  min-width: 280px; z-index: 100;
}
.users-list { list-style: none; margin: 0 0 0.5rem 0; padding: 0; }
.user-item {
  display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem;
  border-radius: 4px; cursor: pointer;
}
.user-item:hover { background: #f5f7fa; }
.user-item.active { background: #e8f1fb; color: #4a90e2; font-weight: 600; }
.user-item .avatar { font-size: 1.2rem; }
.user-item .name { flex: 1; }
.user-item .grade { color: #999; font-size: 0.85rem; }
.user-actions { display: flex; flex-wrap: wrap; gap: 0.5rem; border-top: 1px solid #eee; padding-top: 0.5rem; }
.btn-sm { padding: 0.25rem 0.6rem; font-size: 0.85rem; }

.stats-cards {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem;
  margin-bottom: 1.5rem;
}
.stat-card { text-align: center; padding: 1.5rem 1rem; }
.stat-num { font-size: 2.5rem; font-weight: 700; color: #4a90e2; line-height: 1; }
.stat-label { color: #7f8c8d; margin-top: 0.5rem; font-size: 0.95rem; }

.chart-section { padding: 1rem; margin-bottom: 1rem; }
.chart-section h3 { margin: 0 0 0.75rem 0; color: #2c3e50; }
.learning-curve, .dynasty-pie { width: 100%; max-width: 100%; height: auto; }

.achievements-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  gap: 0.75rem;
}
.achievement {
  text-align: center; padding: 0.75rem 0.5rem; border: 1px solid #e0e6ed;
  border-radius: 8px; background: #f9fafb; transition: all 0.2s;
}
.achievement.unlocked { background: #fff8e1; border-color: #ffc107; }
.achievement.locked { opacity: 0.4; filter: grayscale(1); }
.ach-icon { font-size: 2rem; }
.ach-name { font-size: 0.9rem; font-weight: 600; margin: 0.25rem 0; }
.ach-desc { font-size: 0.75rem; color: #7f8c8d; }

.user-mgmt .form-row {
  display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: flex-end;
}
.user-mgmt .form-row label { display: flex; flex-direction: column; font-size: 0.85rem; color: #555; }
.user-mgmt .form-row input, .user-mgmt .form-row select {
  padding: 0.4rem; border: 1px solid #e0e6ed; border-radius: 4px; font-size: 0.95rem;
}

@media (max-width: 600px) {
  .stats-cards { grid-template-columns: repeat(2, 1fr); }
  .achievements-grid { grid-template-columns: repeat(auto-fill, minmax(90px, 1fr)); }
}
```

## Step 5: 运行测试验证通过

```bash
npm test -- tests/progress.test.js
```

Expected: PASS（computeStats / computeLearningCurve / computeDynastyDist / evaluateAchievements 全部通过）

## Step 6: 手动验证

1. 启动学习版（开发态或构建后）
2. 打开「进度」tab
3. 验证：4 张数字卡片显示正确；曲线图至少有一根线；饼图按朝代染色
4. 点头像 → 切换/新建/重置/导出/导入 → 行为符合预期
5. 至少 1 个成就解锁（学完 1 首诗后）

## Step 7: 提交

```bash
git add src/js/ui/progress.js src/css/main.css tests/progress.test.js
git commit -m "feat(progress): 进度管理页（统计/曲线/饼图/成就/用户切换）"
```

## 完成标志

```bash
echo done > .tasks/done/20
```

## 关键说明

- **纯 SVG 图表**：不引入 Chart.js 等依赖；`renderLearningCurveSvg` / `renderDynastyPieSvg` 为纯字符串拼接
- **成就系统**：12 个成就，存储在 `ACHIEVEMENT_DEFS`，evaluateAchievements 返回新解锁的 ID（不重复解锁）
- **用户切换/新建**：复用 storage.js 中 switchUser / addUser / resetUserProgress
- **数据隔离**：所有读写都通过 `getCurrentUserId()` 确定当前用户，不会污染其他用户
- **导出/导入**：JSON 格式，含 poemProgress / quizHistory / achievements
- **响应式**：stats-cards 在窄屏变为 2 列
