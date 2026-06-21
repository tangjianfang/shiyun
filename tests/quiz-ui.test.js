/**
 * quiz.js UI 编排测试 — 覆盖 startQuiz 4 模式分发 + renderQuizPlaceholder。
 * 不测试子模块的题库生成（fill/choice/order/listen 子模块已独立测）。
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { startQuiz, renderQuizPlaceholder } from '../src/js/ui/quiz.js';

const POEM = {
  id: 'g1-上-01',
  title: '咏鹅',
  author: '骆宾王',
  dynasty: '唐',
  grade: 1,
  content: ['鹅鹅鹅', '曲项向天歌', '白毛浮绿水', '红掌拨清波'],
  pinyin: ['é é é', 'qū xiàng xiàng tiān gē', 'bái máo fú lǜ shuǐ', 'hóng zhǎng bō qīng bō'],
  audio: 'data:audio/mp3;base64,FAKE',
  image: 'data:image/jpeg;base64,FAKE',
  keywords: ['鹅'],
  background: 'bg',
  theme: 'theme',
  translation: 'trans',
  annotations: {},
  keySentences: [
    { line: 0, chars: ['鹅', '鹅', '鹅'], blanks: [1] },
    { line: 3, chars: ['红', '掌', '拨', '清', '波'], blanks: [3] },
  ],
};

function setupDom() {
  document.body.innerHTML = '<div id="app-main"></div>';
}

describe('renderQuizPlaceholder', () => {
  beforeEach(setupDom);
  it('应渲染 placeholder 标记', () => {
    renderQuizPlaceholder();
    const main = document.getElementById('app-main');
    expect(main.innerHTML).toContain('考核模块');
  });
});

describe('startQuiz — 4 模式分发', () => {
  beforeEach(() => {
    setupDom();
    // 屏蔽音频自动播放副作用
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  it('fill 模式应渲染填空 UI（fill-blank + fill-bank__chip）', () => {
    startQuiz(POEM, 'fill', { onExit: () => {} });
    const html = document.getElementById('app-main').innerHTML;
    expect(html).toContain('fill-blank');
    expect(html).toContain('fill-bank__chip');
    expect(html).toContain(POEM.title);
  });

  it('choice 模式应渲染 4 个选项 A/B/C/D', () => {
    // choice 需要 getAllPoems() 返回至少若干诗
    const all = [
      POEM,
      { id: 'g1-上-02', title: '江南', content: ['江南可采莲'] },
      { id: 'g1-上-03', title: '画', content: ['远看山有色'] },
      { id: 'g1-上-04', title: '悯农', content: ['锄禾日当午'] },
      { id: 'g1-上-05', title: '古朗月行', content: ['小时不识月'] },
    ];
    // 把 all 注入到 data.js 的 poems Map
    return import('../src/js/data.js').then(({ poems }) => {
      all.forEach(p => poems.set(p.id, p));
      startQuiz(POEM, 'choice', { onExit: () => {} });
      const html = document.getElementById('app-main').innerHTML;
      expect(html.match(/chip--answer/g)?.length).toBe(4);
      expect(html).toContain('>A.');
      expect(html).toContain('>D.');
    });
  });

  it('order 模式应渲染 draggable 排序列表', () => {
    startQuiz(POEM, 'order', { onExit: () => {} });
    const html = document.getElementById('app-main').innerHTML;
    expect(html).toContain('order-list');
    expect(html).toContain('order-item');
    expect(html).toContain('draggable="true"');
  });

  it('listen 模式应渲染播放按钮和 4 个选项', () => {
    startQuiz(POEM, 'listen', { onExit: () => {} });
    const html = document.getElementById('app-main').innerHTML;
    expect(html).toContain('listen-player__btn');
    expect(html).toContain('choice-option');
  });

  it('未知 mode 应回退到 fill', () => {
    startQuiz(POEM, 'totally-bogus-mode', { onExit: () => {} });
    const html = document.getElementById('app-main').innerHTML;
    expect(html).toContain('fill-blank');
  });

  it('无 #app-main 时应静默 noop', () => {
    document.body.innerHTML = '';
    expect(() => startQuiz(POEM, 'fill', {})).not.toThrow();
  });
});

describe('startQuiz — 提交流程 (fill 模式)', () => {
  beforeEach(() => {
    setupDom();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  it('点击"提交答案"应触发 showResult，分数非空', () => {
    let receivedScore = null;
    startQuiz(POEM, 'fill', {
      onExit: () => {},
      onComplete: (score) => { receivedScore = score; },
    });
    // 不填任何空位 → 提交
    const submitBtn = document.querySelector('[data-action="submit"]');
    expect(submitBtn).toBeTruthy();
    submitBtn.click();
    const html = document.getElementById('app-main').innerHTML;
    expect(html).toContain('quiz-result');
    expect(html).toMatch(/\d+ 分/);
  });

  it('"再来一次"应重新渲染题目（不是结果页）', () => {
    startQuiz(POEM, 'fill', { onExit: () => {} });
    document.querySelector('[data-action="submit"]').click();
    document.querySelector('[data-action="retry"]').click();
    const html = document.getElementById('app-main').innerHTML;
    expect(html).not.toContain('quiz-result');
    expect(html).toContain('fill-blank');
  });

  it('"完成"应触发 onComplete(score, meta)', () => {
    let meta = null;
    startQuiz(POEM, 'fill', {
      onExit: () => {},
      onComplete: (score, m) => { meta = { score, ...m }; },
    });
    document.querySelector('[data-action="submit"]').click();
    document.querySelector('[data-action="next"]').click();
    expect(meta).toBeTruthy();
    expect(meta.score).toBeGreaterThanOrEqual(0);
    expect(meta.mode).toBe('fill');
    expect(meta.poemId).toBe(POEM.id);
  });
});
