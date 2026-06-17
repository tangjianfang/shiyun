/**
 * 诗云 · 打印 UI 入口
 *
 * 流程：进入打印页 → 设置筛选条件 → 选择版式 → 预览 → window.print()
 */

import { loadPoemMeta, getAllDynasties, getAllAuthors, getAllPoems } from '../data.js';
import { filterPoems, attachUserState, groupForPrint, renderPrintHtml, triggerPrint, FORMAT_DEFS, REVIEW_FILTERS } from '../print.js';

const GRADES = [1, 2, 3, 4, 5, 6];

export function renderPrintPage(container) {
  loadPoemMeta();
  const poems = getAllPoems().map(p => ({ ...p }));
  const poemsWithState = attachUserState(poems);

  const dynasties = getAllDynasties();
  const authors = getAllAuthors();

  container.innerHTML = `
    <div class="print-page">
      <h2>🖨️ 打印</h2>

      <section class="card filter-bar no-print">
        <h3>筛选条件</h3>
        <div class="filter-grid">
          <div class="filter-group">
            <label>年级</label>
            <div class="chip-group" id="grades-chips">
              ${GRADES.map(g => `<label class="chip"><input type="checkbox" value="${g}" checked>${g} 年级</label>`).join('')}
            </div>
          </div>
          <div class="filter-group">
            <label>朝代</label>
            <div class="chip-group" id="dynasties-chips">
              ${dynasties.map(d => `<label class="chip"><input type="checkbox" value="${escapeHtml(d)}" checked>${escapeHtml(d)}</label>`).join('')}
            </div>
          </div>
          <div class="filter-group">
            <label>作者</label>
            <div class="chip-group scrollable" id="authors-chips">
              ${authors.map(a => `<label class="chip"><input type="checkbox" value="${escapeHtml(a)}" checked>${escapeHtml(a)}</label>`).join('')}
            </div>
          </div>
          <div class="filter-group">
            <label>复习需求</label>
            <select id="review-filter">
              ${REVIEW_FILTERS.map(f => `<option value="${f.id}">${f.name}</option>`).join('')}
            </select>
          </div>
          <div class="filter-group">
            <label>关键词</label>
            <input type="text" id="keyword" placeholder="标题或作者">
          </div>
        </div>
      </section>

      <section class="card format-selector no-print">
        <h3>版式</h3>
        <div class="format-grid">
          ${FORMAT_DEFS.map(f => `
            <label class="format-card">
              <input type="radio" name="format" value="${f.id}" ${f.id === 'dense' ? 'checked' : ''}>
              <div class="format-name">${f.name}</div>
              <div class="format-desc">${f.desc}</div>
              <div class="format-meta">${f.perPage} 首/页</div>
            </label>
          `).join('')}
        </div>
      </section>

      <section class="print-actions no-print">
        <span id="print-summary" class="summary"></span>
        <button class="btn btn--primary" id="btn-print">🖨️ 打印 / 另存为 PDF</button>
      </section>

      <section class="print-preview" id="print-preview">
        <p class="empty-tip">请选择筛选条件和版式</p>
      </section>
    </div>
  `;

  const updatePreview = () => {
    const criteria = readCriteria(container);
    const formatId = container.querySelector('input[name="format"]:checked')?.value || 'dense';
    const filtered = filterPoems(poemsWithState, criteria);
    const groups = groupForPrint(filtered, formatId);
    const summary = container.querySelector('#print-summary');
    summary.textContent = `共 ${filtered.length} 首诗 / ${groups.length} 页`;
    const preview = container.querySelector('#print-preview');
    if (groups.length === 0) {
      preview.innerHTML = '<p class="empty-tip">没有符合条件的诗</p>';
      return;
    }
    preview.innerHTML = renderPrintHtml(groups, formatId);
  };

  container.querySelectorAll('input, select').forEach(el => {
    el.addEventListener('change', updatePreview);
    if (el.type === 'text') el.addEventListener('input', updatePreview);
  });

  container.querySelector('#btn-print').addEventListener('click', () => {
    triggerPrint(container);
  });

  updatePreview();
}

function readCriteria(container) {
  const grades = Array.from(container.querySelectorAll('#grades-chips input:checked')).map(i => parseInt(i.value, 10));
  const dynasties = Array.from(container.querySelectorAll('#dynasties-chips input:checked')).map(i => i.value);
  const authors = Array.from(container.querySelectorAll('#authors-chips input:checked')).map(i => i.value);
  const reviewFilter = container.querySelector('#review-filter').value;
  const keyword = container.querySelector('#keyword').value;
  return { grades, dynasties, authors, reviewFilter, keyword };
}

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

export function renderPrintPlaceholder() {
  const main = document.getElementById('app-main');
  if (main) renderPrintPage(main);
}

export default { renderPrintPage };
