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
  const { grades, dynasties, authors, reviewFilter = 'all', keyword } = criteria;
  const today = new Date().toISOString().slice(0, 10);
  return poems.filter(p => {
    // 当筛选项被显式传为数组时，视为"已选"白名单：空数组 = 一项都不选。
    // 这样取消全选时预览会立刻归零，而不是把所有诗重新吐出来。
    if (grades && !grades.includes(p.grade)) return false;
    if (dynasties && !dynasties.includes(p.dynasty)) return false;
    if (authors && !authors.includes(p.author)) return false;
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
  const pages = groups.map((group, idx) => renderPage(group, formatId, idx + 1, groups.length)).join('\n');
  return `<div class="print-doc format-${formatId}">${pages}</div>`;
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

function renderClassicPage(poem, pageNum, totalPages) {
  if (!poem) return '';
  return `
    <article class="page page-classic">
      <header class="poem-header">
        <h1 class="poem-title">《${escapeHtml(poem.title)}》</h1>
        <p class="poem-meta">${escapeHtml(poem.author || '')} · ${escapeHtml(poem.dynasty || '')} · ${poem.grade || ''} 年级 · ${escapeHtml(poem.type || '')}</p>
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
        <p class="page-num">${pageNum} / ${totalPages}</p>
      </footer>
    </article>
  `;
}

function renderDictationPage(poem, pageNum, totalPages) {
  if (!poem) return '';
  return `
    <article class="page page-dictation">
      <header><h2>《${escapeHtml(poem.title)}》默写练习</h2></header>
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
        <h3>理解题</h3>
        <ol>
          <li>这首诗的作者是 ______，朝代是 ______。</li>
          <li>请用一句话概括这首诗的主题：______</li>
          <li>诗中你最喜欢的句子是：______，因为：______</li>
        </ol>
      </section>
      <footer><p class="page-num">${pageNum} / ${totalPages}</p></footer>
    </article>
  `;
}

function renderDensePage(poemList, pageNum, totalPages) {
  return `
    <article class="page page-dense">
      <header><h2>诗词复习卡（${poemList.length} 首）</h2></header>
      ${poemList.map(poem => `
        <section class="poem-card">
          <h3>《${escapeHtml(poem.title)}》· ${escapeHtml(poem.author || '')}</h3>
          <p class="poem-content">${(poem.content || []).map(escapeHtml).join(' / ')}</p>
          ${poem.translation ? `<p class="poem-translation"><strong>译文：</strong>${escapeHtml(poem.translation)}</p>` : ''}
          ${poem.background ? `<p class="poem-bg"><strong>背景：</strong>${escapeHtml(poem.background)}</p>` : ''}
          ${poem.annotations && Object.keys(poem.annotations).length > 0
            ? `<p class="poem-ann"><strong>注释：</strong>${Object.entries(poem.annotations).map(([k, v]) => `${escapeHtml(k)}：${escapeHtml(v)}`).join('；')}</p>`
            : ''}
          ${poem.theme ? `<p class="poem-theme"><strong>主题：</strong>${escapeHtml(poem.theme)}</p>` : ''}
        </section>
      `).join('<hr class="card-sep">')}
      <footer><p class="page-num">${pageNum} / ${totalPages}</p></footer>
    </article>
  `;
}

function renderHandoutPage(poem, pageNum, totalPages) {
  if (!poem) return '';
  return `
    <article class="page page-handout">
      <header class="poem-header">
        <h1>《${escapeHtml(poem.title)}》</h1>
        <p class="poem-meta">${escapeHtml(poem.author || '')} · ${escapeHtml(poem.dynasty || '')} · ${poem.grade || ''} 年级 · ${escapeHtml(poem.type || '')}</p>
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
        <h3>创作背景</h3>
        <p>${escapeHtml(poem.background || '暂无')}</p>
      </section>
      <section class="handout-section">
        <h3>字词注释</h3>
        ${poem.annotations && Object.keys(poem.annotations).length > 0
          ? `<ul>${Object.entries(poem.annotations).map(([k, v]) => `<li><strong>${escapeHtml(k)}</strong>：${escapeHtml(v)}</li>`).join('')}</ul>`
          : '<p>暂无</p>'}
      </section>
      <section class="handout-section">
        <h3>主题思想</h3>
        <p>${escapeHtml(poem.theme || '暂无')}</p>
      </section>
      <section class="handout-section">
        <h3>关键词</h3>
        <p>${(poem.keywords || []).map(escapeHtml).join('、') || '暂无'}</p>
      </section>
      <footer><p class="page-num">${pageNum} / ${totalPages}</p></footer>
    </article>
  `;
}

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}
