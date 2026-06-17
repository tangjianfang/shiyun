/**
 * 进度模块占位（Task 20 完整实现）
 */

export function renderProgressPlaceholder() {
  setContent('<div class="placeholder">📊 进度模块（Task 20 即将实现）</div>');
}

function setContent(html) {
  const main = document.getElementById('app-main');
  if (main) main.innerHTML = html;
}
