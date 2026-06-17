import { describe, it, expect } from 'vitest';
import { pinyinForText, pinyinForLines } from '../src/js/ui/learn.js';

describe('pinyin 工具', () => {
  it('pinyinForText 应返回带空格的拼音', () => {
    const p = pinyinForText('静夜思');
    expect(p).toBeTruthy();
    expect(p).toMatch(/[a-z]+/);
  });

  it('pinyinForLines 应返回与行数等长的数组', () => {
    const lines = ['床前明月光', '疑是地上霜'];
    const p = pinyinForLines(lines);
    expect(p.length).toBe(2);
    p.forEach(line => expect(line).toBeTruthy());
  });

  it('空字符串应返回空字符串', () => {
    expect(pinyinForText('')).toBe('');
    expect(pinyinForText(null)).toBe('');
  });
});
