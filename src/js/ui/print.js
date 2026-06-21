/**
 * 诗云 · 打印 UI 入口
 *
 * 流程：进入打印页 → 设置筛选条件 → 选择版式 → 预览 → window.print()
 */

import { loadPoemMeta, getAllDynasties, getAllAuthors, getAllPoems } from '../data.js';
import { filterPoems, attachUserState, groupForPrint, renderPrintHtml, triggerPrint, FORMAT_DEFS, REVIEW_FILTERS } from '../print.js';

const GRADES = [1, 2, 3, 4, 5, 6];
const SEMESTERS = ['上', '下'];

export function renderPrintPage(container) {
  const root = container || document.getElementById('app-main');
  if (!root) return;

  loadPoemMeta();
  const poems = getAllPoems().map(p => ({ ...p }));
  const poemsWithState = attachUserState(poems);

  const dynasties = getAllDynasties();
  const authors = getAllAuthors();

  root.innerHTML = `
    <div class="print-page">
      <h2>🖨️ 打印</h2>

      <section class="card filter-bar no-print">
        <h3>筛选条件</h3>
        <div class="filter-grid">
          <div class="filter-group">
            <label>年级</label>
            <div class="chip-group" id="grades-chips" data-bulk>
              <div class="bulk-actions">
                <button type="button" class="btn btn--ghost btn--sm" data-bulk-action="all">全选</button>
                <button type="button" class="btn btn--ghost btn--sm" data-bulk-action="none">取消全选</button>
              </div>
              ${GRADES.map(g => `<label class="chip"><input type="checkbox" value="${g}">${g} 年级</label>`).join('')}
            </div>
          </div>
          <div class="filter-group">
            <label>学期（上下册）</label>
            <div class="chip-group" id="semesters-chips" data-bulk>
              <div class="bulk-actions">
                <button type="button" class="btn btn--ghost btn--sm" data-bulk-action="all">全选</button>
                <button type="button" class="btn btn--ghost btn--sm" data-bulk-action="none">取消全选</button>
              </div>
              ${SEMESTERS.map(s => `<label class="chip"><input type="checkbox" value="${escapeHtml(s)}">${s === '上' ? '上册' : '下册'}</label>`).join('')}
            </div>
          </div>
          <div class="filter-group">
            <label>朝代</label>
            <div class="chip-group" id="dynasties-chips" data-bulk>
              <div class="bulk-actions">
                <button type="button" class="btn btn--ghost btn--sm" data-bulk-action="all">全选</button>
                <button type="button" class="btn btn--ghost btn--sm" data-bulk-action="none">取消全选</button>
              </div>
              ${dynasties.map(d => `<label class="chip"><input type="checkbox" value="${escapeHtml(d)}">${escapeHtml(d)}</label>`).join('')}
            </div>
          </div>
          <div class="filter-group">
            <label>作者</label>
            <div class="chip-group scrollable" id="authors-chips" data-bulk>
              <div class="bulk-actions">
                <button type="button" class="btn btn--ghost btn--sm" data-bulk-action="all">全选</button>
                <button type="button" class="btn btn--ghost btn--sm" data-bulk-action="none">取消全选</button>
              </div>
              ${authors.map(a => `<label class="chip"><input type="checkbox" value="${escapeHtml(a)}">${escapeHtml(a)}</label>`).join('')}
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
    const criteria = readCriteria(root);
    const formatId = root.querySelector('input[name="format"]:checked')?.value || 'dense';
    const filtered = filterPoems(poemsWithState, criteria);
    const groups = groupForPrint(filtered, formatId);
    const summary = root.querySelector('#print-summary');
    const totalSelected =
      (criteria.grades?.length || 0) +
      (criteria.semesters?.length || 0) +
      (criteria.dynasties?.length || 0) +
      (criteria.authors?.length || 0) +
      (criteria.keyword?.trim() ? 1 : 0) +
      (criteria.reviewFilter && criteria.reviewFilter !== 'all' ? 1 : 0);
    summary.textContent = totalSelected === 0
      ? '请勾选要打印的诗（共 112 首可选）'
      : `共 ${filtered.length} 首诗 / ${groups.length} 页`;
    const preview = root.querySelector('#print-preview');
    if (groups.length === 0) {
      preview.innerHTML = totalSelected === 0
        ? '<p class="empty-tip">还没有勾选任何诗。点击各类的「全选」可一次性选中该类全部，或单个点击喜欢的诗。</p>'
        : '<p class="empty-tip">没有符合条件的诗</p>';
      return;
    }
    preview.innerHTML = renderPrintHtml(groups, formatId);
  };

  root.querySelectorAll('input, select').forEach(el => {
    el.addEventListener('change', updatePreview);
    if (el.type === 'text') el.addEventListener('input', updatePreview);
  });

  // 批量操作：每个 chip-group 内的 [data-bulk-action] 按钮
  root.addEventListener('click', (ev) => {
    const btn = ev.target.closest('[data-bulk-action]');
    if (!btn || !root.contains(btn)) return;
    const group = btn.closest('.chip-group');
    if (!group) return;
    const checked = btn.dataset.bulkAction === 'all';
    group.querySelectorAll('input[type=checkbox]').forEach(cb => {
      cb.checked = checked;
    });
    updatePreview();
  });

  root.querySelector('#btn-print').addEventListener('click', () => {
    triggerPrint(root);
  });

  updatePreview();
}

function readCriteria(container) {
  const grades = Array.from(container.querySelectorAll('#grades-chips input:checked')).map(i => parseInt(i.value, 10));
  const semesters = Array.from(container.querySelectorAll('#semesters-chips input:checked')).map(i => i.value);
  const dynasties = Array.from(container.querySelectorAll('#dynasties-chips input:checked')).map(i => i.value);
  const authors = Array.from(container.querySelectorAll('#authors-chips input:checked')).map(i => i.value);
  const reviewFilter = container.querySelector('#review-filter').value;
  const keyword = container.querySelector('#keyword').value;
  return { grades, semesters, dynasties, authors, reviewFilter, keyword };
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
