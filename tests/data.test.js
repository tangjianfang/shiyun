import { describe, it, expect, beforeEach } from 'vitest';
import { loadPoemMeta, getPoem, getPoemsByGrade, getPoemsBySemester, getPoemsByDynasty, searchPoems, getAllDynasties, getAllAuthors, isPoemComplete, poems } from '../src/js/data.js';

describe('data.js 加载与查询', () => {
  beforeEach(() => {
    poems.clear();
    loadPoemMeta();
  });

  it('应加载 112 首诗到内存', () => {
    expect(poems.size).toBe(112);
  });

  it('getPoem 应返回正确诗', () => {
    const poem = getPoem('g1-下-03');  // 静夜思（1 年级下册第 3 首）
    expect(poem.title).toBe('静夜思');
    expect(poem.author).toBe('李白');
    expect(poem.grade).toBe(1);
    expect(poem.semester).toBe('下');
  });

  it('getPoem 返回新 id 格式 g{年级}-{学期}-{序号}', () => {
    const poem = getPoem('g3-上-01');
    expect(poem.id).toBe('g3-上-01');
    expect(poem.title).toBe('所见');
    expect(poem.semester).toBe('上');
  });

  it('getPoemsBySemester 应只返回指定学期', () => {
    const sem = getPoemsBySemester(1, '上');
    expect(sem.length).toBe(6);
    sem.forEach(p => {
      expect(p.grade).toBe(1);
      expect(p.semester).toBe('上');
    });
  });

  it('getPoemsByGrade 应只返回指定年级', () => {
    const g1 = getPoemsByGrade(1);
    expect(g1.length).toBeGreaterThan(0);
    g1.forEach(p => expect(p.grade).toBe(1));
  });

  it('getPoemsByDynasty 应只返回指定朝代', () => {
    const tang = getPoemsByDynasty('唐');
    expect(tang.length).toBeGreaterThan(0);
    tang.forEach(p => expect(p.dynasty).toBe('唐'));
  });

  it('searchPoems 应支持标题搜索', () => {
    const results = searchPoems('静夜');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].title).toContain('静夜');
  });

  it('searchPoems 应支持作者搜索', () => {
    const results = searchPoems('李白');
    expect(results.length).toBeGreaterThan(0);
    results.forEach(p => expect(p.author).toBe('李白'));
  });

  it('searchPoems 空关键词返回全部', () => {
    const results = searchPoems('');
    expect(results.length).toBe(poems.size);
  });

  it('searchPoems 空白关键词也返回全部', () => {
    const results = searchPoems('   ');
    expect(results.length).toBe(poems.size);
  });

  it('getAllDynasties 应返回不重复的朝代列表', () => {
    const dynasties = getAllDynasties();
    expect(dynasties.length).toBeGreaterThan(0);
    expect(new Set(dynasties).size).toBe(dynasties.length);
  });

  it('getAllAuthors 应返回不重复的作者列表', () => {
    const authors = getAllAuthors();
    expect(authors.length).toBeGreaterThan(0);
    expect(new Set(authors).size).toBe(authors.length);
  });
});

describe('isPoemComplete', () => {
  beforeEach(() => { poems.clear(); loadPoemMeta(); });

  it('新加载的诗 incomplete', () => {
    expect(isPoemComplete(getPoem('g1-下-03'))).toBe(false);
  });

  it('有 image + audio + pinyin 的诗 complete', () => {
    const p = getPoem('g1-下-03');
    p.image = 'data:image/jpeg;base64,...';
    p.audio = 'data:audio/mp3;base64,...';
    p.pinyin = ['chuáng', 'qián'];
    expect(isPoemComplete(p)).toBe(true);
  });
});