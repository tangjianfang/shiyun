import { describe, it, expect } from 'vitest';
import { lineAtTime } from '../src/js/ui/learn.js';
import { layoutAuthors } from '../src/js/ui/cloud.js';
import { AUTHORS_META, authorYear, authorIndex, DYNASTY_BANDS } from '../src/data/authors-meta.js';

describe('lineAtTime（按句同步高亮估算）', () => {
  const title = '静夜思';                       // 3 字
  const lines = ['床前明月光', '疑是地上霜', '举头望明月', '低头思故乡']; // 各 5 字
  // 总字符 = 3 + 20 = 23

  it('时长为 0 或无诗句时返回 -1', () => {
    expect(lineAtTime(1, 0, title, lines)).toBe(-1);
    expect(lineAtTime(1, 10, title, [])).toBe(-1);
  });

  it('开头仍在读标题，返回 -1', () => {
    // pos < 3 → currentSec/dur*23 < 3 → currentSec < 3/23*dur
    expect(lineAtTime(0, 23, title, lines)).toBe(-1); // pos=0
  });

  it('读到正文第一句返回 0', () => {
    // 想要 pos 落在 [3,8) → currentSec 落在 [3,8)（dur=23 时 pos=currentSec）
    expect(lineAtTime(5, 23, title, lines)).toBe(0);
  });

  it('读到最后一句返回末句索引', () => {
    expect(lineAtTime(22, 23, title, lines)).toBe(3);
  });

  it('超过总时长返回末句索引（钳制）', () => {
    expect(lineAtTime(100, 23, title, lines)).toBe(3);
  });
});

describe('作者数据集 authors-meta', () => {
  it('每位作者都有有效的代表年份', () => {
    for (const a of AUTHORS_META) {
      expect(typeof authorYear(a)).toBe('number');
    }
  });

  it('relations 只指向数据集中存在的作者', () => {
    const idx = authorIndex();
    for (const a of AUTHORS_META) {
      for (const rel of (a.relations || [])) {
        expect(idx.has(rel.to)).toBe(true);
      }
    }
  });

  it('朝代时间带按时间升序', () => {
    for (let i = 1; i < DYNASTY_BANDS.length; i++) {
      expect(DYNASTY_BANDS[i].start).toBeGreaterThanOrEqual(DYNASTY_BANDS[i - 1].start);
    }
  });
});

describe('layoutAuthors（诗云布局）', () => {
  const sample = [
    { name: '杜甫', dynasty: '唐', birth: 712, relations: [] },
    { name: '李白', dynasty: '唐', birth: 701, relations: [] },
    { name: '诗经', dynasty: '先秦', birth: -800, relations: [] },
  ];

  it('按年代升序排列', () => {
    const nodes = layoutAuthors(sample);
    expect(nodes.map(n => n.name)).toEqual(['诗经', '李白', '杜甫']);
  });

  it('每个节点有 x/y 坐标且 x 递增', () => {
    const nodes = layoutAuthors(sample);
    expect(nodes[0].x).toBeLessThan(nodes[1].x);
    expect(nodes[1].x).toBeLessThan(nodes[2].x);
    nodes.forEach(n => {
      expect(typeof n.x).toBe('number');
      expect(typeof n.y).toBe('number');
    });
  });

  it('size 反映入选诗作数量', () => {
    const counts = new Map([['李白', 6], ['杜甫', 3]]);
    const nodes = layoutAuthors(sample, counts);
    const libai = nodes.find(n => n.name === '李白');
    const dufu = nodes.find(n => n.name === '杜甫');
    expect(libai.size).toBe(6);
    expect(dufu.size).toBe(3);
  });
});
