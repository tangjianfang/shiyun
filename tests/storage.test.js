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
