import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getUser, setUser, getAllUsers, setCurrentUser, getCurrentUserId,
  getPoemProgress, updatePoemProgress,
  addQuizHistory, getQuizHistory,
  exportData, importData, resetAll,
  getCurrentUserState, switchUser,
  addUser, updateUser, deleteUser, resetUserProgress,
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
    expect(p.status).toBe('learning');
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
    expect(() => getAllUsers()).not.toThrow();
  });

  it('localStorage 中的非对象数据应被容错处理', () => {
    localStorage.setItem('shiyun_user_state', '"a string"');
    expect(() => getAllUsers()).not.toThrow();
  });
});

describe('storage · 高阶用户操作 (user-switcher/progress 使用)', () => {
  beforeEach(() => resetAll());

  describe('getCurrentUserState', () => {
    it('应返回当前用户的完整数据', () => {
      const u = getCurrentUserState();
      expect(u).toBeTruthy();
      expect(u.name).toBe('小明');
    });
  });

  describe('switchUser', () => {
    it('应切换当前用户', () => {
      setUser('user-2', { name: '小红' });
      switchUser('user-2');
      expect(getCurrentUserId()).toBe('user-2');
      expect(getCurrentUserState().name).toBe('小红');
    });
    it('切换到不存在用户应抛错', () => {
      expect(() => switchUser('ghost')).toThrow();
    });
  });

  describe('addUser', () => {
    it('应创建新用户并返回 ID', () => {
      const id = addUser({ name: '小红', avatar: '🐰', grade: 4 });
      expect(id).toBeTruthy();
      const u = getUser(id);
      expect(u.name).toBe('小红');
      expect(u.avatar).toBe('🐰');
      expect(u.grade).toBe(4);
    });
    it('应自动补全缺失字段（name/avatar/grade）', () => {
      const id = addUser({});
      const u = getUser(id);
      expect(u.name).toBeTruthy();        // 至少有默认值（ID 或 fallback）
      expect(u.avatar).toBe('🐯');         // 默认头像
      expect(u.grade).toBe(1);            // 默认年级
    });
    it('创建的 ID 应该是唯一的（不与现有冲突）', () => {
      const id1 = addUser({ name: '甲' });
      const id2 = addUser({ name: '乙' });
      expect(id1).not.toBe(id2);
    });
  });

  describe('updateUser', () => {
    it('应更新已有用户字段', () => {
      addUser({ name: '甲' });
      const all = getAllUsers();
      const id = all.find(u => u.data.name === '甲')?.id;
      updateUser(id, { name: '甲改名', grade: 6 });
      expect(getUser(id).name).toBe('甲改名');
      expect(getUser(id).grade).toBe(6);
    });
    it('更新不存在的用户应抛错', () => {
      expect(() => updateUser('ghost', { name: 'x' })).toThrow();
    });
  });

  describe('deleteUser', () => {
    it('应删除指定用户', () => {
      const id = addUser({ name: '待删' });
      expect(getUser(id)).toBeTruthy();
      deleteUser(id);
      expect(getUser(id)).toBeNull();
    });
    it('删除后应自动切换 currentUser 到剩余用户', () => {
      const id = addUser({ name: '待删' });
      switchUser(id);
      expect(getCurrentUserId()).toBe(id);
      deleteUser(id);
      // 不应再是已删除的 ID
      expect(getCurrentUserId()).not.toBe(id);
      expect(getCurrentUserId()).toBeTruthy();
    });
    it('删除唯一用户应抛错', () => {
      expect(() => deleteUser('xiaoming')).toThrow(/唯一/);
    });
    it('删除不存在的用户应抛错', () => {
      addUser({ name: 'bystander' });
      expect(() => deleteUser('ghost')).toThrow();
    });
  });

  describe('resetUserProgress', () => {
    it('应清空指定用户的 poemProgress 和 quizHistory', () => {
      updatePoemProgress('xiaoming', 'g1-01', { learnCount: 3 });
      addQuizHistory('xiaoming', { poemId: 'g1-01', mode: 'fill', score: 80 });
      resetUserProgress('xiaoming');
      expect(getPoemProgress('xiaoming', 'g1-01')).toBeNull();
      expect(getQuizHistory('xiaoming')).toEqual([]);
    });
    it('不应影响其他用户', () => {
      addUser({ name: '另一人' });
      const otherId = getAllUsers().find(u => u.data.name === '另一人').id;
      updatePoemProgress('xiaoming', 'g1-01', { learnCount: 3 });
      updatePoemProgress(otherId,   'g1-01', { learnCount: 7 });
      resetUserProgress('xiaoming');
      expect(getPoemProgress(otherId, 'g1-01').learnCount).toBe(7);
    });
    it('不存在用户应抛错', () => {
      expect(() => resetUserProgress('ghost')).toThrow();
    });
  });
});

describe('storage · setCurrentUser 异常路径', () => {
  beforeEach(() => resetAll());
  it('切换到不存在的用户应抛错', () => {
    expect(() => setCurrentUser('ghost')).toThrow();
  });
  it('setUser 隐式创建用户但不应自动切换 currentUser', () => {
    setUser('new-user', { name: '新人' });
    expect(getCurrentUserId()).toBe('xiaoming');
  });
});

describe('storage · updatePoemProgress 异常路径', () => {
  beforeEach(() => resetAll());
  it('不存在的用户应抛错', () => {
    expect(() => updatePoemProgress('ghost', 'g1-01', { learnCount: 1 })).toThrow();
  });
});
