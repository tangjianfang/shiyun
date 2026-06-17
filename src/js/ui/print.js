/**
 * 打印模块占位（Task 21 完整实现）
 */

export function renderPrintPlaceholder() {
  setContent('<div class="placeholder">🖨️ 打印模块（Task 21 即将实现）</div>');
}

function setContent(html) {
  const main = document.getElementById('app-main');
  if (main) main.innerHTML = html;
}
