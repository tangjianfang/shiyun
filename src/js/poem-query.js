/**
 * poem-query.js — 统一筛选 / 搜索 / 唯一值提取
 *
 * R-2.1  filterPoems(poems, criteria, options) — 合并 learn.filterLearnPoems + print.filterPoems
 * R-2.2  searchPoemsByKeyword(poems, keyword)  — 合并 data.searchPoems + learn.searchPoemsCase
 * R-2.4  getUniqueValues(poems, field)         — 合并 data/learn 中 4 个 getAllDynasties/Authors
 */

/**
 * 多维组合筛选。两种调用风格均支持：
 *
 * learn 风格（单值）：
 *   filterPoems(poems, { grade: 1, semester: '上', dynasty: '唐', author: '李白', keyword: '静夜' })
 *   — grade=0 / '' / null 均视为"全部"
 *
 * print 风格（数组白名单）：
 *   filterPoems(poems, { grades: [1,2], semesters: ['上'], dynasties: [], authors: [] },
 *               { defaultBehavior: 'all' })
 *   — 空数组 = 不限制该维度
 *
 * options.defaultBehavior:
 *   'all'  — 所有条件都为空时返回全部诗（learn 行为）
 *   'none' — 所有条件都为空时返回空数组（print 保护性默认）
 */
export function filterPoems(poems, criteria = {}, options = {}) {
  const { defaultBehavior = 'all' } = options;
  const {
    // 单值（learn 风格）
    grade, semester, dynasty, author,
    // 数组白名单（print 风格）；若同时传了单值则忽略数组
    grades, semesters, dynasties, authors,
    // 通用
    keyword,
    reviewFilter = 'all',
  } = criteria;

  // 把单值规范化为数组（0 / '' / null → 空数组 = 不限制）
  const gradeList    = grades    ?? (grade    ? [grade]    : []);
  const semesterList = semesters ?? (semester ? [semester] : []);
  const dynastyList  = dynasties ?? (dynasty  ? [dynasty]  : []);
  const authorList   = authors   ?? (author   ? [author]   : []);
  const kw           = (keyword || '').trim();

  const today = new Date().toISOString().slice(0, 10);

  const hasAnySelection =
    gradeList.length > 0 ||
    semesterList.length > 0 ||
    dynastyList.length > 0 ||
    authorList.length > 0 ||
    (reviewFilter && reviewFilter !== 'all') ||
    kw.length > 0;

  if (!hasAnySelection) {
    return defaultBehavior === 'none' ? [] : [...poems];
  }

  return poems.filter(p => {
    if (gradeList.length > 0    && !gradeList.includes(p.grade))       return false;
    if (semesterList.length > 0 && !semesterList.includes(p.semester)) return false;
    if (dynastyList.length > 0  && !dynastyList.includes(p.dynasty))  return false;
    if (authorList.length > 0   && !authorList.includes(p.author))    return false;
    if (kw) {
      const kwLow = kw.toLowerCase();
      if (
        !(p.title  || '').toLowerCase().includes(kwLow) &&
        !(p.author || '').toLowerCase().includes(kwLow)
      ) return false;
    }
    switch (reviewFilter) {
      case 'learned':
        if (!['learning', 'reviewing', 'mastered'].includes(p.status)) return false;
        break;
      case 'due':
        if (!(p.nextReviewAt && p.nextReviewAt <= today && p.status !== 'mastered')) return false;
        break;
      case 'favorites':
        if (!p.favorite) return false;
        break;
      default: break;
    }
    return true;
  });
}

/**
 * 关键词搜索 — 只匹配 title + author，大小写不敏感。
 * keyword 为空 / 空白 → 返回全部（不复制，返原数组引用）。
 *
 * R-2.2: 合并 data.searchPoems(keyword) 和 learn.searchPoemsCase(poems, keyword)
 */
export function searchPoemsByKeyword(poems, keyword) {
  if (!keyword || !keyword.trim()) return poems;
  const kw = keyword.trim().toLowerCase();
  return poems.filter(p =>
    (p.title  || '').toLowerCase().includes(kw) ||
    (p.author || '').toLowerCase().includes(kw)
  );
}

/**
 * 从诗词数组中提取某字段的唯一值列表（去重 + 过滤 falsy + 排序）。
 *
 * R-2.4: 合并 data.getAllDynasties / getAllAuthors /
 *         learn.getAllDynastiesForFilter / learn.getAllAuthorsForFilter
 *
 * @param {object[]} poems - 诗词对象数组
 * @param {string} field   - 字段名，通常 'dynasty' | 'author'
 * @returns {string[]}
 */
export function getUniqueValues(poems, field) {
  return [...new Set(poems.map(p => p[field]))].filter(Boolean).sort();
}
