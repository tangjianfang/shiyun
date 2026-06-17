import { describe, it, expect, beforeEach } from 'vitest';
import { buildFillQuestion, scoreFill, collectFillChars, listWrongBlanks } from '../src/js/quiz/fill.js';
import { loadPoemMeta } from '../src/js/data.js';

beforeEach(() => {
  loadPoemMeta();
});

const SAMPLE_POEM = {
  id: 'g1-01',
  title: '静夜思',
  content: ['床前明月光', '疑是地上霜', '举头望明月', '低头思故乡'],
  grade: 1,
  keySentences: [
    { line: 0, chars: ['床', '前', '明', '月', '光'], blanks: [2, 3] },
    { line: 3, chars: ['低', '头', '思', '故', '乡'], blanks: [4] },
  ],
};

describe('collectFillChars', () => {
  it('应从所有挖空处收集正确的字', () => {
    const chars = collectFillChars(SAMPLE_POEM);
    expect(chars).toEqual(expect.arrayContaining(['明', '月', '乡']));
    expect(chars.length).toBe(3);
  });

  it('没有 keySentences 时返回空数组', () => {
    expect(collectFillChars({ content: ['床前明月光'], keySentences: [] })).toEqual([]);
  });

  it('应处理没有挖空的情况', () => {
    const p = { content: ['床前明月光'], keySentences: [{ line: 0, chars: ['床','前','明','月','光'], blanks: [] }] };
    expect(collectFillChars(p)).toEqual([]);
  });
});

describe('buildFillQuestion', () => {
  it('应返回结构化的填空题（含字库、挖空位置）', () => {
    const q = buildFillQuestion(SAMPLE_POEM);
    expect(q.poemId).toBe('g1-01');
    expect(q.title).toBe('静夜思');
    expect(q.lines).toHaveLength(2);
    expect(q.lines[0].blanks).toEqual([2, 3]);
    expect(q.lines[1].blanks).toEqual([4]);
    expect(q.charBank.length).toBeGreaterThanOrEqual(3);
    expect(q.charBank).toEqual(expect.arrayContaining(['明', '月', '乡']));
  });

  it('字库大小应包含挖空字 + 干扰字（distractorCount 控制）', () => {
    const q = buildFillQuestion(SAMPLE_POEM, { distractorCount: 3 });
    expect(q.charBank.length).toBe(6);
  });
});

describe('scoreFill', () => {
  it('全部正确应得 100 分', () => {
    const answers = { 0: { 2: '明', 3: '月' }, 3: { 4: '乡' } };
    expect(scoreFill(SAMPLE_POEM, answers)).toBe(100);
  });

  it('全部错误应得 0 分', () => {
    const answers = { 0: { 2: '前', 3: '前' }, 3: { 4: '故' } };
    expect(scoreFill(SAMPLE_POEM, answers)).toBe(0);
  });

  it('部分正确按比例给分（每空 10 分，取整）', () => {
    const answers = { 0: { 2: '明', 3: '前' }, 3: { 4: '故' } };
    expect(scoreFill(SAMPLE_POEM, answers)).toBe(33);
  });

  it('空答案应得 0 分', () => {
    expect(scoreFill(SAMPLE_POEM, {})).toBe(0);
  });

  it('缺回答时应按缺失判错', () => {
    const answers = { 0: { 2: '明' } };
    expect(scoreFill(SAMPLE_POEM, answers)).toBe(33);
  });
});

describe('listWrongBlanks', () => {
  it('应能导出错的空位', () => {
    const answers = { 0: { 2: '明', 3: '前' }, 3: { 4: '故' } };
    const wrongs = listWrongBlanks(SAMPLE_POEM, answers);
    expect(wrongs).toEqual([
      { line: 0, blankIdx: 3, userAnswer: '前', correctChar: '月' },
      { line: 3, blankIdx: 4, userAnswer: '故', correctChar: '乡' },
    ]);
  });
});
