import { describe, it, expect } from 'vitest';
import { validateUserInput, formatUserSummary, sortUsers, AVATAR_OPTIONS } from '../src/js/ui/user-switcher.js';

describe('validateUserInput', () => {
  it('有效输入应通过', () => {
    expect(validateUserInput({ name: '小明', grade: 3, avatar: '🐯' })).toEqual({ valid: true, normalized: { name: '小明', grade: 3, avatar: '🐯' } });
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
    expect(sorted[2].id).toBe('u3');
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
