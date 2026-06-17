/**
 * 诗云 · 进度管理模块
 */

import { getCurrentUserId, getAllUsers, switchUser, addUser, resetUserProgress, updateUser, getUser } from '../storage.js';

function getCurrentUserState() {
  return getUser(getCurrentUserId()) || {};
}

function getAllPoemsSafe() {
  if (typeof window === 'undefined') return [];
  return window.__SHIYUN_POEMS__ || [];
}

/* ========================= 统计计算（纯函数） ========================= */

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

export function computeLearningCurve(userState, days = 30) {
  const history = userState.quizHistory || [];
  const result = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    result.push({ date: d.toISOString().slice(0, 10), count: 0 });
  }

  const dateMap = new Map(result.map(p => [p.date, p]));
  for (const h of history) {
    const day = (h.at || '').slice(0, 10);
    if (dateMap.has(day)) {
      dateMap.get(day).count++;
    }
  }
  return result;
}

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

function hasAllDynasties(userState, poems) {
  if (poems.length === 0) return false;
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

export const ACHIEVEMENT_DEFS = [
  { id: 'first-poem',      name: '初窥诗门',     desc: '学完第一首诗',         icon: '🌱', check: (s) => Object.values(s.poemProgress || {}).some(p => p.learnCount >= 1) },
  { id: 'first-master',    name: '初窥诗门·掌握', desc: '掌握第一首诗',         icon: '⭐', check: (s) => Object.values(s.poemProgress || {}).some(p => p.status === 'mastered') },
  { id: 'ten-mastered',    name: '小有所成',     desc: '掌握 10 首诗',         icon: '🌟', check: (s) => Object.values(s.poemProgress || {}).filter(p => p.status === 'mastered').length >= 10 },
  { id: 'thirty-mastered', name: '诗词童子',     desc: '掌握 30 首诗',         icon: '🎖️', check: (s) => Object.values(s.poemProgress || {}).filter(p => p.status === 'mastered').length >= 30 },
  { id: 'fifty-mastered',  name: '诗中秀才',     desc: '掌握 50 首诗',         icon: '🏅', check: (s) => Object.values(s.poemProgress || {}).filter(p => p.status === 'mastered').length >= 50 },
  { id: 'hundred-mastered',name: '诗中之圣',    desc: '掌握 100 首诗',        icon: '👑', check: (s) => Object.values(s.poemProgress || {}).filter(p => p.status === 'mastered').length >= 100 },
  { id: 'all-mastered',    name: '诗云之巅',     desc: '掌握全部 112 首诗',    icon: '🏆', check: (s, total) => Object.values(s.poemProgress || {}).filter(p => p.status === 'mastered').length >= total },
  { id: 'ten-quizzes',     name: '勤学不辍',     desc: '完成 10 次考核',       icon: '📝', check: (s) => (s.quizHistory || []).length >= 10 },
  { id: 'hundred-quizzes', name: '考核达人',     desc: '完成 100 次考核',      icon: '🎯', check: (s) => (s.quizHistory || []).length >= 100 },
  { id: 'streak-7',        name: '七日连读',     desc: '连续 7 天有学习记录',  icon: '🔥', check: (s) => hasStreak(s, 7) },
  { id: 'streak-30',       name: '月圆诗成',     desc: '连续 30 天有学习记录', icon: '🌙', check: (s) => hasStreak(s, 30) },
  { id: 'all-dynasty',     name: '博览群朝',     desc: '已学诗覆盖所有朝代',   icon: '📚', check: (s, total, poems) => hasAllDynasties(s, poems) },
];

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

export function renderLearningCurveSvg(curve, { width = 600, height = 200, padding = 30 } = {}) {
  const max = Math.max(1, ...curve.map(p => p.count));
  const stepX = (width - padding * 2) / Math.max(1, curve.length - 1);
  const points = curve.map((p, i) => {
    const x = padding + i * stepX;
    const y = height - padding - (p.count / max) * (height - padding * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  const yTicks = [];
  for (let i = 0; i <= 4; i++) {
    const v = Math.round((max / 4) * i);
    const y = height - padding - (i / 4) * (height - padding * 2);
    yTicks.push(`<line x1="${padding}" y1="${y.toFixed(1)}" x2="${width - padding}" y2="${y.toFixed(1)}" stroke="#eee"/>`);
    yTicks.push(`<text x="${padding - 5}" y="${(y + 4).toFixed(1)}" font-size="10" fill="#999" text-anchor="end">${v}</text>`);
  }

  const xLabels = curve.length > 0
    ? `<text x="${padding}" y="${height - 5}" font-size="10" fill="#999">${curve[0].date.slice(5)}</text>
       <text x="${width - padding}" y="${height - 5}" font-size="10" fill="#999" text-anchor="end">${curve[curve.length - 1].date.slice(5)}</text>`
    : '';

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

export function renderProgressPage(container) {
  const userState = getCurrentUserState();
  const userId = getCurrentUserId();
  const poems = getAllPoemsSafe();

  const stats = computeStats(userState, poems);
  const curve = computeLearningCurve(userState, 30);
  const dist = computeDynastyDist(userState, poems);
  const curveSvg = renderLearningCurveSvg(curve);
  const pieSvg = renderDynastyPieSvg(dist);

  const newlyUnlocked = evaluateAchievements(userState, poems.length, poems);
  if (newlyUnlocked.length > 0) {
    userState.achievements = [...(userState.achievements || []), ...newlyUnlocked];
  }
  const allAchievements = userState.achievements || [];

  const users = getAllUsers();
  const usersList = users.map(u => `
    <li class="user-item ${u.id === userId ? 'active' : ''}" data-user-id="${u.id}">
      <span class="avatar">${escapeHtml(u.avatar || '🌱')}</span>
      <span class="name">${escapeHtml(u.name)}</span>
      <span class="grade">${u.grade} 年级</span>
    </li>
  `).join('');

  container.innerHTML = `
    <div class="progress-page">
      <h2>📊 学习进度</h2>

      <section class="user-bar" id="user-bar">
        <div class="current-user" id="current-user-btn">
          <span class="avatar">${escapeHtml(userState.avatar || '🌱')}</span>
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

  bindProgressEvents(container);
}

function bindProgressEvents(container) {
  const dropdown = container.querySelector('#user-dropdown');
  container.querySelector('#current-user-btn')?.addEventListener('click', () => {
    dropdown.hidden = !dropdown.hidden;
  });

  container.querySelectorAll('.user-item').forEach(item => {
    item.addEventListener('click', () => {
      const uid = item.dataset.userId;
      if (uid && uid !== getCurrentUserId()) {
        switchUser(uid);
        renderProgressPage(container);
      }
    });
  });

  container.querySelector('#btn-add-user')?.addEventListener('click', () => {
    const name = prompt('请输入新用户姓名：');
    if (!name) return;
    const gradeStr = prompt('请输入年级（1-6）：', '1');
    const grade = parseInt(gradeStr, 10);
    if (!grade || grade < 1 || grade > 6) return alert('年级无效');
    const avatar = prompt('请输入 emoji 头像（如 🌸、🐯、📚）：', '🌱') || '🌱';
    const id = addUser({ name, grade, avatar });
    switchUser(id);
    renderProgressPage(container);
  });

  container.querySelector('#btn-reset-progress')?.addEventListener('click', () => {
    if (!confirm('⚠️ 确定要重置当前用户的全部学习进度吗？此操作不可撤销！')) return;
    if (!confirm('请再次确认：所有学习记录将被清除，是否继续？')) return;
    resetUserProgress(getCurrentUserId());
    renderProgressPage(container);
  });

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

  container.querySelector('#input-import-progress')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        const cur = getCurrentUserState();
        if (data.poemProgress) cur.poemProgress = data.poemProgress;
        if (data.quizHistory) cur.quizHistory = data.quizHistory;
        if (data.achievements) cur.achievements = data.achievements;
        alert('导入成功');
        renderProgressPage(container);
      } catch (err) {
        alert('导入失败：JSON 格式错误');
      }
    };
    reader.readAsText(file);
  });

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

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

// 占位函数（保留以兼容 main.js 老引用）
export function renderProgressPlaceholder() {
  const main = document.getElementById('app-main');
  if (main) renderProgressPage(main);
}

export default { renderProgressPage };
