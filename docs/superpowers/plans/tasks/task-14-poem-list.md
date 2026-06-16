# Task 14: 诗词列表页

**依赖：** 10, 11, 13
**并行组：** learning-ui
**估时：** 1 天

**Files:**
- Create: `src/js/ui/learn.js` (扩展 - 添加 renderPoemList)
- Modify: `src/css/main.css` (扩展 - 列表样式)
- Modify: `src/js/main.js` (注册列表路由)

## Step 1: 写失败的测试

[列表页的核心逻辑：过滤 + 搜索 + 状态徽章计算。用 vitest 验证纯函数。]

```javascript
// tests/poem-list.test.js
import { describe, it, expect } from 'vitest';
import { filterPoems, getStatusBadge, searchPoemsCase } from '../src/js/ui/learn.js';

describe('filterPoems', () => {
  const sample = [
    { id: 'g1-01', title: '静夜思', author: '李白', dynasty: '唐', grade: 1 },
    { id: 'g1-02', title: '咏鹅', author: '骆宾王', dynasty: '唐', grade: 1 },
    { id: 'g2-01', title: '村居', author: '高鼎', dynasty: '清', grade: 2 },
    { id: 'g3-01', title: '静夜思', author: '李白', dynasty: '唐', grade: 3 },
  ];

  it('年级筛选应只返回该年级', () => {
    const r = filterPoems(sample, { grade: 1, dynasty: '', author: '', keyword: '' });
    expect(r.length).toBe(2);
    r.forEach(p => expect(p.grade).toBe(1));
  });

  it('朝代筛选应只返回该朝代', () => {
    const r = filterPoems(sample, { grade: 0, dynasty: '清', author: '', keyword: '' });
    expect(r.length).toBe(1);
    expect(r[0].id).toBe('g2-01');
  });

  it('作者筛选应只返回该作者', () => {
    const r = filterPoems(sample, { grade: 0, dynasty: '', author: '骆宾王', keyword: '' });
    expect(r.length).toBe(1);
    expect(r[0].author).toBe('骆宾王');
  });

  it('关键词搜索应匹配标题或作者', () => {
    const r = filterPoems(sample, { grade: 0, dynasty: '', author: '', keyword: '静夜' });
    expect(r.length).toBe(2);
  });

  it('空筛选应返回全部', () => {
    const r = filterPoems(sample, { grade: 0, dynasty: '', author: '', keyword: '' });
    expect(r.length).toBe(sample.length);
  });

  it('多条件应取交集', () => {
    const r = filterPoems(sample, { grade: 1, dynasty: '唐', author: '李白', keyword: '' });
    expect(r.length).toBe(1);
    expect(r[0].id).toBe('g1-01');
  });
});

describe('getStatusBadge', () => {
  it('新诗应返回 new', () => {
    expect(getStatusBadge(null).type).toBe('new');
    expect(getStatusBadge(null).label).toBe('新诗');
  });

  it('learning 状态应返回 learning', () => {
    const p = { status: 'learning', learnCount: 1 };
    expect(getStatusBadge(p).type).toBe('learning');
    expect(getStatusBadge(p).label).toContain('学习中');
  });

  it('reviewing 应返回 reviewing', () => {
    const p = { status: 'reviewing', learnCount: 5 };
    expect(getStatusBadge(p).type).toBe('reviewing');
    expect(getStatusBadge(p).label).toContain('已学');
  });

  it('mastered 应返回 mastered 含 ⭐', () => {
    const p = { status: 'mastered', learnCount: 10 };
    const b = getStatusBadge(p);
    expect(b.type).toBe('mastered');
    expect(b.label).toContain('⭐');
  });
});

describe('searchPoemsCase', () => {
  const sample = [
    { id: 'g1-01', title: '静夜思', author: '李白', dynasty: '唐', grade: 1, content: ['床前明月光'] },
  ];

  it('空关键词返回全部', () => {
    const r = searchPoemsCase(sample, '');
    expect(r.length).toBe(1);
  });

  it('应能匹配标题', () => {
    const r = searchPoemsCase(sample, '静夜');
    expect(r.length).toBe(1);
  });

  it('应能匹配作者', () => {
    const r = searchPoemsCase(sample, '李白');
    expect(r.length).toBe(1);
  });

  it('不区分大小写匹配拼音/作者', () => {
    const r = searchPoemsCase(sample, 'LI');
    expect(r.length).toBe(0); // 拼音不索引
  });
});
```

## Step 2: 运行测试验证失败

```bash
npm test -- tests/poem-list.test.js
```

Expected: FAIL with "Cannot find module"

## Step 3: 实现最小代码

### 3.1 在 `src/js/ui/learn.js` 末尾追加列表页代码

在文件末尾、`escape` 函数之后追加：

```javascript
// ===== 诗词列表页 =====

/**
 * 渲染诗词列表页（#/learn）
 */
export function renderPoemList() {
  const main = document.getElementById('app-main');
  if (!main) return;

  const userId = getCurrentUserId();

  // 收集所有诗词 + 当前用户进度
  const allPoems = getAllPoemsList();
  const userProgress = {};
  for (const poem of allPoems) {
    const p = getPoemProgress(userId, poem.id);
    if (p) userProgress[poem.id] = p;
  }

  // 状态（筛选条件）
  const state = {
    grade: 0, // 0 = 全部
    dynasty: '',
    author: '',
    keyword: '',
  };

  // 渲染骨架
  main.innerHTML = `
    <section class="poem-list">
      <header class="poem-list__header">
        <h2 class="poem-list__title">📚 学新诗</h2>
        <div class="poem-list__count" id="poem-list-count"></div>
      </header>

      <div class="poem-list__filters">
        <div class="poem-list__search">
          <input type="search" id="filter-keyword" class="poem-list__search-input" placeholder="🔍 搜索标题或作者" autocomplete="off">
        </div>
        <div class="poem-list__filter-row">
          <select id="filter-grade" class="poem-list__select">
            <option value="0">全部年级</option>
            <option value="1">一年级</option>
            <option value="2">二年级</option>
            <option value="3">三年级</option>
            <option value="4">四年级</option>
            <option value="5">五年级</option>
            <option value="6">六年级</option>
          </select>
          <select id="filter-dynasty" class="poem-list__select">
            <option value="">全部朝代</option>
          </select>
          <select id="filter-author" class="poem-list__select">
            <option value="">全部作者</option>
          </select>
        </div>
      </div>

      <div class="poem-list__items" id="poem-list-items">
        <!-- JS 渲染 -->
      </div>
    </section>
  `;

  // 填充朝代/作者下拉
  const dynastySel = document.getElementById('filter-dynasty');
  const authorSel = document.getElementById('filter-author');
  const dynasties = getAllDynastiesForFilter(allPoems);
  const authors = getAllAuthorsForFilter(allPoems);
  dynastySel.innerHTML = '<option value="">全部朝代</option>' +
    dynasties.map(d => `<option value="${escape(d)}">${escape(d)}</option>`).join('');
  authorSel.innerHTML = '<option value="">全部作者</option>' +
    authors.map(a => `<option value="${escape(a)}">${escape(a)}</option>`).join('');

  // 渲染列表项
  const renderItems = () => {
    const filtered = filterPoems(allPoems, state);
    const itemsEl = document.getElementById('poem-list-items');
    const countEl = document.getElementById('poem-list-count');
    if (countEl) countEl.textContent = `共 ${filtered.length} 首`;

    if (filtered.length === 0) {
      itemsEl.innerHTML = `<div class="poem-list__empty">没有匹配的诗词</div>`;
      return;
    }

    itemsEl.innerHTML = filtered.map(poem => {
      const progress = userProgress[poem.id];
      const badge = getStatusBadge(progress);
      const thumb = poem.image
        ? `<img src="${poem.image}" alt="${escape(poem.title)}" class="poem-list__thumb" loading="lazy">`
        : `<div class="poem-list__thumb poem-list__thumb--placeholder">📜</div>`;
      return `
        <a href="#/poem/${poem.id}" class="poem-list__item" data-id="${poem.id}">
          ${thumb}
          <div class="poem-list__info">
            <div class="poem-list__item-title">${escape(poem.title)}</div>
            <div class="poem-list__item-meta">
              <span>${escape(poem.dynasty)} · ${escape(poem.author)}</span>
              <span>· ${escape(poem.type)}</span>
            </div>
          </div>
          <span class="poem-list__badge poem-list__badge--${badge.type}">${escape(badge.label)}</span>
        </a>
      `;
    }).join('');
  };

  renderItems();

  // ===== 事件绑定 =====
  let searchTimer = null;
  document.getElementById('filter-keyword')?.addEventListener('input', (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.keyword = e.target.value.trim();
      renderItems();
    }, 150); // 防抖
  });

  document.getElementById('filter-grade')?.addEventListener('change', (e) => {
    state.grade = Number(e.target.value);
    renderItems();
  });

  document.getElementById('filter-dynasty')?.addEventListener('change', (e) => {
    state.dynasty = e.target.value;
    renderItems();
  });

  document.getElementById('filter-author')?.addEventListener('change', (e) => {
    state.author = e.target.value;
    renderItems();
  });
}

// ===== 纯函数（可测试） =====

/** 取所有诗词数组（按年级+sequence 排序） */
function getAllPoemsList() {
  // 通过 data.js 的 poems Map
  // 这里 dynamic import 避免循环依赖
  const data = require('../data.js');
  return Array.from(data.poems.values()).sort((a, b) => {
    if (a.grade !== b.grade) return a.grade - b.grade;
    return (a.sequence || 0) - (b.sequence || 0);
  });
}

function getAllDynastiesForFilter(poems) {
  return [...new Set(poems.map(p => p.dynasty))].sort();
}

function getAllAuthorsForFilter(poems) {
  return [...new Set(poems.map(p => p.author))].sort();
}

/**
 * 过滤诗词
 * @param {Array} poems
 * @param {{grade: number, dynasty: string, author: string, keyword: string}} filters
 */
export function filterPoems(poems, filters) {
  return poems.filter(p => {
    if (filters.grade && p.grade !== filters.grade) return false;
    if (filters.dynasty && p.dynasty !== filters.dynasty) return false;
    if (filters.author && p.author !== filters.author) return false;
    if (filters.keyword) {
      const kw = filters.keyword.toLowerCase();
      if (!p.title.toLowerCase().includes(kw) &&
          !p.author.toLowerCase().includes(kw)) {
        return false;
      }
    }
    return true;
  });
}

/**
 * 获取状态徽章
 * @param {Object|null} progress
 * @returns {{type: string, label: string}}
 */
export function getStatusBadge(progress) {
  if (!progress) {
    return { type: 'new', label: '新诗' };
  }
  switch (progress.status) {
    case 'new':
      return { type: 'new', label: '新诗' };
    case 'learning':
      return { type: 'learning', label: `学习 ${progress.learnCount || 0}` };
    case 'reviewing':
      return { type: 'reviewing', label: `已学 ${progress.learnCount || 0} 次` };
    case 'mastered':
      return { type: 'mastered', label: '⭐ 已掌握' };
    default:
      return { type: 'new', label: '新诗' };
  }
}

/** 搜索（导出便于测试） */
export function searchPoemsCase(poems, keyword) {
  return filterPoems(poems, { grade: 0, dynasty: '', author: '', keyword });
}
```

> ⚠️ **注意**：`getAllPoemsList` 中的 `require` 是 CommonJS 写法，浏览器 ES Module 不支持。**请改为静态 import**（在文件顶部 import 区域加 `import { poems as poemsMap } from '../data.js';`），然后实现改为：
>
> ```javascript
> import { poems as poemsMap } from '../data.js';
>
> function getAllPoemsList() {
>   return Array.from(poemsMap.values()).sort((a, b) => {
>     if (a.grade !== b.grade) return a.grade - b.grade;
>     return (a.sequence || 0) - (b.sequence || 0);
>   });
> }
> ```

### 3.2 扩展 `src/css/main.css`

在文件末尾追加：

```css
/* ===== 诗词列表页 ===== */
.poem-list__header {
  display: flex; align-items: baseline; justify-content: space-between;
  margin-bottom: var(--space-4);
}
.poem-list__title { font-size: 22px; font-weight: 600; }
.poem-list__count { color: var(--color-text-light); font-size: 14px; }

.poem-list__filters {
  background: white;
  border-radius: var(--radius-md);
  padding: var(--space-3);
  margin-bottom: var(--space-4);
  box-shadow: var(--shadow-sm);
}
.poem-list__search { margin-bottom: var(--space-3); }
.poem-list__search-input {
  width: 100%;
  padding: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 15px;
  outline: none;
}
.poem-list__search-input:focus { border-color: var(--color-primary); }

.poem-list__filter-row {
  display: flex; gap: var(--space-2);
}
.poem-list__select {
  flex: 1;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 14px;
  background: white;
  outline: none;
  min-width: 0; /* 允许 flex 收缩 */
}

.poem-list__items {
  display: flex; flex-direction: column; gap: var(--space-2);
}
.poem-list__empty {
  background: white;
  border-radius: var(--radius-md);
  padding: var(--space-6);
  text-align: center;
  color: var(--color-text-light);
}

.poem-list__item {
  display: flex; align-items: center; gap: var(--space-3);
  background: white;
  border-radius: var(--radius-md);
  padding: var(--space-3);
  box-shadow: var(--shadow-sm);
  transition: transform 0.15s;
}
.poem-list__item:active { transform: scale(0.98); }

.poem-list__thumb {
  width: 56px; height: 56px;
  border-radius: var(--radius-sm);
  object-fit: cover;
  flex-shrink: 0;
  background: var(--color-bg);
}
.poem-list__thumb--placeholder {
  display: flex; align-items: center; justify-content: center;
  font-size: 24px;
  color: var(--color-text-light);
}

.poem-list__info { flex: 1; min-width: 0; }
.poem-list__item-title {
  font-family: var(--font-kai);
  font-size: 17px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.poem-list__item-meta {
  font-size: 12px;
  color: var(--color-text-light);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.poem-list__badge {
  flex-shrink: 0;
  padding: 2px var(--space-2);
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}
.poem-list__badge--new { background: #e3f2fd; color: #1976d2; }
.poem-list__badge--learning { background: #fff3e0; color: #f57c00; }
.poem-list__badge--reviewing { background: #e8f5e9; color: #388e3c; }
.poem-list__badge--mastered { background: #fce4ec; color: #c2185b; }

/* ===== 响应式 ===== */
@media (max-width: 380px) {
  .poem-list__filter-row { flex-wrap: wrap; }
  .poem-list__select { flex: 1 1 30%; }
  .poem-list__thumb { width: 48px; height: 48px; }
}
```

### 3.3 修改 `src/js/main.js`

把 Task 10/13 中的路由：

```javascript
import { renderPoemDetail } from './ui/learn.js';
// ...
'#/learn': renderLearnPlaceholder,
```

改为：

```javascript
import { renderPoemDetail, renderPoemList } from './ui/learn.js';
// ...
'#/learn': renderPoemList,
```

## Step 4: 运行测试验证通过

```bash
npm test -- tests/poem-list.test.js
```

Expected: PASS (13+ tests)

## Step 5: 提交

```bash
git add src/js/ui/learn.js src/css/main.css src/js/main.js tests/poem-list.test.js
git commit -m "feat(learn): 诗词列表页（多维筛选+搜索+状态徽章）"
```

## 完成标志

```bash
echo done > .tasks/done/14
```

## 关键说明

- **多维筛选**：年级（数字 0-6）+ 朝代 + 作者 + 关键词搜索，四种条件独立可组合
- **搜索防抖**：150ms `setTimeout` 防抖，避免每次输入都触发过滤
- **状态徽章**：根据 `poemProgress.status` 显示 4 种：new（蓝）/ learning（橙）/ reviewing（绿）/ mastered（粉+⭐）
- **下拉选项动态生成**：朝代和作者下拉从当前所有诗中提取（避免空选项）
- **列表项布局**：缩略图（56x56）+ 标题+元信息 + 右侧徽章，触摸区域 ≥ 44px
- **空状态**：搜索无结果时显示"没有匹配的诗词"
- **响应式**：小屏（< 380px）下下拉换行、缩略图缩小
- **排序**：按年级 + 教材 sequence，与教材顺序一致
- **跳转**：列表项用 `<a href="#/poem/{id}">`，hash 路由天然支持，浏览器后退可返回列表
- **依赖**：在 learn.js 顶部添加 `import { poems as poemsMap } from '../data.js'`，与 Task 13 的 `getPoem` 共存
- **可测试性**：`filterPoems`/`getStatusBadge`/`searchPoemsCase` 导出为纯函数，便于 vitest 验证
