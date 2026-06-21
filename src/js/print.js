/**
 * 诗云 · 打印排版核心逻辑
 *
 * 4 种版式：
 * - classic 经典欣赏版：单页一首 + 配图 + 拼音
 * - dictation 默写练习版：拼音填字 + 理解题
 * - dense 密集复习卡（默认）：一页 4 首 + 教学讲义
 * - handout 学习讲义版：完整教学讲义
 */

export const FORMAT_DEFS = [
  { id: 'classic',   name: '经典欣赏版', desc: '单页一首，配图、原文、拼音，适合欣赏与朗读', perPage: 1 },
  { id: 'dictation', name: '默写练习版', desc: '拼音填字 + 理解题，适合默写训练',         perPage: 1 },
  { id: 'dense',     name: '密集复习卡', desc: '一页 4 首 + 教学讲义，体积小便于携带',     perPage: 4 },
  { id: 'handout',   name: '学习讲义版', desc: '完整教学讲义（背景、注释、主题、关键句）', perPage: 1 },
];

export const REVIEW_FILTERS = [
  { id: 'all',       name: '全部' },
  { id: 'learned',   name: '已学' },
  { id: 'due',       name: '今日待复习' },
  { id: 'favorites', name: '已收藏' },
];

export function filterPoems(poems, criteria = {}) {
  const { grades, semesters, dynasties, authors, reviewFilter = 'all', keyword } = criteria;
  const today = new Date().toISOString().slice(0, 10);

  // 全部筛选项都为空时返回 0 首诗：让「默认未选」明确等于 0，
  // 避免用户打开页面就看到 112 首诗而误以为「我只选一年级」被忽略。
  const hasAnySelection =
    (grades && grades.length > 0) ||
    (semesters && semesters.length > 0) ||
    (dynasties && dynasties.length > 0) ||
    (authors && authors.length > 0) ||
    (reviewFilter && reviewFilter !== 'all') ||
    (keyword && keyword.trim());
  if (!hasAnySelection) return [];

  return poems.filter(p => {
    // 每个维度独立：空数组 = 包含全部；非空 = 白名单。
    // 这样「只选一年级」= grades=[1]，其它维度空 → 12 首诗。
    if (grades && grades.length > 0 && !grades.includes(p.grade)) return false;
    if (semesters && semesters.length > 0 && !semesters.includes(p.semester)) return false;
    if (dynasties && dynasties.length > 0 && !dynasties.includes(p.dynasty)) return false;
    if (authors && authors.length > 0 && !authors.includes(p.author)) return false;
    if (keyword && keyword.trim()) {
      const kw = keyword.trim().toLowerCase();
      const inTitle = (p.title || '').toLowerCase().includes(kw);
      const inAuthor = (p.author || '').toLowerCase().includes(kw);
      if (!inTitle && !inAuthor) return false;
    }
    switch (reviewFilter) {
      case 'learned':   if (!['learning', 'reviewing', 'mastered'].includes(p.status)) return false; break;
      case 'due':       if (!(p.nextReviewAt && p.nextReviewAt <= today && p.status !== 'mastered')) return false; break;
      case 'favorites': if (!p.favorite) return false; break;
      case 'all':
      default: break;
    }
    return true;
  });
}

export function groupForPrint(poems, formatId) {
  const def = FORMAT_DEFS.find(f => f.id === formatId);
  if (!def) throw new Error(`未知版式：${formatId}`);
  const groups = [];
  for (let i = 0; i < poems.length; i += def.perPage) {
    groups.push(poems.slice(i, i + def.perPage));
  }
  return groups;
}

export function attachUserState(poems, userState) {
  let progress = {};
  if (userState) {
    if (userState.users) {
      const currentUserId = userState.currentUser || 'xiaoming';
      progress = userState.users[currentUserId]?.poemProgress || {};
    } else if (userState.poemProgress) {
      progress = userState.poemProgress;
    }
  } else if (typeof window !== 'undefined') {
    const stored = JSON.parse(localStorage.getItem('shiyun_user_state') || '{}');
    const currentUserId = stored.currentUser || 'xiaoming';
    progress = stored.users?.[currentUserId]?.poemProgress || {};
  }
  return poems.map(p => ({
    ...p,
    status: progress[p.id]?.status || 'new',
    favorite: !!(progress[p.id]?.favorite),
    nextReviewAt: progress[p.id]?.nextReviewAt || null,
  }));
}

/** 触发浏览器打印对话框 */
export function triggerPrint() {
  window.print();
}

export function renderPrintHtml(groups, formatId) {
  const allPoems = groups.flat();
  const toc = renderTocPage(allPoems);
  const pages = groups.map((group, idx) => renderPage(group, formatId, idx + 2, groups.length + 1)).join('\n');
  return `<div class="print-doc format-${formatId}">${toc}${pages}</div>`;
}

/**
 * 目录页：按年级/学期分组列出所有要打印的诗（标题 + 作者）。
 * 这是所有版式共用的第 1 页，方便家长在打印时核对诗目、检查顺序。
 */
function renderTocPage(poems) {
  if (!poems || poems.length === 0) return '';
  // 按 (年级, 学期, sequence) 排序
  const sorted = [...poems].sort((a, b) => {
    if (a.grade !== b.grade) return a.grade - b.grade;
    if ((a.semester || '') !== (b.semester || '')) {
      return (a.semester || '') < (b.semester || '') ? -1 : 1;
    }
    return (a.sequence || 0) - (b.sequence || 0);
  });
  // 按 (年级, 学期) 分组
  const bySem = new Map();
  for (const p of sorted) {
    const key = `${p.grade}-${p.semester || '?'}`;
    if (!bySem.has(key)) bySem.set(key, []);
    bySem.get(key).push(p);
  }
  const groups = [...bySem.entries()].map(([key, list]) => {
    const [g, s] = key.split('-');
    const label = `${g} 年级 ${s === '上' ? '上册' : s === '下' ? '下册' : ''}`;
    const items = list.map((p, i) =>
      `<li class="toc-item">
        <span class="toc-idx">${i + 1}.</span>
        <span class="toc-id">${escapeHtml(p.id || '')}</span>
        <span class="toc-title">《${escapeHtml(p.title)}》<span class="toc-dynasty">${escapeHtml(p.dynasty || '佚名')}</span></span>
        <span class="toc-author">${escapeHtml(p.author || '佚名')}</span>
      </li>`
    ).join('');
    return `<section class="toc-group">
      <h3 class="toc-group-label">${label}<span class="toc-group-count">(${list.length})</span></h3>
      <ol class="toc-list">${items}</ol>
    </section>`;
  }).join('');

  const today = new Date().toISOString().slice(0, 10);
  return `
    <article class="page page-toc">
      <header class="toc-header">
        <h1 class="toc-title-main">诗云打印目录</h1>
        <p class="toc-subtitle">
          <span class="kv"><span class="k">date=</span><span class="v">${today}</span></span>
          <span class="kv"><span class="k">count=</span><span class="v">${poems.length}</span></span>
          <span class="kv"><span class="k">sort=</span><span class="v">grade+sem+seq</span></span>
        </p>
      </header>
      <div class="toc-body">${groups}</div>
      <footer class="toc-footer">
        <p class="toc-hint">TOC · 目录 · index of poems</p>
      </footer>
    </article>
  `;
}

function renderPage(poemList, formatId, pageNum, totalPages) {
  switch (formatId) {
    case 'classic':   return renderClassicPage(poemList[0], pageNum, totalPages);
    case 'dictation': return renderDictationPage(poemList[0], pageNum, totalPages);
    case 'dense':     return renderDensePage(poemList, pageNum, totalPages);
    case 'handout':   return renderHandoutPage(poemList[0], pageNum, totalPages);
    default:          return '';
  }
}

function renderClassicPage(poem, pageNum, totalPages, formatId = 'classic') {
  if (!poem) return '';
  return `
    <article class="page page-classic">
      <header class="poem-header">
        <h1 class="poem-title">${escapeHtml(poem.title)}</h1>
        <p class="poem-meta">${renderPoemMeta(poem)}</p>
      </header>
      ${poem.image ? `<figure class="poem-image"><img src="${poem.image}" alt="${escapeHtml(poem.title)}"></figure>` : ''}
      <div class="poem-body">
        ${(poem.content || []).map((line, i) => `
          <p class="poem-line">
            <span class="poem-char-row">${[...line].map(c => `<span class="char">${escapeHtml(c)}</span>`).join('')}</span>
            <span class="poem-pinyin-row">${(poem.pinyin[i] || '').split(/\s+/).map(py => `<span class="pinyin">${escapeHtml(py)}</span>`).join(' ')}</span>
          </p>
        `).join('')}
      </div>
      <footer class="poem-footer">
        <span class="page-format-tag">format=classic</span>
        <p class="page-num">${pageNum} / ${totalPages}</p>
      </footer>
    </article>
  `;
}

function renderDictationPage(poem, pageNum, totalPages) {
  if (!poem) return '';
  return `
    <article class="page page-dictation">
      <header class="poem-header">
        <h1 class="poem-title">${escapeHtml(poem.title)} · 默写</h1>
        <p class="poem-meta">${renderPoemMeta(poem)}</p>
      </header>
      <div class="poem-body">
        ${(poem.content || []).map((line, i) => `
          <p class="poem-line">
            <span class="poem-pinyin-row">${(poem.pinyin[i] || '').split(/\s+/).map(py => `<span class="pinyin">${escapeHtml(py)}</span>`).join(' ')}</span>
            <span class="poem-char-row">${[...line].map((c, idx) => idx === 0
              ? `<span class="char blank">___</span>`
              : `<span class="char">${escapeHtml(c)}</span>`).join('')}</span>
          </p>
        `).join('')}
      </div>
      <section class="comprehension">
        <h3>理解题 · comprehension</h3>
        <ol>
          <li>这首诗的作者是 ______，朝代是 ______。</li>
          <li>请用一句话概括这首诗的主题：______</li>
          <li>诗中你最喜欢的句子是：______，因为：______</li>
        </ol>
      </section>
      <footer class="poem-footer">
        <span class="page-format-tag">format=dictation</span>
        <p class="page-num">${pageNum} / ${totalPages}</p>
      </footer>
    </article>
  `;
}

function renderDensePage(poemList, pageNum, totalPages) {
  return `
    <article class="page page-dense">
      <header>
        <h2>诗词复习卡 · review_cards</h2>
        <p class="meta">cards=${poemList.length} · per_page=4</p>
      </header>
      ${poemList.map((poem, i) => `
        <section class="poem-card">
          <div class="poem-card-head">
            <h3><span class="n">${i + 1}.</span>《${escapeHtml(poem.title)}》</h3>
            <span class="id-tag">${escapeHtml(poem.id || '')}</span>
          </div>
          <p class="poem-content">${(poem.content || []).map(escapeHtml).join(' / ')}</p>
          <p class="poem-card-meta">${renderPoemMetaCompact(poem)}</p>
          ${poem.translation ? `<p class="poem-translation">${escapeHtml(poem.translation)}</p>` : ''}
          ${poem.background ? `<p class="poem-bg">${escapeHtml(poem.background)}</p>` : ''}
          ${poem.annotations && Object.keys(poem.annotations).length > 0
            ? `<p class="poem-ann">${Object.entries(poem.annotations).map(([k, v]) => `${escapeHtml(k)}：${escapeHtml(v)}`).join('；')}</p>`
            : ''}
          ${poem.theme ? `<p class="poem-theme">${escapeHtml(poem.theme)}</p>` : ''}
        </section>
      `).join('<hr class="card-sep">')}
      <footer class="poem-footer">
        <span class="page-format-tag">format=dense</span>
        <p class="page-num">${pageNum} / ${totalPages}</p>
      </footer>
    </article>
  `;
}

function renderHandoutPage(poem, pageNum, totalPages) {
  if (!poem) return '';
  return `
    <article class="page page-handout">
      <header class="poem-header">
        <h1 class="poem-title">${escapeHtml(poem.title)}</h1>
        <p class="poem-meta">${renderPoemMeta(poem)}</p>
      </header>
      ${poem.image ? `<figure class="poem-image"><img src="${poem.image}" alt="${escapeHtml(poem.title)}"></figure>` : ''}
      <section class="poem-body">
        ${(poem.content || []).map((line, i) => `
          <p class="poem-line">
            <span class="poem-char-row">${[...line].map(c => `<span class="char">${escapeHtml(c)}</span>`).join('')}</span>
            <span class="poem-pinyin-row">${(poem.pinyin[i] || '').split(/\s+/).map(py => `<span class="pinyin">${escapeHtml(py)}</span>`).join(' ')}</span>
          </p>
        `).join('')}
      </section>
      <section class="handout-section">
        <h3>创作背景 · background</h3>
        <p>${escapeHtml(poem.background || '暂无')}</p>
      </section>
      <section class="handout-section">
        <h3>字词注释 · annotations</h3>
        ${poem.annotations && Object.keys(poem.annotations).length > 0
          ? `<ul>${Object.entries(poem.annotations).map(([k, v]) => `<li><strong>${escapeHtml(k)}</strong>：${escapeHtml(v)}</li>`).join('')}</ul>`
          : '<p>暂无</p>'}
      </section>
      <section class="handout-section">
        <h3>主题思想 · theme</h3>
        <p>${escapeHtml(poem.theme || '暂无')}</p>
      </section>
      <section class="handout-section">
        <h3>关键词 · keywords</h3>
        <p>${(poem.keywords || []).map(escapeHtml).join('、') || '暂无'}</p>
      </section>
      <footer class="poem-footer">
        <span class="page-format-tag">format=handout</span>
        <p class="page-num">${pageNum} / ${totalPages}</p>
      </footer>
    </article>
  `;
}

/** 元数据 — k=v badge 风格。关键词 (id / 朝代) 视觉最重。 */
function renderPoemMeta(poem) {
  const author = escapeHtml(poem.author || '佚名');
  const dynasty = escapeHtml(poem.dynasty || '佚名');
  const id = escapeHtml(poem.id || '');
  const grade = poem.grade || '';
  const sem = poem.semester || '';
  const semLabel = sem === '上' ? '上册' : sem === '下' ? '下册' : '';
  return `
    <span class="meta-tag"><span class="k">id=</span><span class="v id">${id}</span></span>
    <span class="meta-tag"><span class="k">author=</span><span class="v author">${author}</span></span>
    <span class="meta-tag"><span class="k">dynasty=</span><span class="v dynasty">${dynasty}</span></span>
    <span class="meta-tag"><span class="k">grade=</span><span class="v">${grade} 年级 ${semLabel}</span></span>
  `;
}

/** 紧凑元数据 — dense 版式单行 */
function renderPoemMetaCompact(poem) {
  const author = escapeHtml(poem.author || '佚名');
  const dynasty = escapeHtml(poem.dynasty || '');
  const grade = poem.grade || '';
  const sem = poem.semester || '';
  const semLabel = sem === '上' ? '上' : sem === '下' ? '下' : '';
  return `<span class="k">@ </span><span class="v author">${author}</span> · <span class="v dynasty">${dynasty}</span> · ${grade}年级${semLabel}`;
}

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}
