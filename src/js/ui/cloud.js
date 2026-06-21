/**
 * 诗云 · 时代关联可视化（"诗云"）
 *
 * 把 62 位作者按朝代分行，每行用 CSS Grid 自动按列排布；
 * 朝代自上而下为时间先后（先秦 → 清），形成一条"上下流动"的时代长河。
 * 节点大小 = 入选诗作数量；点击节点查看作者详情与关联。
 * 呼应"诗云"之名：云端空间，时代流转，诗人星罗。
 */

import { AUTHORS_META, DYNASTY_BANDS, authorYear, authorIndex } from '../../data/authors-meta.js';
import { poems } from '../data.js';
import { esc } from './components.js';

// 关联类型 → 颜色 / 标签
const REL_STYLE = {
  friend: { color: '#c0392b', label: '交游挚友' },
  school: { color: '#3a5a78', label: '流派同道' },
  mentor: { color: '#3a8f6f', label: '师承赏识' },
};

/** 统计每位作者入选诗作数量 */
function countPoemsByAuthor() {
  const map = new Map();
  for (const p of poems.values()) {
    map.set(p.author, (map.get(p.author) || 0) + 1);
  }
  return map;
}

/**
 * 按朝代分组，并按 DYNASTY_BANDS 的 start 时间升序排列。
 * 返回 [{ dynasty, band, authors: [...按 birth 升序] }, ...]
 */
export function groupByDynasty(authors = AUTHORS_META) {
  const bands = DYNASTY_BANDS.map(b => ({
    dynasty: b.name,
    band: b,
    authors: [],
  }));
  const idx = new Map(bands.map((b, i) => [b.dynasty, i]));
  for (const a of authors) {
    const i = idx.get(a.dynasty);
    if (i === undefined) continue;
    bands[i].authors.push(a);
  }
  bands.forEach(b => b.authors.sort((x, y) => authorYear(x) - authorYear(y)));
  return bands.filter(b => b.authors.length > 0);
}

/** 年份格式化：负数为公元前 */
function fmtYear(y) {
  if (typeof y !== 'number') return '';
  return y < 0 ? `前${-y}` : `${y}`;
}

/** 节点大小档位（CSS 类名） */
function sizeClass(size) {
  if (size >= 6) return 'cloud-node--xl';
  if (size >= 4) return 'cloud-node--lg';
  if (size >= 2) return 'cloud-node--md';
  return 'cloud-node--sm';
}

export function renderCloudPage() {
  const main = document.getElementById('app-main');
  if (!main) return;

  const countMap = countPoemsByAuthor();
  const rows = groupByDynasty(AUTHORS_META);
  const idx = authorIndex();
  const totalAuthors = rows.reduce((s, r) => s + r.authors.length, 0);

  // ── 朝代行 ──
  const rowEls = rows.map((row) => {
    const band = row.band;
    const nodes = row.authors.map((a) => {
      const count = countMap.get(a.name) || 1;
      const sz = sizeClass(count);
      const years = `${fmtYear(a.birth)}${a.death ? '–' + fmtYear(a.death) : ''}`;
      return `
        <button class="cloud-node ${sz}" data-name="${esc(a.name)}"
                style="--c:${band ? band.color : '#d8cdb8'}">
          <span class="cloud-node__name">${esc(a.name)}</span>
          <span class="cloud-node__count">${count} 首</span>
          <span class="cloud-node__years">${years}</span>
        </button>`;
    }).join('');
    return `
      <section class="cloud-row" data-dynasty="${esc(row.dynasty)}">
        <header class="cloud-row__head">
          <span class="cloud-row__chip" style="--c:${band ? band.color : '#d8cdb8'}">${esc(row.dynasty)}</span>
          <span class="cloud-row__range">${band ? band.start + '–' + band.end : ''}</span>
          <span class="cloud-row__count">${row.authors.length} 位</span>
        </header>
        <div class="cloud-row__grid">${nodes}</div>
      </section>`;
  }).join('');

  main.innerHTML = `
    <div class="content-wrap fade-in">
      <header class="page-head">
        <h1 class="page-head__title">诗云 · 时代长河</h1>
        <p class="page-head__greeting">${totalAuthors} 位诗人按朝代分行排布，自上而下为时间先后（先秦→清）。点击姓名查看其人其诗与交游。</p>
      </header>

      <div class="cloud-legend">
        <span class="cloud-legend__item"><i class="cloud-legend__line cloud-legend__line--friend"></i>交游挚友</span>
        <span class="cloud-legend__item"><i class="cloud-legend__line cloud-legend__line--school"></i>流派同道</span>
        <span class="cloud-legend__item"><i class="cloud-legend__line cloud-legend__line--mentor"></i>师承赏识</span>
        <span class="cloud-legend__item cloud-legend__item--hint">节点越大 = 入选诗越多</span>
      </div>

      <div class="cloud-rows">${rowEls}</div>

      <div class="cloud-detail" id="cloud-detail" hidden></div>
    </div>
  `;

  // ── 交互：点击节点选择作者 ──
  const detailEl = document.getElementById('cloud-detail');

  function showAuthor(name) {
    const a = idx.get(name);
    if (!a || !detailEl) return;

    // 高亮节点
    main.querySelectorAll('.cloud-node').forEach(b =>
      b.classList.toggle('cloud-node--active', b.dataset.name === name));

    const list = Array.from(poems.values())
      .filter(p => p.author === name)
      .sort((x, y) => (x.grade - y.grade) || ((x.sequence || 0) - (y.sequence || 0)));

    const rels = (a.relations || []).map(r => {
      const st = REL_STYLE[r.type] || REL_STYLE.friend;
      return `<span class="cloud-rel-tag" style="--c:${st.color}">${esc(r.to)}·${esc(r.label || st.label)}</span>`;
    }).join('');

    detailEl.hidden = false;
    detailEl.innerHTML = `
      <div class="cloud-detail__head">
        <div>
          <h2 class="cloud-detail__name">${esc(a.name)}</h2>
          <div class="cloud-detail__meta">${esc(a.dynasty)}代 · ${fmtYear(a.birth)}${a.death ? '–' + fmtYear(a.death) : ''}${a.approx ? '（约）' : ''} · 入选 ${list.length} 首</div>
        </div>
        <button class="btn btn--ghost btn--sm" id="cloud-detail-close">关闭</button>
      </div>
      <p class="cloud-detail__bio">${esc(a.bio || '')}</p>
      ${rels ? `<div class="cloud-detail__rels">${rels}</div>` : ''}
      <div class="cloud-detail__poems">
        ${list.map(p => `
          <a class="cloud-poem-chip" href="#/poem/${esc(p.id)}">
            <span class="cloud-poem-chip__title">${esc(p.title)}</span>
            <span class="cloud-poem-chip__grade">${p.grade}年级</span>
          </a>`).join('') || '<span class="cloud-detail__empty">暂无入选诗作</span>'}
      </div>
    `;
    document.getElementById('cloud-detail-close')?.addEventListener('click', () => {
      detailEl.hidden = true;
      main.querySelectorAll('.cloud-node--active').forEach(b => b.classList.remove('cloud-node--active'));
    });
    if (typeof detailEl.scrollIntoView === 'function') {
      detailEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  main.querySelectorAll('.cloud-node').forEach(b => {
    b.addEventListener('click', () => showAuthor(b.dataset.name));
  });
}