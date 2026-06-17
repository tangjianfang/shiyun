import { describe, it, expect } from 'vitest';
import { buildOrderQuestion, scoreOrder, listWrongOrderLines, shuffleLines, isFullyCorrect } from '../src/js/quiz/order.js';

const POEM = {
  id: 'g1-01',
  title: '静夜思',
  content: ['床前明月光', '疑是地上霜', '举头望明月', '低头思故乡'],
};

describe('shuffleLines', () => {
  it('应打乱数组顺序', () => {
    const original = ['A', 'B', 'C', 'D'];
    const shuffled = shuffleLines([...original]);
    expect(shuffled).toHaveLength(4);
    expect(shuffled.sort()).toEqual(original.sort());
  });

  it('不应修改原数组', () => {
    const arr = ['A', 'B', 'C'];
    const copy = [...arr];
    shuffleLines(arr);
    expect(arr).toEqual(copy);
  });

  it('少于 2 句应返回原样', () => {
    expect(shuffleLines(['only'])).toEqual(['only']);
    expect(shuffleLines([])).toEqual([]);
  });
});

describe('buildOrderQuestion', () => {
  it('应返回打乱后的句序', () => {
    const q = buildOrderQuestion(POEM);
    expect(q.poemId).toBe('g1-01');
    expect(q.originalLines).toEqual(POEM.content);
    expect(q.shuffledLines).toHaveLength(POEM.content.length);
    expect([...q.shuffledLines].sort()).toEqual([...POEM.content].sort());
  });

  it('题目应至少打乱 1 次', () => {
    let foundShuffled = false;
    for (let i = 0; i < 50; i++) {
      const q = buildOrderQuestion(POEM);
      if (JSON.stringify(q.shuffledLines) !== JSON.stringify(POEM.content)) {
        foundShuffled = true;
        break;
      }
    }
    expect(foundShuffled).toBe(true);
  });

  it('少于 2 句的诗不能出排序题（应抛错）', () => {
    expect(() => buildOrderQuestion({ id: 'x', title: 't', content: ['only'] })).toThrow();
  });
});

describe('isFullyCorrect', () => {
  it('顺序完全正确时应返回 true', () => {
    expect(isFullyCorrect(POEM, [0, 1, 2, 3])).toBe(true);
  });

  it('顺序错误时应返回 false', () => {
    expect(isFullyCorrect(POEM, [1, 0, 2, 3])).toBe(false);
  });
});

describe('scoreOrder', () => {
  it('完全正确应得 100 分', () => {
    expect(scoreOrder(POEM, [0, 1, 2, 3])).toBe(100);
  });

  it('完全乱序应得 0 分', () => {
    expect(scoreOrder(POEM, [3, 2, 1, 0])).toBe(0);
  });

  it('部分正确按位正确率（每对 1 位得 25 分）', () => {
    expect(scoreOrder(POEM, [0, 1, 3, 2])).toBe(50);
  });

  it('部分正确 1/4 应得 25 分', () => {
    expect(scoreOrder(POEM, [0, 2, 3, 1])).toBe(25);
  });

  it('空顺序应得 0 分', () => {
    expect(scoreOrder(POEM, [])).toBe(0);
  });

  it('长度不匹配应得 0 分', () => {
    expect(scoreOrder(POEM, [0, 1, 2])).toBe(0);
  });

  it('4 句诗都换位时应得 0 分', () => {
    expect(scoreOrder(POEM, [2, 3, 0, 1])).toBe(0);
  });
});

describe('listWrongOrderLines', () => {
  it('应列出位置错误的行（用于错题回顾）', () => {
    const wrongs = listWrongOrderLines(POEM, [0, 1, 3, 2]);
    expect(wrongs).toHaveLength(2);
    expect(wrongs[0].userPosition).toBe(2);
    expect(wrongs[0].correctPosition).toBe(3);
    expect(wrongs[1].userPosition).toBe(3);
    expect(wrongs[1].correctPosition).toBe(2);
  });

  it('完全正确时应返回空数组', () => {
    expect(listWrongOrderLines(POEM, [0, 1, 2, 3])).toEqual([]);
  });
});
