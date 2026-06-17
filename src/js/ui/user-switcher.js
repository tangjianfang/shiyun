/**
 * 诗云 · 多用户切换 UI 组件
 *
 * 封装 storage.js 已实现的：
 * - getAllUsers / getCurrentUserId / getCurrentUserState
 * - switchUser / addUser / deleteUser / updateUser / resetUserProgress
 */

import {
  getAllUsers, getCurrentUserId, getCurrentUserState,
  switchUser, addUser, updateUser, deleteUser, resetUserProgress,
} from '../storage.js';

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

export function validateUserInput({ name, grade, avatar }) {
  const trimmedName = String(name || '').trim();
  if (!trimmedName) {
    return { valid: false, error: '姓名不能为空' };
  }
  if (trimmedName.length > 20) {
    return { valid: false, error: '姓名不能超过 20 个字' };
  }
  if (typeof grade !== 'number' || !Number.isInteger(grade) || grade < 1 || grade > 6) {
    return { valid: false, error: '年级必须在 1-6 之间' };
  }
  const gradeNum = grade;
  const finalAvatar = String(avatar || '').trim() || '🌱';
  return {
    valid: true,
    normalized: { name: trimmedName, grade: gradeNum, avatar: finalAvatar },
  };
}

export function formatUserSummary(user) {
  if (!user) return '尚未创建用户，请创建你的学习档案';
  const mastered = Object.values(user.poemProgress || {}).filter(p => p.status === 'mastered').length;
  const learning = Object.values(user.poemProgress || {}).filter(p => p.status === 'learning' || p.status === 'reviewing').length;
  return `${user.avatar || '🌱'} ${user.name} · ${user.grade} 年级 · 已掌握 ${mastered} 首 · 学了 ${learning + mastered} 首`;
}

export function sortUsers(users) {
  return [...users].sort((a, b) => {
    const ta = a.lastActiveAt ? new Date(a.lastActiveAt).getTime() : 0;
    const tb = b.lastActiveAt ? new Date(b.lastActiveAt).getTime() : 0;
    return tb - ta;
  });
}

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

  const trigger = container.querySelector('#us-trigger');
  const dropdown = container.querySelector('#us-dropdown');
  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.hidden = !dropdown.hidden;
  });
  document.addEventListener('click', () => { dropdown.hidden = true; });

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

  container.querySelector('#us-btn-new')?.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.hidden = true;
    showCreateUserDialog(onChange);
  });
  container.querySelector('#us-btn-edit')?.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.hidden = true;
    showEditUserDialog(onChange);
  });
  container.querySelector('#us-btn-delete')?.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.hidden = true;
    confirmDeleteUser(onChange);
  });
  container.querySelector('#us-btn-reset')?.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.hidden = true;
    confirmResetProgress(onChange);
  });
}

function showCreateUserDialog(onChange) {
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

function showEditUserDialog(onChange) {
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
        <label>姓名 <input type="text" id="dlg-name" value="${escapeHtml(initial.name || '')}" maxlength="20" placeholder="如：小明"></label>
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
        <label>或自定义（输入 emoji） <input type="text" id="dlg-avatar" value="${escapeHtml(initial.avatar || '')}" maxlength="2"></label>
      </div>
      <div class="form-row modal-actions">
        <button class="btn" id="dlg-cancel">取消</button>
        <button class="btn btn--primary" id="dlg-save">保存</button>
      </div>
    </div>
  `;
  document.body.appendChild(dlg);

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

function confirmDeleteUser(onChange) {
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

function confirmResetProgress(onChange) {
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
