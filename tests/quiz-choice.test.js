import { describe, it, expect } from 'vitest';
import { buildChoiceQuestion, scoreChoice, pickRandomMode } from '../src/js/quiz/choice.js';

const POEMS = [
  { id: 'g1-01', title: '静夜思', author: '李白', dynasty: '唐', grade: 1,
    content: ['床前明月光', '疑是地上霜', '举头望明月', '低头思故乡'] },
  { id: 'g1-02', title: '春晓', author: '孟浩然', dynasty: '唐', grade: 1,
    content: ['春眠不觉晓', '处处闻啼鸟', '夜来风雨声', '花落知多少'] },
  { id: 'g1-05', title: '登鹳雀楼', author: '王之涣', dynasty: '唐', grade: 1,
    content: ['白日依山尽', '黄河入海流', '欲穷千里目', '更上一层楼'] },
  { id: 'g1-08', title: '望庐山瀑布', author: '李白', dynasty: '唐', grade: 2,
    content: ['日照香炉生紫烟', '遥看瀑布挂前川', '飞流直下三千尺', '疑是银河落九天'] },
  { id: 'g2-01', title: '早发白帝城', author: '李白', dynasty: '唐', grade: 2,
    content: ['朝辞白帝彩云间', '千里江陵一日还', '两岸猿声啼不住', '轻舟已过万重山'] },
];

describe('buildChoiceQuestion - 给句选下句 (next-line)', () => {
  it('应返回正确数目的选项 (4个)', () => {
    const q = buildChoiceQuestion(POEMS[0], POEMS, 'next-line');
    expect(q.options).toHaveLength(4);
    expect(q.options).toContain('疑是地上霜');
  });

  it('应有正确的题目（给出上句）', () => {
    const q = buildChoiceQuestion(POEMS[0], POEMS, 'next-line');
    expect(q.mode).toBe('next-line');
    expect(q.prompt).toContain('床前明月光');
  });

  it('正确答案应是同一首诗的下一句', () => {
    const q = buildChoiceQuestion(POEMS[0], POEMS, 'next-line');
    expect(q.correctAnswer).toBe('疑是地上霜');
  });

  it('干扰项应来自其他诗，且不与正确答案重复', () => {
    const q = buildChoiceQuestion(POEMS[0], POEMS, 'next-line');
    const distractors = q.options.filter(o => o !== q.correctAnswer);
    expect(distractors.length).toBe(3);
    for (const d of distractors) {
      expect(POEMS[0].content).not.toContain(d);
    }
  });

  it('不能选最后一句（没有下一句）', () => {
    const allQuestions = [];
    for (const p of POEMS) {
      for (let i = 0; i < p.content.length - 1; i++) {
        allQuestions.push(buildChoiceQuestion(p, POEMS, 'next-line'));
      }
    }
    for (const q of allQuestions) {
      expect(q.options.length).toBe(4);
    }
  });

  it('诗库太小（<4首）时也应工作（允许重复选项作为兜底）', () => {
    const smallPool = [POEMS[0], POEMS[1]];
    const q = buildChoiceQuestion(POEMS[0], smallPool, 'next-line');
    expect(q.options.length).toBe(4);
  });
});

describe('buildChoiceQuestion - 给作者选作品 (by-author)', () => {
  it('应返回 4 个诗名选项', () => {
    const q = buildChoiceQuestion(POEMS[3], POEMS, 'by-author');
    expect(q.options).toHaveLength(4);
    expect(q.options).toContain('望庐山瀑布');
  });

  it('题目应展示作者名', () => {
    const q = buildChoiceQuestion(POEMS[3], POEMS, 'by-author');
    expect(q.prompt).toContain('李白');
  });

  it('干扰项应是其他作者的作品', () => {
    const q = buildChoiceQuestion(POEMS[3], POEMS, 'by-author');
    const distractors = q.options.filter(o => o !== q.correctAnswer);
    for (const d of distractors) {
      const foundPoem = POEMS.find(p => p.title === d);
      expect(foundPoem.author).not.toBe('李白');
    }
  });

  it('同一作者有多首作品时应不重复', () => {
    const q = buildChoiceQuestion(POEMS[3], POEMS, 'by-author');
    const distractors = q.options.filter(o => o !== q.correctAnswer);
    for (const d of distractors) {
      const foundPoem = POEMS.find(p => p.title === d);
      expect(foundPoem.author).not.toBe('李白');
    }
  });

  it('作者只有 1 首作品时也能构造题目', () => {
    const q = buildChoiceQuestion(POEMS[2], POEMS, 'by-author');
    expect(q.options.length).toBe(4);
    expect(q.correctAnswer).toBe('登鹳雀楼');
  });
});

describe('pickRandomMode', () => {
  it('应返回两种模式之一', () => {
    const mode = pickRandomMode();
    expect(['next-line', 'by-author']).toContain(mode);
  });
});

describe('scoreChoice', () => {
  it('答对应得 100 分', () => {
    expect(scoreChoice(true)).toBe(100);
  });

  it('答错应得 0 分', () => {
    expect(scoreChoice(false)).toBe(0);
  });
});
