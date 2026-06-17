/**
 * 考核模块占位（Task 15-18 完整实现）
 */

export function renderQuizPlaceholder() {
  setContent('<div class="placeholder">✏️ 考核模块（Task 15-18 即将实现）</div>');
}

function setContent(html) {
  const main = document.getElementById('app-main');
  if (main) main.innerHTML = html;
}
