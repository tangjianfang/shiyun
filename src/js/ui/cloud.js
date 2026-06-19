/**
 * 诗云 · 时代关联可视化（“诗云”）
 *
 * 把 62 位作者按年代排成一条流动的时间长河，
 * 每位作者是一朵漂浮的“云”，云的大小 = 入选诗作数量；
 * 云与云之间以连线表示师承 / 交游 / 流派关联。
 * 呼应“诗云”之名：云端空间，时代流转，诗人星罗。
 */

import { AUTHORS_META, DYNASTY_BANDS, authorYear, authorIndex } from '../../data/authors-meta.js';
import { poems } from '../data.js';
import { navigate } from '../router.js';
import { esc } from './components.js';

// 关联线样式
const REL_STYLE = {
  friend: { color: 'var(--cinnabar-500)', label: '交游挚友', dash: '' },
  school: { color: 'var(--indigo-600)',   label: '流派同道', dash: '6 5' },
  mentor: { color: 'var(--jade-600)',     label: '师承赏识', dash: '2 5' },
};

const X_STEP = 104;     // 相邻作者横向间距
const MARGIN_X = 80;    // 左右留白
const MID_Y = 250;      // 纵向中线
const AMP = 130;        // 纵向波动幅度
const TOP_PAD = 70;     // 顶部朝代带高度

/** 统计每位作者入选诗作数量 */
function countPoemsByAuthor() {
  const map = new Map();
  for (const p of poems.values()) {
    map.set(p.author, (map.get(p.author) || 0) + 1);
  }
  return map;
}

/**
 * 计算每位作者的布局坐标（纯函数，可测试）。
 * 返回 [{ name, x, y, size, year, author }]，已按年代排序。
 */
export function layoutAuthors(authors, countMap = new Map()) {
  const sorted = [...authors].sort((a, b) => authorYear(a) - authorYear(b));
  return sorted.map((a, i) => {
    const count = countMap.get(a.name) || 1;
    return {
      name: a.name,
      author: a,
      year: authorYear(a),
      x: MARGIN_X + i * X_STEP,
      y: MID_Y + AMP * Math.sin(i * 0.62),
      size: count,
    };
  });
}

/** 年份格式化：负数为公元前 */
function fmtYear(y) {
  if (typeof y !== 'number') return '';
  return y < 0 ? `前${-y}` : `${y}`;
}

function nodeRadius(size) {
  return 24 + Math.min(size, 8) * 3.5;  // 24~52
}

/** 生成两点之间的曲线路径 */
function linkPath(a, b) {
  const mx = (a.x + b.x) / 2;
  const my = Math.min(a.y, b.y) - 60;  // 向上拱起，像云间的牵引
  return `M ${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}`;
}

export function renderCloudPage() {
  const main = document.getElementById('app-main');
  if (!main) return;

  const countMap = countPoemsByAuthor();
  const nodes = layoutAuthors(AUTHORS_META, countMap);
  const posByName = new Map(nodes.map(n => [n.name, n]));
  const idx = authorIndex();

  const svgW = MARGIN_X * 2 + (nodes.length - 1) * X_STEP;
  const svgH = MID_Y + AMP + 120;

  // ── 关联连线 ──
  const links = [];
  for (const a of AUTHORS_META) {
    const from = posByName.get(a.name);
    if (!from || !Array.isArray(a.relations)) continue;
    for (const rel of a.relations) {
      const to = posByName.get(rel.to);
      if (!to) continue;
      const st = REL_STYLE[rel.type] || REL_STYLE.friend;
      links.push(`
        <path class="cloud-link" d="${linkPath(from, to)}"
              fill="none" stroke="${st.color}" stroke-width="1.6"
              stroke-dasharray="${st.dash}" stroke-linecap="round"
              data-from="${esc(a.name)}" data-to="${esc(rel.to)}">
          <title>${esc(a.name)} — ${esc(rel.to)}：${esc(rel.label || st.label)}</title>
        </path>`);
    }
  }

  // ── 朝代时间带（顶部标签）：按出现的朝代分段 ──
  const dynastyMarkers = [];
  const seen = new Set();
  nodes.forEach((n) => {
    const dyn = n.author.dynasty;
    if (seen.has(dyn)) return;
    seen.add(dyn);
    const band = DYNASTY_BANDS.find(b => b.name === dyn);
    const color = band ? band.color : 'var(--ink-300)';
    dynastyMarkers.push(`
      <g transform="translate(${n.x}, 24)">
        <circle r="5" fill="${color}"></circle>
        <text x="0" y="-12" text-anchor="middle" class="cloud-era">${esc(dyn)}</text>
      </g>`);
  });

  // ── 作者云朵节点 ──
  const nodeEls = nodes.map((n, i) => {
    const r = nodeRadius(n.size);
    const band = DYNASTY_BANDS.find(b => b.name === n.author.dynasty);
    const fill = band ? band.color : '#d8cdb8';
    return `
      <g class="cloud-node" transform="translate(${n.x}, ${n.y})"
         data-name="${esc(n.name)}" tabindex="0" role="button"
         aria-label="${esc(n.name)}，${esc(n.author.dynasty)}代，入选 ${n.size} 首"
         style="--i:${i}">
        <circle class="cloud-node__halo" r="${r + 8}" fill="${fill}" opacity="0.18"></circle>
        <circle class="cloud-node__body" r="${r}" fill="${fill}"></circle>
        <text class="cloud-node__name" y="2" text-anchor="middle">${esc(n.name)}</text>
        <text class="cloud-node__year" y="${r + 16}" text-anchor="middle">${fmtYear(n.author.birth)}${n.author.death ? '–' + fmtYear(n.author.death) : ''}</text>
      </g>`;
  });

  main.innerHTML = `
    <div class="content-wrap fade-in">
      <header class="page-head">
        <h1 class="page-head__title">诗云 · 时代长河</h1>
        <p class="page-head__greeting">62 位诗人沿时间漂浮成云，连线见师承与交游。左右滑动，点击云朵看其人其诗。</p>
      </header>

      <div class="cloud-legend">
        <span class="cloud-legend__item"><i class="cloud-legend__line cloud-legend__line--friend"></i>交游挚友</span>
        <span class="cloud-legend__item"><i class="cloud-legend__line cloud-legend__line--school"></i>流派同道</span>
        <span class="cloud-legend__item"><i class="cloud-legend__line cloud-legend__line--mentor"></i>师承赏识</span>
        <span class="cloud-legend__item cloud-legend__item--hint">云越大 = 入选诗越多</span>
      </div>

      <div class="cloud-scroll" id="cloud-scroll">
        <svg class="cloud-svg" width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}"
             xmlns="http://www.w3.org/2000/svg" role="img" aria-label="诗人时代关联图">
          <g class="cloud-baseline">
            <line x1="${MARGIN_X}" y1="${TOP_PAD - 26}" x2="${svgW - MARGIN_X}" y2="${TOP_PAD - 26}"
                  stroke="var(--paper-edge)" stroke-width="1" stroke-dasharray="2 6"></line>
          </g>
          <g class="cloud-links">${links.join('')}</g>
          <g class="cloud-eras">${dynastyMarkers.join('')}</g>
          <g class="cloud-nodes">${nodeEls.join('')}</g>
        </svg>
      </div>

      <div class="cloud-detail" id="cloud-detail" hidden></div>
    </div>
  `;

  // ── 交互：点击/键盘选择作者 ──
  const detailEl = document.getElementById('cloud-detail');
  const svg = main.querySelector('.cloud-svg');

  function showAuthor(name) {
    const a = idx.get(name);
    if (!a || !detailEl) return;

    // 高亮当前节点与相关连线
    svg.querySelectorAll('.cloud-node').forEach(g =>
      g.classList.toggle('cloud-node--active', g.dataset.name === name));
    svg.querySelectorAll('.cloud-link').forEach(p => {
      const on = p.dataset.from === name || p.dataset.to === name;
      p.classList.toggle('cloud-link--active', on);
    });

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
      svg.querySelectorAll('.cloud-node--active').forEach(g => g.classList.remove('cloud-node--active'));
      svg.querySelectorAll('.cloud-link--active').forEach(p => p.classList.remove('cloud-link--active'));
    });
    detailEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  svg.querySelectorAll('.cloud-node').forEach(g => {
    g.addEventListener('click', () => showAuthor(g.dataset.name));
    g.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showAuthor(g.dataset.name); }
    });
  });
}
