import { describe, it, expect } from 'vitest';
import {
  POEMS_META,
  GRADES,
  DYNASTIES,
  getPoemsByGrade,
  getPoemsByDynasty,
  getPoemsByAuthor,
  searchPoems,
  getAllDynasties,
  getAllAuthors,
} from '../src/data/poems-meta.js';

describe('poems-meta 数据完整性', () => {
  it('应包含完整的 112 首', () => {
    expect(POEMS_META.length).toBe(112);
  });

  it('每首诗应有所有必需字段', () => {
    const required = ['id', 'title', 'author', 'dynasty', 'grade', 'type', 'sequence', 'content', 'source'];
    POEMS_META.forEach(poem => {
      required.forEach(field => {
        expect(poem, `诗 ${poem.id || poem.title} 缺少 ${field}`).toHaveProperty(field);
      });
    });
  });

  it('id 应唯一', () => {
    const ids = POEMS_META.map(p => p.id);
    const unique = new Set(ids);
    expect(ids.length).toBe(unique.size);
  });

  it('grade 应在 1-6 之间', () => {
    POEMS_META.forEach(poem => {
      expect(poem.grade).toBeGreaterThanOrEqual(1);
      expect(poem.grade).toBeLessThanOrEqual(6);
    });
  });

  it('content 应为非空字符串数组', () => {
    POEMS_META.forEach(poem => {
      expect(Array.isArray(poem.content)).toBe(true);
      expect(poem.content.length).toBeGreaterThan(0);
      poem.content.forEach(line => {
        expect(typeof line).toBe('string');
        expect(line.length).toBeGreaterThan(0);
      });
    });
  });

  it('id 格式应为 g{grade}-{seq}', () => {
    POEMS_META.forEach(poem => {
      expect(poem.id).toMatch(/^g[1-6]-\d{2}$/);
    });
  });

  it('title 和 author 应为非空字符串', () => {
    POEMS_META.forEach(poem => {
      expect(typeof poem.title).toBe('string');
      expect(poem.title.length).toBeGreaterThan(0);
      expect(typeof poem.author).toBe('string');
      expect(poem.author.length).toBeGreaterThan(0);
    });
  });

  it('sequence 应为正整数', () => {
    POEMS_META.forEach(poem => {
      expect(Number.isInteger(poem.sequence)).toBe(true);
      expect(poem.sequence).toBeGreaterThanOrEqual(1);
    });
  });

  it('sequence 在 1-112 范围内', () => {
    POEMS_META.forEach(poem => {
      expect(poem.sequence).toBeLessThanOrEqual(112);
    });
  });

  it('type 应为有效诗体', () => {
    const validTypes = ['五言绝句', '七言绝句', '五言律诗', '七言律诗', '词', '其他'];
    POEMS_META.forEach(poem => {
      expect(validTypes, `诗 ${poem.id} 的 type=${poem.type} 无效`).toContain(poem.type);
    });
  });
});

describe('poems-meta 各年级数量', () => {
  it('1 年级应有 12 首', () => {
    expect(getPoemsByGrade(1).length).toBe(12);
  });

  it('2 年级应有 14 首', () => {
    expect(getPoemsByGrade(2).length).toBe(14);
  });

  it('3 年级应有 20 首', () => {
    expect(getPoemsByGrade(3).length).toBe(20);
  });

  it('4 年级应有 20 首', () => {
    expect(getPoemsByGrade(4).length).toBe(20);
  });

  it('5 年级应有 20 首', () => {
    expect(getPoemsByGrade(5).length).toBe(20);
  });

  it('6 年级应有 26 首', () => {
    expect(getPoemsByGrade(6).length).toBe(26);
  });

  it('总年级分布为 12+14+20+20+20+26=112', () => {
    const total = GRADES.reduce((sum, g) => sum + getPoemsByGrade(g).length, 0);
    expect(total).toBe(112);
  });
});

describe('poems-meta 已知诗 ID 正确', () => {
  it('g1-01 应为静夜思（李白）', () => {
    const poem = POEMS_META.find(p => p.id === 'g1-01');
    expect(poem.title).toBe('静夜思');
    expect(poem.author).toBe('李白');
  });

  it('g1-02 应为咏鹅（骆宾王）', () => {
    const poem = POEMS_META.find(p => p.id === 'g1-02');
    expect(poem.title).toBe('咏鹅');
    expect(poem.author).toBe('骆宾王');
  });

  it('g6-26 应存在', () => {
    const last = POEMS_META.find(p => p.id === 'g6-26');
    expect(last).toBeDefined();
    expect(last.grade).toBe(6);
  });
});

describe('poems-meta 常量', () => {
  it('GRADES 应为 1-6', () => {
    expect(GRADES).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('DYNASTIES 应包含主要朝代', () => {
    expect(DYNASTIES).toContain('唐');
    expect(DYNASTIES).toContain('宋');
    expect(DYNASTIES).toContain('汉');
  });
});

describe('poems-meta 查询函数', () => {
  it('getPoemsByGrade 只返回指定年级', () => {
    const g3 = getPoemsByGrade(3);
    g3.forEach(p => expect(p.grade).toBe(3));
  });

  it('getPoemsByDynasty 只返回指定朝代', () => {
    const tang = getPoemsByDynasty('唐');
    tang.forEach(p => expect(p.dynasty).toBe('唐'));
    expect(tang.length).toBeGreaterThan(0);
  });

  it('getPoemsByAuthor 只返回指定作者', () => {
    const libai = getPoemsByAuthor('李白');
    libai.forEach(p => expect(p.author).toBe('李白'));
    expect(libai.length).toBeGreaterThan(0);
  });

  it('searchPoems 支持标题搜索', () => {
    const results = searchPoems('静夜');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].title).toContain('静夜');
  });

  it('searchPoems 支持作者搜索', () => {
    const results = searchPoems('李白');
    expect(results.length).toBeGreaterThan(0);
    results.forEach(p => expect(p.author).toBe('李白'));
  });

  it('searchPoems 空关键词返回全部', () => {
    expect(searchPoems('').length).toBe(POEMS_META.length);
    expect(searchPoems('   ').length).toBe(POEMS_META.length);
  });

  it('searchPoems 无匹配返回空数组', () => {
    const results = searchPoems('XYZ_NOT_EXIST_123');
    expect(results.length).toBe(0);
  });

  it('getAllDynasties 返回不重复的朝代列表', () => {
    const dynasties = getAllDynasties();
    expect(dynasties.length).toBeGreaterThan(0);
    expect(new Set(dynasties).size).toBe(dynasties.length);
  });

  it('getAllAuthors 返回不重复的作者列表', () => {
    const authors = getAllAuthors();
    expect(authors.length).toBeGreaterThan(0);
    expect(new Set(authors).size).toBe(authors.length);
  });
});

describe('poems-meta 内容正确性（已知诗验证）', () => {
  it('静夜思内容正确', () => {
    const poem = POEMS_META.find(p => p.id === 'g1-01');
    expect(poem.content).toEqual(['床前明月光', '疑是地上霜', '举头望明月', '低头思故乡']);
  });

  it('咏鹅内容正确', () => {
    const poem = POEMS_META.find(p => p.id === 'g1-02');
    expect(poem.content).toEqual(['鹅鹅鹅', '曲项向天歌', '白毛浮绿水', '红掌拨清波']);
  });

  it('登鹳雀楼内容正确', () => {
    const poem = POEMS_META.find(p => p.id === 'g1-12');
    expect(poem.content).toEqual(['白日依山尽', '黄河入海流', '欲穷千里目', '更上一层楼']);
  });

  it('草（敕勒歌）含 7 句', () => {
    const poem = POEMS_META.find(p => p.id === 'g2-07');
    expect(poem.content.length).toBe(7);
  });
});
