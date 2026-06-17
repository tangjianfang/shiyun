import { describe, it, expect } from 'vitest';
import { buildListenQuestion, scoreListen } from '../src/js/quiz/listen.js';

const POEMS = [
  { id: 'g1-01', title: '静夜思', author: '李白', grade: 1, audio: 'data:audio/mp3;base64,aaa' },
  { id: 'g1-02', title: '春晓', author: '孟浩然', grade: 1, audio: 'data:audio/mp3;base64,bbb' },
  { id: 'g1-03', title: '登鹳雀楼', author: '王之涣', grade: 1, audio: 'data:audio/mp3;base64,ccc' },
  { id: 'g1-04', title: '寻隐者不遇', author: '贾岛', grade: 1, audio: 'data:audio/mp3;base64,ddd' },
  { id: 'g2-01', title: '望庐山瀑布', author: '李白', grade: 2, audio: 'data:audio/mp3;base64,eee' },
  { id: 'g2-02', title: '绝句', author: '杜甫', grade: 2, audio: 'data:audio/mp3;base64,fff' },
];

describe('buildListenQuestion', () => {
  it('应返回 4 个诗名选项', () => {
    const q = buildListenQuestion(POEMS[0], POEMS);
    expect(q.options).toHaveLength(4);
    expect(q.options).toContain('静夜思');
  });

  it('正确答案应是当前诗', () => {
    const q = buildListenQuestion(POEMS[0], POEMS);
    expect(q.correctAnswer).toBe('静夜思');
    expect(q.correctIndex).toBeGreaterThanOrEqual(0);
    expect(q.correctIndex).toBeLessThan(4);
    expect(q.options[q.correctIndex]).toBe('静夜思');
  });

  it('应包含音频 URL', () => {
    const q = buildListenQuestion(POEMS[0], POEMS);
    expect(q.audio).toBe('data:audio/mp3;base64,aaa');
  });

  it('干扰项应来自同年级的其他诗', () => {
    const q = buildListenQuestion(POEMS[0], POEMS);
    const distractors = q.options.filter(o => o !== q.correctAnswer);
    for (const d of distractors) {
      const foundPoem = POEMS.find(p => p.title === d);
      expect(foundPoem).toBeDefined();
      expect(foundPoem.grade).toBe(1);
      expect(foundPoem.id).not.toBe('g1-01');
    }
  });

  it('同级干扰项不足时应跨年级补足', () => {
    const q = buildListenQuestion(POEMS[3], POEMS);
    const distractors = q.options.filter(o => o !== q.correctAnswer);
    expect(distractors).toContain('静夜思');
    expect(distractors).toContain('春晓');
    expect(distractors).toContain('登鹳雀楼');
  });

  it('诗库太小（<4首）时应也能构造（允许重复兜底）', () => {
    const smallPool = [POEMS[0], POEMS[1]];
    const q = buildListenQuestion(POEMS[0], smallPool);
    expect(q.options.length).toBe(4);
  });

  it('没有音频的诗不能出听诗选诗题（应抛错）', () => {
    const noAudio = { id: 'x', title: '无名诗', grade: 1, audio: '' };
    expect(() => buildListenQuestion(noAudio, POEMS)).toThrow();
  });
});

describe('scoreListen', () => {
  it('答对应得 100 分', () => {
    expect(scoreListen(true)).toBe(100);
  });

  it('答错应得 0 分', () => {
    expect(scoreListen(false)).toBe(0);
  });
});
