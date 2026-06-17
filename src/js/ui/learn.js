/**
 * 学习模块占位（Task 13/14 完整实现）
 */

export function renderLearnPlaceholder() {
  setContent('<div class="placeholder">📚 学习模块（Task 13/14 即将实现）</div>');
}

export function renderPoemDetail(params) {
  setContent(`<div class="placeholder">诗词详情：${params.id}（Task 13 即将实现）</div>`);
}

function setContent(html) {
  const main = document.getElementById('app-main');
  if (main) main.innerHTML = html;
}
