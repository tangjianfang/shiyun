/**
 * 复习模块占位（Task 19 完整实现）
 */

export function renderReviewPlaceholder() {
  setContent('<div class="placeholder">🔄 复习模块（Task 19 即将实现）</div>');
}

function setContent(html) {
  const main = document.getElementById('app-main');
  if (main) main.innerHTML = html;
}
