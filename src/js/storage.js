/**
 * localStorage 封装
 *
 * Schema: UserState (设计文档 3.2 节)
 * {
 *   version: '1.0.0',
 *   currentUser: 'xiaoming',
 *   users: {
 *     'xiaoming': {
 *       name, avatar, grade, createdAt,
 *       poemProgress: { 'g1-01': { status, learnCount, ... }, ... },
 *       quizHistory: [ { poemId, mode, score, at }, ... ],
 *       achievements: [ 'first-poem', ... ]
 *     }
 *   }
 * }
 */

const KEY = 'shiyun_user_state';
const SCHEMA_VERSION = '1.0.0';
const DEFAULT_USER_ID = 'xiaoming';

// ===== 内部：状态读写 =====

function readState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object' || !data.users) return null;
    return data;
  } catch (e) {
    console.warn('localStorage 解析失败，重置:', e);
    return null;
  }
}

function writeState(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    console.error('localStorage 写入失败:', e);
    throw new Error('存储空间已满，请导出进度后重置');
  }
}

function ensureState() {
  let s = readState();
  if (s && s.users) return s;
  s = createDefaultState();
  writeState(s);
  return s;
}

function createDefaultState() {
  return {
    version: SCHEMA_VERSION,
    currentUser: DEFAULT_USER_ID,
    users: {
      [DEFAULT_USER_ID]: createDefaultUser('小明', '🐯', 3),
    },
  };
}

function createDefaultUser(name, avatar, grade) {
  return {
    name,
    avatar,
    grade,
    createdAt: new Date().toISOString(),
    poemProgress: {},
    quizHistory: [],
    achievements: [],
  };
}

// ===== 用户管理 =====

/** 获取用户数据 */
export function getUser(userId) {
  const s = readState();
  if (!s || !s.users) return null;
  return s.users[userId] || null;
}

/** 设置/创建用户 */
export function setUser(userId, data) {
  const s = ensureState();
  const existing = s.users[userId] || createDefaultUser(data.name || userId, data.avatar || '🐯', data.grade || 1);
  s.users[userId] = { ...existing, ...data };
  writeState(s);
  return s.users[userId];
}

/** 获取所有用户（返回 [{id, data}, ...]） */
export function getAllUsers() {
  const s = readState();
  if (!s || !s.users) {
    ensureState();
    return getAllUsers();
  }
  return Object.entries(s.users).map(([id, data]) => ({ id, data }));
}

/** 切换当前用户 */
export function setCurrentUser(userId) {
  const s = ensureState();
  if (!s.users[userId]) throw new Error('用户不存在: ' + userId);
  s.currentUser = userId;
  writeState(s);
}

/** 获取当前用户 ID */
export function getCurrentUserId() {
  const s = readState();
  if (!s) {
    ensureState();
    return DEFAULT_USER_ID;
  }
  return s.currentUser || DEFAULT_USER_ID;
}

// ===== 诗词进度 =====

/** 获取单首诗进度（不存在返回 null） */
export function getPoemProgress(userId, poemId) {
  const u = getUser(userId);
  if (!u || !u.poemProgress) return null;
  return u.poemProgress[poemId] || null;
}

/**
 * 更新单首诗进度（合并而非覆盖）
 */
export function updatePoemProgress(userId, poemId, updates) {
  const s = ensureState();
  if (!s.users[userId]) throw new Error('用户不存在: ' + userId);
  const user = s.users[userId];
  if (!user.poemProgress) user.poemProgress = {};

  const current = user.poemProgress[poemId] || {
    status: 'new',
    learnCount: 0,
    quizCount: 0,
    avgScore: 0,
    lastLearnedAt: null,
    nextReviewAt: null,
    easeFactor: 2.5,
    favorite: false,
    notes: '',
  };

  const merged = { ...current, ...updates };
  if (updates.learnCount !== undefined && updates.lastLearnedAt === undefined) {
    merged.lastLearnedAt = new Date().toISOString();
  }

  user.poemProgress[poemId] = merged;
  writeState(s);
  return merged;
}

// ===== 考核历史 =====

export function addQuizHistory(userId, entry) {
  const s = ensureState();
  if (!s.users[userId]) throw new Error('用户不存在: ' + userId);
  const user = s.users[userId];
  if (!user.quizHistory) user.quizHistory = [];

  const record = {
    poemId: entry.poemId,
    mode: entry.mode,
    score: entry.score,
    at: entry.at || new Date().toISOString(),
  };

  user.quizHistory.push(record);
  writeState(s);
  return record;
}

export function getQuizHistory(userId, poemId) {
  const u = getUser(userId);
  if (!u || !u.quizHistory) return [];
  if (poemId) return u.quizHistory.filter(r => r.poemId === poemId);
  return [...u.quizHistory];
}

// ===== 导入导出 =====

export function exportData() {
  const s = ensureState();
  return JSON.stringify(s, null, 2);
}

export function importData(jsonStr) {
  let data;
  try {
    data = JSON.parse(jsonStr);
  } catch (e) {
    throw new Error('JSON 解析失败: ' + e.message);
  }
  if (!data || typeof data !== 'object') {
    throw new Error('数据格式错误：不是对象');
  }
  if (!data.users || typeof data.users !== 'object') {
    throw new Error('数据格式错误：缺少 users 字段');
  }
  if (!data.currentUser || !data.users[data.currentUser]) {
    throw new Error('数据格式错误：currentUser 无效');
  }
  const s = {
    version: data.version || SCHEMA_VERSION,
    currentUser: data.currentUser,
    users: data.users,
  };
  writeState(s);
  return s;
}

// ===== 重置 =====

export function resetAll() {
  const s = createDefaultState();
  writeState(s);
  return s;
}

// 初始化
ensureState();
