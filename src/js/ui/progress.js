/**
 * 诗云 · 进度管理模块
 */

import { getCurrentUserId, getAllUsers, switchUser, addUser, resetUserProgress, updateUser, getUser } from '../storage.js';
import { statCard, esc } from './components.js';

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

export function renderProgressPage(container = document.getElementById('app-main')) {
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

  container.innerHTML = `
    <div class="content-wrap fade-in">
      <header class="page-head">
        <h1 class="page-head__title">📊 我的进度</h1>
      </header>

      <!-- 用户卡 -->
      <div class="progress-user-card card" style="margin-bottom:var(--s-5);">
        <div class="progress-user-avatar">${esc(userState.avatar || (userState.name || '用')[0])}</div>
        <div>
          <div style="font-family:var(--font-zh-display);font-size:1.2rem;font-weight:700;">${esc(userState.name || '未命名')}</div>
          <div class="text-meta">${userState.grade || '-'} 年级</div>
        </div>
        <button class="btn btn--secondary btn--sm" style="margin-left:auto;" id="btn-edit-user">编辑资料</button>
      </div>

      <!-- 概览数据 -->
      <div class="progress-overview">
        ${statCard({ label: '总诗词', value: stats.total })}
        ${statCard({ label: '已学', value: stats.learned, unit: `/ ${stats.total}`, pct: (stats.learned / stats.total) * 100 })}
        ${statCard({ label: '已掌握', value: stats.mastered, mod: 'stat-card__value--jade', pct: (stats.mastered / stats.total) * 100 })}
        ${statCard({ label: '今日待复习', value: stats.dueForReview, mod: 'stat-card__value--amber' })}
      </div>

      <!-- 学习曲线 -->
      <div class="card" style="margin-bottom:var(--s-5);">
        <h2 class="text-h2" style="margin-bottom:var(--s-4);">学习曲线（最近 30 天）</h2>
        ${curveSvg}
      </div>

      <!-- 朝代分布 -->
      <div class="card" style="margin-bottom:var(--s-5);">
        <h2 class="text-h2" style="margin-bottom:var(--s-4);">朝代分布</h2>
        ${pieSvg}
      </div>

      <!-- 成就墙 -->
      <div class="card" style="margin-bottom:var(--s-5);">
        <h2 class="text-h2" style="margin-bottom:var(--s-4);">🏆 成就徽章</h2>
        <div class="progress-achievements">
          ${ACHIEVEMENT_DEFS.map(def => {
            const unlocked = allAchievements.includes(def.id);
            return `<div class="achievement-card card${unlocked ? '' : ' achievement-card--locked'}">
              <div class="achievement-card__icon">${def.icon}</div>
              <div class="achievement-card__name">${esc(def.name)}</div>
              <div class="achievement-card__progress">${esc(def.desc)}</div>
            </div>`;
          }).join('')}
        </div>
      </div>

      <!-- 多用户管理 -->
      <div class="card" id="user-mgmt-section">
        <h2 class="text-h2" style="margin-bottom:var(--s-4);">⚙️ 用户管理</h2>
        <div id="user-edit-form" hidden>
          <div style="display:flex;flex-wrap:wrap;gap:var(--s-4);align-items:flex-end;margin-bottom:var(--s-4);">
            <label style="display:flex;flex-direction:column;gap:var(--s-2);">
              <span class="text-sm">姓名</span>
              <input type="text" id="input-user-name" class="input" value="${esc(userState.name || '')}" style="width:160px;">
            </label>
            <label style="display:flex;flex-direction:column;gap:var(--s-2);">
              <span class="text-sm">头像（emoji）</span>
              <input type="text" id="input-user-avatar" class="input" value="${esc(userState.avatar || '')}" maxlength="2" style="width:80px;">
            </label>
            <label style="display:flex;flex-direction:column;gap:var(--s-2);">
              <span class="text-sm">年级</span>
              <select id="input-user-grade" class="input select" style="width:100px;">
                ${[1,2,3,4,5,6].map(g => `<option value="${g}"${g === userState.grade ? ' selected' : ''}>${g} 年级</option>`).join('')}
              </select>
            </label>
            <button class="btn btn--primary" id="btn-save-user">保存</button>
            <button class="btn btn--ghost" id="btn-cancel-edit">取消</button>
          </div>
        </div>

        <div style="display:flex;flex-wrap:wrap;gap:var(--s-3);margin-bottom:var(--s-4);">
          ${getAllUsers().map(u => `
            <button class="btn ${u.id === userId ? 'btn--primary' : 'btn--secondary'}" data-switch-user="${esc(u.id)}">
              ${esc(u.avatar || '🌱')} ${esc(u.name)}
            </button>`).join('')}
          <button class="btn btn--ghost" id="btn-add-user">+ 新建用户</button>
        </div>
        <div style="display:flex;gap:var(--s-3);flex-wrap:wrap;">
          <button class="btn btn--danger btn--sm" id="btn-reset-progress">重置本账号进度</button>
          <button class="btn btn--secondary btn--sm" id="btn-export-progress">导出进度</button>
          <label class="btn btn--secondary btn--sm" style="cursor:pointer;">
            导入进度
            <input type="file" id="input-import-progress" accept=".json" hidden>
          </label>
        </div>
      </div>
    </div>
  `;

  bindProgressEvents(container);
}

function bindProgressEvents(container) {
  container.querySelector('#btn-edit-user')?.addEventListener('click', () => {
    container.querySelector('#user-edit-form').hidden = false;
  });
  container.querySelector('#btn-cancel-edit')?.addEventListener('click', () => {
    container.querySelector('#user-edit-form').hidden = true;
  });
  container.querySelector('#btn-save-user')?.addEventListener('click', () => {
    const name = container.querySelector('#input-user-name').value.trim();
    const avatar = container.querySelector('#input-user-avatar').value.trim() || '🌱';
    const grade = parseInt(container.querySelector('#input-user-grade').value, 10);
    if (!name) return;
    updateUser(getCurrentUserId(), { name, avatar, grade });
    renderProgressPage(container);
  });

  container.querySelectorAll('[data-switch-user]').forEach(btn => {
    btn.addEventListener('click', () => {
      const uid = btn.dataset.switchUser;
      if (uid && uid !== getCurrentUserId()) { switchUser(uid); renderProgressPage(container); }
    });
  });

  container.querySelector('#btn-add-user')?.addEventListener('click', () => {
    const name = prompt('请输入新用户姓名：');
    if (!name) return;
    const gradeStr = prompt('请输入年级（1-6）：', '1');
    const grade = parseInt(gradeStr, 10);
    if (!grade || grade < 1 || grade > 6) return alert('年级无效');
    const avatar = prompt('请输入 emoji 头像（如 🌸 🐯 📚）：', '🌱') || '🌱';
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
        if (data.poemProgress)  cur.poemProgress  = data.poemProgress;
        if (data.quizHistory)   cur.quizHistory   = data.quizHistory;
        if (data.achievements)  cur.achievements  = data.achievements;
        alert('导入成功');
        renderProgressPage(container);
      } catch { alert('导入失败：JSON 格式错误'); }
    };
    reader.readAsText(file);
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
