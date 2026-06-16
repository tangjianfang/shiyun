# Task 22: 多用户切换

**依赖：** Task 11, Task 20
**并行组：** parallel-visualization（与 Task 20/21 并行）
**估时：** 0.5 天

**Files:**
- Modify: `src/js/ui/progress.js`（扩展：user-switcher 模块 + 首页 user-card）
- Create: `src/js/ui/user-switcher.js`（专门处理用户切换的 UI 组件）
- Create: `tests/user-switcher.test.js`
- Modify: `src/css/main.css`（追加用户切换器样式）

> **说明**：本任务主要在前端 UI 层封装 storage.js 已有的多用户 API（switchUser / addUser / deleteUser / resetUserProgress），不修改 storage 底层。

## Step 1: 写失败的测试

测试纯函数 `validateUserInput` 和 `formatUserSummary`。

```javascript
// tests/user-switcher.test.js
import { describe, it, expect } from 'vitest';
import { validateUserInput, formatUserSummary, sortUsers, AVATAR_OPTIONS } from '../src/js/ui/user-switcher.js';

describe('validateUserInput', () => {
  it('有效输入应通过', () => {
    expect(validateUserInput({ name: '小明', grade: 3, avatar: '🐯' })).toEqual({ valid: true });
  });

  it('姓名为空应拒绝', () => {
    const r = validateUserInput({ name: '   ', grade: 3, avatar: '🐯' });
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/姓名/);
  });

  it('姓名超长应拒绝（>20）', () => {
    const r = validateUserInput({ name: 'a'.repeat(21), grade: 3, avatar: '🐯' });
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/姓名/);
  });

  it('年级越界应拒绝', () => {
    expect(validateUserInput({ name: 'x', grade: 0, avatar: '🌸' }).valid).toBe(false);
    expect(validateUserInput({ name: 'x', grade: 7, avatar: '🌸' }).valid).toBe(false);
    expect(validateUserInput({ name: 'x', grade: '3', avatar: '🌸' }).valid).toBe(false);
  });

  it('空头像使用默认', () => {
    const r = validateUserInput({ name: 'x', grade: 3, avatar: '' });
    expect(r.valid).toBe(true);
    expect(r.normalized.avatar).toBe('🌱');
  });

  it('应返回 normalized 输入', () => {
    const r = validateUserInput({ name: '  小明  ', grade: 3, avatar: '🐯' });
    expect(r.normalized.name).toBe('小明');
  });
});

describe('formatUserSummary', () => {
  it('空状态应返回引导文案', () => {
    expect(formatUserSummary(null)).toMatch(/创建/);
  });

  it('应展示姓名/年级/统计', () => {
    const user = {
      name: '小明', avatar: '🐯', grade: 3,
      poemProgress: {
        'g1-01': { status: 'mastered' },
        'g1-02': { status: 'mastered' },
        'g1-03': { status: 'learning' },
      },
    };
    const s = formatUserSummary(user);
    expect(s).toContain('小明');
    expect(s).toContain('3');
    expect(s).toContain('🐯');
    expect(s).toMatch(/掌握.*2/);
  });
});

describe('sortUsers', () => {
  it('应按 lastActiveAt 倒序（最近活跃在前）', () => {
    const users = [
      { id: 'u1', lastActiveAt: '2026-06-10' },
      { id: 'u2', lastActiveAt: '2026-06-15' },
      { id: 'u3', lastActiveAt: null },
    ];
    const sorted = sortUsers(users);
    expect(sorted[0].id).toBe('u2');
    expect(sorted[1].id).toBe('u1');
    expect(sorted[2].id).toBe('u3'); // null 排最后
  });
});

describe('AVATAR_OPTIONS', () => {
  it('应至少提供 12 个 emoji 头像选项', () => {
    expect(AVATAR_OPTIONS.length).toBeGreaterThanOrEqual(12);
    AVATAR_OPTIONS.forEach(a => {
      expect(a.emoji).toBeTruthy();
      expect(a.label).toBeTruthy();
    });
  });
});
```

## Step 2: 运行测试验证失败

```bash
npm test -- tests/user-switcher.test.js
```

Expected: FAIL（模块未找到）

## Step 3: 实现 user-switcher.js

创建 `src/js/ui/user-switcher.js`：

```javascript
/**
 * 诗云 · 多用户切换 UI 组件
 *
 * 依赖 storage.js 已实现的：
 * - getAllUsers / getCurrentUserId / getCurrentUserState
 * - switchUser / addUser / deleteUser / updateUser / resetUserProgress
 *
 * 本模块：
 * - 渲染用户切换器（下拉）
 * - 新建用户对话框
 * - 重置进度二次确认
 * - 头像选择面板
 */

import {
  getAllUsers, getCurrentUserId, getCurrentUserState,
  switchUser, addUser, updateUser, deleteUser, resetUserProgress,
} from '../storage.js';

/**
 * 可选头像（emoji 池）
 */
export const AVATAR_OPTIONS = [
  { emoji: '🌱', label: '小芽' },
  { emoji: '🌸', label: '樱花' },
  { emoji: '🌺', label: '花朵' },
  { emoji: '🌻', label: '向日葵' },
  { emoji: '🌳', label: '大树' },
  { emoji: '🐯', label: '小虎' },
  { emoji: '🐰', label: '小兔' },
  { emoji: '🦊', label: '狐狸' },
  { emoji: '🐼', label: '熊猫' },
  { emoji: '🦁', label: '狮子' },
  { emoji: '🐱', label: '小猫' },
  { emoji: '🐶', label: '小狗' },
  { emoji: '🦋', label: '蝴蝶' },
  { emoji: '⭐', label: '星星' },
  { emoji: '🌙', label: '月亮' },
  { emoji: '☀️', label: '太阳' },
];

/**
 * 验证用户输入
 * @returns {{valid: boolean, error?: string, normalized?: Object}}
 */
export function validateUserInput({ name, grade, avatar }) {
  const trimmedName = String(name || '').trim();
  if (!trimmedName) {
    return { valid: false, error: '姓名不能为空' };
  }
  if (trimmedName.length > 20) {
    return { valid: false, error: '姓名不能超过 20 个字' };
  }
  const gradeNum = parseInt(grade, 10);
  if (!Number.isInteger(gradeNum) || gradeNum < 1 || gradeNum > 6) {
    return { valid: false, error: '年级必须在 1-6 之间' };
  }
  const finalAvatar = String(avatar || '').trim() || '🌱';
  return {
    valid: true,
    normalized: { name: trimmedName, grade: gradeNum, avatar: finalAvatar },
  };
}

/**
 * 格式化用户摘要（用于首页卡片）
 */
export function formatUserSummary(user) {
  if (!user) return '尚未创建用户，请创建你的学习档案';
  const mastered = Object.values(user.poemProgress || {}).filter(p => p.status === 'mastered').length;
  const learning = Object.values(user.poemProgress || {}).filter(p => p.status === 'learning' || p.status === 'reviewing').length;
  return `${user.avatar || '🌱'} ${user.name} · ${user.grade} 年级 · 已掌握 ${mastered} 首 · 学了 ${learning + mastered} 首`;
}

/**
 * 用户列表排序：最近活跃在前
 */
export function sortUsers(users) {
  return [...users].sort((a, b) => {
    const ta = a.lastActiveAt ? new Date(a.lastActiveAt).getTime() : 0;
    const tb = b.lastActiveAt ? new Date(b.lastActiveAt).getTime() : 0;
    return tb - ta;
  });
}

/* ============== UI 渲染 ============== */

/**
 * 渲染用户切换器（下拉式）
 * @param {HTMLElement} container
 * @param {Function} onChange - 切换后回调
 */
export function renderUserSwitcher(container, onChange) {
  const users = sortUsers(getAllUsers());
  const currentId = getCurrentUserId();
  const current = getCurrentUserState();

  container.innerHTML = `
    <div class="user-switcher" id="user-switcher">
      <button class="us-trigger" id="us-trigger" type="button">
        <span class="us-avatar">${current?.avatar || '🌱'}</span>
        <span class="us-name">${escapeHtml(current?.name || '未选择')}</span>
        <span class="us-grade">${current?.grade ? current.grade + ' 年级' : ''}</span>
        <span class="us-caret">▾</span>
      </button>
      <div class="us-dropdown" id="us-dropdown" hidden>
        <div class="us-list">
          ${users.length === 0
            ? '<p class="us-empty">还没有用户，先创建一个吧</p>'
            : users.map(u => `
              <div class="us-item ${u.id === currentId ? 'active' : ''}" data-uid="${u.id}">
                <span class="us-avatar">${u.avatar || '🌱'}</span>
                <div class="us-info">
                  <div class="us-name">${escapeHtml(u.name)}</div>
                  <div class="us-meta">${u.grade} 年级${u.lastActiveAt ? ' · 最近 ' + u.lastActiveAt.slice(0, 10) : ''}</div>
                </div>
                ${u.id === currentId ? '<span class="us-check">✓</span>' : ''}
              </div>
            `).join('')}
        </div>
        <div class="us-actions">
          <button class="btn btn-sm" id="us-btn-new">+ 新建用户</button>
          ${currentId ? '<button class="btn btn-sm" id="us-btn-edit">编辑</button>' : ''}
          ${currentId ? '<button class="btn btn-sm btn-danger" id="us-btn-delete">删除</button>' : ''}
          ${currentId ? '<button class="btn btn-sm btn-warning" id="us-btn-reset">重置进度</button>' : ''}
        </div>
      </div>
    </div>
  `;

  // 触发下拉
  const trigger = container.querySelector('#us-trigger');
  const dropdown = container.querySelector('#us-dropdown');
  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.hidden = !dropdown.hidden;
  });
  // 点击外部关闭
  document.addEventListener('click', () => { dropdown.hidden = true; });

  // 切换用户
  container.querySelectorAll('.us-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      const uid = item.dataset.uid;
      if (uid && uid !== getCurrentUserId()) {
        switchUser(uid);
        dropdown.hidden = true;
        onChange && onChange(uid);
      }
    });
  });

  // 新建用户
  container.querySelector('#us-btn-new')?.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.hidden = true;
    showCreateUserDialog(container, onChange);
  });

  // 编辑当前用户
  container.querySelector('#us-btn-edit')?.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.hidden = true;
    showEditUserDialog(container, onChange);
  });

  // 删除用户
  container.querySelector('#us-btn-delete')?.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.hidden = true;
    confirmDeleteUser(container, onChange);
  });

  // 重置进度（二次确认）
  container.querySelector('#us-btn-reset')?.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.hidden = true;
    confirmResetProgress(container, onChange);
  });
}

/**
 * 弹出新建用户对话框（用模态框）
 */
function showCreateUserDialog(container, onChange) {
  showUserDialog({
    title: '新建用户',
    initial: { name: '', grade: 1, avatar: '🌱' },
    onSubmit: (data) => {
      const id = addUser(data);
      switchUser(id);
      onChange && onChange(id);
    },
  });
}

/**
 * 弹出编辑用户对话框
 */
function showEditUserDialog(container, onChange) {
  const cur = getCurrentUserState();
  const userId = getCurrentUserId();
  showUserDialog({
    title: '编辑用户',
    initial: { name: cur.name, grade: cur.grade, avatar: cur.avatar },
    onSubmit: (data) => {
      updateUser(userId, data);
      onChange && onChange(userId);
    },
  });
}

/**
 * 通用用户编辑模态框
 */
function showUserDialog({ title, initial, onSubmit }) {
  const old = document.getElementById('user-dialog');
  if (old) old.remove();

  const dlg = document.createElement('div');
  dlg.id = 'user-dialog';
  dlg.className = 'modal-backdrop';
  dlg.innerHTML = `
    <div class="modal">
      <h3>${title}</h3>
      <div class="form-row">
        <label>姓名 <input type="text" id="dlg-name" value="${escapeHtml(initial.name)}" maxlength="20" placeholder="如：小明"></label>
      </div>
      <div class="form-row">
        <label>年级
          <select id="dlg-grade">
            ${[1,2,3,4,5,6].map(g => `<option value="${g}" ${g === initial.grade ? 'selected' : ''}>${g} 年级</option>`).join('')}
          </select>
        </label>
      </div>
      <div class="form-row">
        <label>选择头像</label>
        <div class="avatar-grid">
          ${AVATAR_OPTIONS.map(a => `
            <button type="button" class="avatar-btn ${a.emoji === initial.avatar ? 'selected' : ''}" data-emoji="${a.emoji}" title="${a.label}">${a.emoji}</button>
          `).join('')}
        </div>
      </div>
      <div class="form-row">
        <label>或自定义（输入 emoji） <input type="text" id="dlg-avatar" value="${escapeHtml(initial.avatar)}" maxlength="2"></label>
      </div>
      <div class="form-row modal-actions">
        <button class="btn" id="dlg-cancel">取消</button>
        <button class="btn btn-primary" id="dlg-save">保存</button>
      </div>
    </div>
  `;
  document.body.appendChild(dlg);

  // 头像选择联动
  dlg.querySelectorAll('.avatar-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      dlg.querySelectorAll('.avatar-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      dlg.querySelector('#dlg-avatar').value = btn.dataset.emoji;
    });
  });

  dlg.querySelector('#dlg-cancel').addEventListener('click', () => dlg.remove());
  dlg.querySelector('#dlg-save').addEventListener('click', () => {
    const data = {
      name: dlg.querySelector('#dlg-name').value,
      grade: dlg.querySelector('#dlg-grade').value,
      avatar: dlg.querySelector('#dlg-avatar').value,
    };
    const v = validateUserInput(data);
    if (!v.valid) return alert(v.error);
    try {
      onSubmit(v.normalized);
      dlg.remove();
    } catch (err) {
      alert('保存失败：' + err.message);
    }
  });
}

/**
 * 二次确认：删除用户
 */
function confirmDeleteUser(container, onChange) {
  const cur = getCurrentUserState();
  if (!confirm(`确定要删除用户「${cur.name}」吗？\n其全部学习进度将被永久删除！`)) return;
  if (!confirm('请再次确认：此操作不可撤销！')) return;
  const uid = getCurrentUserId();
  const remaining = deleteUser(uid);
  if (remaining.length > 0) {
    switchUser(remaining[0].id);
  }
  onChange && onChange(remaining[0]?.id);
}

/**
 * 二次确认：重置进度
 */
function confirmResetProgress(container, onChange) {
  const cur = getCurrentUserState();
  if (!confirm(`确定要重置「${cur.name}」的全部学习进度吗？`)) return;
  if (!confirm('请再次确认：所有学习记录、考核历史、徽章将被清空！')) return;
  resetUserProgress(getCurrentUserId());
  onChange && onChange(getCurrentUserId());
}

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

export default { renderUserSwitcher, validateUserInput, formatUserSummary, sortUsers };
```

## Step 4: 在 main.css 追加用户切换器样式

在 `src/css/main.css` 末尾追加：

```css
/* ===== 用户切换器 ===== */
.user-switcher { position: relative; display: inline-block; }
.us-trigger {
  display: inline-flex; align-items: center; gap: 0.5rem;
  padding: 0.4rem 0.8rem; background: #fff; border: 1px solid #e0e6ed;
  border-radius: 24px; cursor: pointer; user-select: none; font-size: 0.95rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}
.us-trigger:hover { box-shadow: 0 2px 6px rgba(0,0,0,0.1); }
.us-avatar { font-size: 1.3rem; }
.us-grade { color: #7f8c8d; font-size: 0.85rem; }
.us-caret { color: #999; }

.us-dropdown {
  position: absolute; top: 100%; right: 0; margin-top: 0.5rem;
  background: #fff; border: 1px solid #e0e6ed; border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.12); padding: 0.75rem;
  min-width: 280px; z-index: 200;
}
.us-list { max-height: 300px; overflow-y: auto; }
.us-empty { text-align: center; color: #999; padding: 1rem; margin: 0; }
.us-item {
  display: flex; align-items: center; gap: 0.75rem; padding: 0.6rem;
  border-radius: 6px; cursor: pointer; margin-bottom: 0.25rem;
}
.us-item:hover { background: #f5f7fa; }
.us-item.active { background: #e8f1fb; }
.us-item .us-info { flex: 1; }
.us-item .us-name { font-weight: 600; }
.us-item .us-meta { font-size: 0.8rem; color: #7f8c8d; }
.us-item .us-check { color: #4a90e2; font-weight: 700; font-size: 1.2rem; }

.us-actions {
  display: flex; flex-wrap: wrap; gap: 0.4rem;
  border-top: 1px solid #eee; padding-top: 0.6rem; margin-top: 0.4rem;
}
.btn-danger { color: #dc3545; border-color: #dc3545; }
.btn-danger:hover { background: #dc3545; color: #fff; }
.btn-warning { color: #ffc107; border-color: #ffc107; }
.btn-warning:hover { background: #ffc107; color: #fff; }

/* ===== 模态框 ===== */
.modal-backdrop {
  position: fixed; inset: 0; background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000;
}
.modal {
  background: #fff; border-radius: 8px; padding: 1.5rem;
  width: 90%; max-width: 480px; max-height: 90vh; overflow-y: auto;
  box-shadow: 0 8px 32px rgba(0,0,0,0.2);
}
.modal h3 { margin: 0 0 1rem 0; color: #2c3e50; }
.modal .form-row { margin-bottom: 1rem; }
.modal .form-row label { display: block; font-size: 0.85rem; color: #555; margin-bottom: 0.3rem; }
.modal .form-row input, .modal .form-row select {
  width: 100%; padding: 0.5rem; border: 1px solid #e0e6ed; border-radius: 4px;
  font-size: 0.95rem; box-sizing: border-box;
}
.avatar-grid {
  display: grid; grid-template-columns: repeat(8, 1fr); gap: 0.4rem;
}
.avatar-btn {
  font-size: 1.4rem; padding: 0.4rem; background: #f9fafb;
  border: 2px solid #e0e6ed; border-radius: 6px; cursor: pointer;
}
.avatar-btn:hover { background: #fff; border-color: #4a90e2; }
.avatar-btn.selected { background: #e8f1fb; border-color: #4a90e2; }
.modal-actions { display: flex; gap: 0.5rem; justify-content: flex-end; }
.modal-actions .btn { padding: 0.5rem 1rem; }

/* ===== 首页用户卡片 ===== */
.user-card {
  display: flex; align-items: center; gap: 1rem; padding: 1rem;
  background: linear-gradient(135deg, #4a90e2 0%, #6fb1ff 100%);
  color: #fff; border-radius: 12px; margin-bottom: 1rem;
}
.user-card .us-avatar { font-size: 3rem; }
.user-card .uc-info { flex: 1; }
.user-card .uc-name { font-size: 1.3rem; font-weight: 700; }
.user-card .uc-summary { font-size: 0.9rem; opacity: 0.9; margin-top: 0.25rem; }
```

## Step 5: 在 home.js 集成 user-switcher（修改文件）

修改 `src/js/ui/home.js`，在文件开头导入 `user-switcher` 并在首页渲染用户卡片：

```javascript
// src/js/ui/home.js（追加内容，保留原有渲染逻辑）
import { renderUserSwitcher, formatUserSummary } from './user-switcher.js';
import { getCurrentUserState } from '../storage.js';

export function renderHomePage(container) {
  const user = getCurrentUserState();
  const summary = formatUserSummary(user);

  // 用户卡片（点击头像进入下拉）
  const userCardHtml = user ? `
    <div class="user-card" id="home-user-card">
      <div id="home-user-switcher"></div>
    </div>
  ` : `
    <div class="user-card empty">
      <div id="home-user-switcher"></div>
    </div>
  `;

  container.innerHTML = `
    <div class="home-page">
      ${userCardHtml}
      <section class="home-actions">
        <a class="action-tile tile-review" href="#/review">
          <span class="tile-icon">🔄</span>
          <span class="tile-name">今日复习</span>
          <span class="tile-sub" id="tile-review-count">--</span>
        </a>
        <a class="action-tile tile-learn" href="#/learn">
          <span class="tile-icon">📖</span>
          <span class="tile-name">学新诗</span>
        </a>
        <a class="action-tile tile-quiz" href="#/quiz">
          <span class="tile-icon">✏️</span>
          <span class="tile-name">考核</span>
        </a>
        <a class="action-tile tile-print" href="#/print">
          <span class="tile-icon">🖨️</span>
          <span class="tile-name">打印</span>
        </a>
        <a class="action-tile tile-progress" href="#/progress">
          <span class="tile-icon">📊</span>
          <span class="tile-name">进度</span>
        </a>
      </section>
    </div>
  `;

  // 挂载用户切换器
  const switcherEl = container.querySelector('#home-user-switcher');
  if (switcherEl) {
    // 注入到卡片中：把整个 switcher 放进 .user-card
    renderUserSwitcher(switcherEl, () => {
      renderHomePage(container); // 切换后重渲染
    });
  }

  // 更新今日待复习数
  updateReviewCount(container);
}

function updateReviewCount(container) {
  const tile = container.querySelector('#tile-review-count');
  if (!tile) return;
  // 简化：依赖 review 模块的事件或直接读取 SM-2
  try {
    const { computeStats } = await import('./progress.js');
    // ... 此处略，由 review 模块接管
  } catch {}
}
```

## Step 6: 运行测试

```bash
npm test -- tests/user-switcher.test.js
```

Expected: PASS（validateUserInput / formatUserSummary / sortUsers 全部通过）

## Step 7: 手动验证

1. 启动学习版
2. 首次打开应显示空用户卡片
3. 点头像 → 弹出下拉 → 「+ 新建用户」→ 弹出模态框
4. 输入姓名、选年级、点 emoji 头像 → 保存 → 自动切换到新用户
5. 点头像 → 列表中显示新用户，且高亮「✓」
6. 切换到另一用户 → 进度数据应完全独立
7. 重置进度：弹两次确认 → 进度清空（用户保留）
8. 删除用户：弹两次确认 → 用户被删除
9. 编辑用户：改姓名/年级/头像 → 保存
10. 关闭浏览器 → 重新打开 → 用户列表保留

## Step 8: 提交

```bash
git add src/js/ui/user-switcher.js src/js/ui/home.js src/css/main.css tests/user-switcher.test.js
git commit -m "feat(user): 多用户切换（1-2 个孩子 + 头像 + 重置 + 删除）"
```

## 完成标志

```bash
echo done > .tasks/done/22
```

## 关键说明

- **不修改 storage.js**：本任务只在前端 UI 层封装，依赖 storage 已有的 API
- **数据隔离**：所有读写通过 `getCurrentUserId()` 确定当前用户，每个用户的 poemProgress / quizHistory / achievements 独立存储
- **二次确认**：重置和删除都有 `confirm()` 二次确认（连续两次），防止误操作
- **头像选择**：16 个 emoji 预设 + 自定义输入
- **模态框**：纯 HTML/CSS，不引入第三方库
- **排序**：按 `lastActiveAt` 倒序，最近活跃的用户在最前
- **场景限制**：1-2 个孩子（家庭场景），UI 不限制数量但推荐最多 2-3 个
