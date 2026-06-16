# Task 11: localStorage 封装

**依赖：** 3
**并行组：** learning-foundation
**估时：** 0.5 天

**Files:**
- Create: `src/js/storage.js`
- Create: `tests/storage.test.js`

## Step 1: 写失败的测试

[测试 localStorage 封装的所有接口：用户、进度、考核历史、导入导出。]

```javascript
// tests/storage.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import {
  getUser, setUser, getAllUsers, setCurrentUser, getCurrentUserId,
  getPoemProgress, updatePoemProgress,
  addQuizHistory, getQuizHistory,
  exportData, importData, resetAll,
} from '../src/js/storage.js';

describe('storage · 用户管理', () => {
  beforeEach(() => resetAll());

  it('默认应包含示例用户"小明"', () => {
    const users = getAllUsers();
    expect(users.length).toBeGreaterThan(0);
    const xiaoming = users.find(u => u.id === 'xiaoming');
    expect(xiaoming).toBeDefined();
    expect(xiaoming.data.name).toBe('小明');
  });

  it('getCurrentUserId 默认应为 "xiaoming"', () => {
    expect(getCurrentUserId()).toBe('xiaoming');
  });

  it('getUser 应返回用户数据', () => {
    const u = getUser('xiaoming');
    expect(u).toBeTruthy();
    expect(u.name).toBe('小明');
  });

  it('getUser(不存在) 应返回 null', () => {
    expect(getUser('not-exist')).toBeNull();
  });

  it('setUser 应更新或新增用户', () => {
    setUser('user-2', { name: '小红', avatar: '🐰', grade: 5 });
    const u = getUser('user-2');
    expect(u.name).toBe('小红');
    expect(u.avatar).toBe('🐰');
  });

  it('setCurrentUser 应切换当前用户', () => {
    setUser('user-2', { name: '小红' });
    setCurrentUser('user-2');
    expect(getCurrentUserId()).toBe('user-2');
  });
});

describe('storage · 诗词进度', () => {
  beforeEach(() => resetAll());

  it('getPoemProgress(新诗) 应返回 null', () => {
    expect(getPoemProgress('xiaoming', 'g1-01')).toBeNull();
  });

  it('updatePoemProgress 应新增进度', () => {
    updatePoemProgress('xiaoming', 'g1-01', {
      status: 'learning',
      learnCount: 1,
      lastLearnedAt: new Date().toISOString(),
    });
    const p = getPoemProgress('xiaoming', 'g1-01');
    expect(p).toBeTruthy();
    expect(p.status).toBe('learning');
    expect(p.learnCount).toBe(1);
  });

  it('updatePoemProgress 应合并而非覆盖', () => {
    updatePoemProgress('xiaoming', 'g1-01', { learnCount: 1, status: 'learning' });
    updatePoemProgress('xiaoming', 'g1-01', { learnCount: 2 });
    const p = getPoemProgress('xiaoming', 'g1-01');
    expect(p.learnCount).toBe(2);
    expect(p.status).toBe('learning'); // 之前字段保留
  });

  it('updatePoemProgress 不应影响其他诗', () => {
    updatePoemProgress('xiaoming', 'g1-01', { learnCount: 1 });
    updatePoemProgress('xiaoming', 'g1-02', { learnCount: 5 });
    expect(getPoemProgress('xiaoming', 'g1-01').learnCount).toBe(1);
    expect(getPoemProgress('xiaoming', 'g1-02').learnCount).toBe(5);
  });

  it('updatePoemProgress 应自动设置 lastLearnedAt', () => {
    updatePoemProgress('xiaoming', 'g1-01', { learnCount: 1 });
    const p = getPoemProgress('xiaoming', 'g1-01');
    expect(p.lastLearnedAt).toBeTruthy();
  });
});

describe('storage · 考核历史', () => {
  beforeEach(() => resetAll());

  it('addQuizHistory 应追加记录', () => {
    addQuizHistory('xiaoming', { poemId: 'g1-01', mode: 'fill', score: 80 });
    addQuizHistory('xiaoming', { poemId: 'g1-02', mode: 'choice', score: 90 });
    const h = getQuizHistory('xiaoming');
    expect(h.length).toBe(2);
    expect(h[0].poemId).toBe('g1-01');
  });

  it('addQuizHistory 应自动补全 at 时间', () => {
    addQuizHistory('xiaoming', { poemId: 'g1-01', mode: 'fill', score: 80 });
    const h = getQuizHistory('xiaoming');
    expect(h[0].at).toBeTruthy();
  });

  it('getQuizHistory(poemId) 应只返回该诗记录', () => {
    addQuizHistory('xiaoming', { poemId: 'g1-01', mode: 'fill', score: 80 });
    addQuizHistory('xiaoming', { poemId: 'g1-02', mode: 'fill', score: 90 });
    const h = getQuizHistory('xiaoming', 'g1-01');
    expect(h.length).toBe(1);
    expect(h[0].poemId).toBe('g1-01');
  });
});

describe('storage · 导入导出', () => {
  beforeEach(() => resetAll());

  it('exportData 应返回 JSON 字符串', () => {
    const json = exportData();
    expect(typeof json).toBe('string');
    const obj = JSON.parse(json);
    expect(obj.version).toBeTruthy();
    expect(obj.users).toBeTruthy();
  });

  it('importData 应恢复数据', () => {
    updatePoemProgress('xiaoming', 'g1-01', { learnCount: 3 });
    const json = exportData();
    resetAll();
    expect(getPoemProgress('xiaoming', 'g1-01')).toBeNull();
    importData(json);
    const p = getPoemProgress('xiaoming', 'g1-01');
    expect(p.learnCount).toBe(3);
  });

  it('importData 非法 JSON 应抛错且不影响现有数据', () => {
    updatePoemProgress('xiaoming', 'g1-01', { learnCount: 1 });
    expect(() => importData('not-json')).toThrow();
    expect(getPoemProgress('xiaoming', 'g1-01').learnCount).toBe(1);
  });

  it('importData 缺少必需字段应抛错', () => {
    expect(() => importData('{}')).toThrow();
    expect(() => importData('{"version":"1.0.0"}')).toThrow();
  });
});

describe('storage · 容错', () => {
  beforeEach(() => resetAll());

  it('localStorage 中的脏 JSON 应被容错处理', () => {
    localStorage.setItem('shiyun_user_state', '{not valid json');
    // 不应抛错
    expect(() => getAllUsers()).not.toThrow();
  });

  it('localStorage 中的非对象数据应被容错处理', () => {
    localStorage.setItem('shiyun_user_state', '"a string"');
    expect(() => getAllUsers()).not.toThrow();
  });
});
```

## Step 2: 运行测试验证失败

```bash
npm test -- tests/storage.test.js
```

Expected: FAIL with "Cannot find module '../src/js/storage.js'"

## Step 3: 实现最小代码

### 3.1 替换 `src/js/storage.js`（完整实现）

```javascript
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
    // 脏数据：返回 null，触发重新初始化
    console.warn('localStorage 解析失败，重置:', e);
    return null;
  }
}

function writeState(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    // localStorage 满（QuotaExceededError）
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

function getState() {
  return ensureState();
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
 * @param {string} userId
 * @param {string} poemId
 * @param {Object} updates - 字段更新
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

  // 自动填充 lastLearnedAt
  const merged = { ...current, ...updates };
  if (updates.learnCount !== undefined && updates.lastLearnedAt === undefined) {
    merged.lastLearnedAt = new Date().toISOString();
  }

  user.poemProgress[poemId] = merged;
  writeState(s);
  return merged;
}

// ===== 考核历史 =====

/**
 * 追加考核记录
 * @param {string} userId
 * @param {Object} entry - { poemId, mode, score }
 */
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

/**
 * 获取考核历史
 * @param {string} userId
 * @param {string} [poemId] - 可选，只返回该诗的记录
 */
export function getQuizHistory(userId, poemId) {
  const u = getUser(userId);
  if (!u || !u.quizHistory) return [];
  if (poemId) return u.quizHistory.filter(r => r.poemId === poemId);
  return [...u.quizHistory]; // 返回副本
}

// ===== 导入导出 =====

/** 导出所有数据为 JSON 字符串 */
export function exportData() {
  const s = ensureState();
  return JSON.stringify(s, null, 2);
}

/**
 * 导入数据（覆盖现有）
 * @param {string} jsonStr
 */
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
  // 保留 schema 版本升级空间
  const s = {
    version: data.version || SCHEMA_VERSION,
    currentUser: data.currentUser,
    users: data.users,
  };
  writeState(s);
  return s;
}

// ===== 重置（测试用） =====

/** 重置所有数据为默认 */
export function resetAll() {
  const s = createDefaultState();
  writeState(s);
  return s;
}

// 初始化（在模块加载时执行）
ensureState();
```

## Step 4: 运行测试验证通过

```bash
npm test -- tests/storage.test.js
```

Expected: PASS (20+ tests)

## Step 5: 提交

```bash
git add src/js/storage.js tests/storage.test.js
git commit -m "feat(storage): localStorage 封装（用户/进度/考核历史/导入导出）"
```

## 完成标志

```bash
echo done > .tasks/done/11
```

## 关键说明

- **容错性**：`readState` 捕获 JSON 解析失败和格式错误，自动重建默认状态
- **写入失败**：`writeState` 捕获 QuotaExceededError，提示用户导出后重置（设计文档 9 节错误处理）
- **合并更新**：`updatePoemProgress` 是合并语义而非覆盖，下游 SM-2 算法更新部分字段时不会丢失历史数据
- **导入校验**：`importData` 验证必需字段（users, currentUser），避免损坏数据覆盖正常进度
- **默认用户**：在 `ensureState` 中创建"小明"作为示例，符合设计文档"1-2 个孩子"假设
- **导出格式**：JSON with 2 空格缩进，便于用户阅读
- **测试覆盖**：用户/进度/历史/导入导出/容错 共 5 组，约 20+ 测试
