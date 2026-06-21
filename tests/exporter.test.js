import { describe, it, expect, vi, beforeEach } from 'vitest';
import { collectPoemsData, buildLearningHtml, downloadLearningHtml } from '../src/generator/exporter.js';

describe('collectPoemsData', () => {
  beforeEach(() => localStorage.clear());

  it('应返回空数组若没有任何持久化数据', () => {
    expect(collectPoemsData([])).toEqual([]);
  });

  it('应合并元数据与 text/image/audio 持久化记录', async () => {
    localStorage.setItem('shiyun_gen_text_g1-下-03', JSON.stringify({
      translation: '月光洒在床上', background: '李白思乡', annotations: {}, theme: '思乡',
      keywords: ['月'], keySentences: [{ line: 0, chars: ['床'], blanks: [0] }], pinyin: ['chuáng'],
    }));
    localStorage.setItem('shiyun_gen_image_g1-下-03', 'data:image/png;base64,IMG');
    localStorage.setItem('shiyun_gen_audio_g1-下-03', 'data:audio/mp3;base64,AUD');

    const { POEMS_META } = await import('../src/data/poems-meta.js');
    const poems = collectPoemsData(POEMS_META);
    const g1 = poems.find(p => p.id === 'g1-下-03');
    expect(g1).toBeDefined();
    expect(g1.translation).toBe('月光洒在床上');
    expect(g1.image).toBe('data:image/png;base64,IMG');
    expect(g1.audio).toBe('data:audio/mp3;base64,AUD');
    const g2 = poems.find(p => p.id === 'g1-下-04');
    expect(g2.translation).toBe('');
    expect(g2.image).toBe('');
  });
});

describe('buildLearningHtml', () => {
  const fakeTemplate = `<!DOCTYPE html><html lang="zh-CN"><head>
    <meta charset="UTF-8">
    <title>诗云 · 学习版</title>
    <!-- @@STYLES -->
    <!-- @@DATA -->
  </head><body>
    <div id="app"></div>
    <!-- @@SCRIPTS -->
  </body></html>`;

  const fakeAssets = {
    mainCss: 'body { background: #f5f7fa; }',
    printCss: '@media print { body { font-size: 12pt; } }',
    pinyinPro: '/* pinyin-pro stub */',
    dataJs: 'export const poems = new Map();',
    storageJs: 'export const storage = {};',
    srsJs: 'export function calcNext() {}',
    routerJs: 'export const router = {};',
    audioJs: 'export const audio = {};',
    printJs: 'export const print = {};',
    uiScripts: {
      home: '/* home ui stub */',
      learn: '/* learn */',
      review: '/* review */',
      quiz: '/* quiz */',
      print: '/* print ui */',
      progress: '/* progress */',
    },
  };

  it('应把所有 assets 嵌入到模板占位符处', () => {
    const poemsJson = JSON.stringify([{ id: 'g1-01', title: '静夜思' }]);
    const html = buildLearningHtml({ poemsJson, learningTemplate: fakeTemplate, assets: fakeAssets });

    expect(html).toContain('background: #f5f7fa');
    expect(html).toContain('font-size: 12pt');
    expect(html).toContain('window.__SHIYUN_POEMS__');
    expect(html).toContain('静夜思');
    expect(html).toContain('pinyin-pro stub');
    expect(html).toContain('export const storage');
    expect(html).toContain('home ui stub');
  });

  it('输出应为合法 HTML 字符串', () => {
    const html = buildLearningHtml({ poemsJson: '[]', learningTemplate: fakeTemplate, assets: fakeAssets });
    expect(typeof html).toBe('string');
    expect(html).toMatch(/^<!DOCTYPE html>/i);
  });

  it('输出大小应在合理范围（< 200MB 警戒线）', () => {
    const poemsJson = JSON.stringify(
      Array.from({ length: 112 }, (_, i) => ({
        id: 'g' + (i % 6 + 1) + '-' + String(i).padStart(2, '0'),
        title: 'P' + i,
        author: 'A', dynasty: '唐', grade: (i % 6) + 1, type: '五言绝句',
        sequence: i + 1, content: ['床前明月光'], pinyin: ['chuáng'],
        image: 'data:image/png;base64,' + 'A'.repeat(100 * 1024),
        audio: 'data:audio/mp3;base64,' + 'B'.repeat(100 * 1024),
      }))
    );
    const html = buildLearningHtml({ poemsJson, learningTemplate: fakeTemplate, assets: fakeAssets });
    expect(html.length).toBeLessThan(200 * 1024 * 1024);
  });
});

describe('downloadLearningHtml', () => {
  beforeEach(() => {
    if (!global.URL.createObjectURL) {
      global.URL.createObjectURL = vi.fn(() => 'blob:fake');
      global.URL.revokeObjectURL = vi.fn();
    }
    document.body.innerHTML = '';
  });

  it('应创建 Blob 并触发点击下载', () => {
    const clickSpy = vi.fn();
    const origCreate = document.createElement.bind(document);
    const createSpy = vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      const el = origCreate(tag);
      if (tag === 'a') el.click = clickSpy;
      return el;
    });

    downloadLearningHtml('<html>x</html>');

    expect(createSpy).toHaveBeenCalledWith('a');
    expect(clickSpy).toHaveBeenCalled();

    createSpy.mockRestore();
  });
});
