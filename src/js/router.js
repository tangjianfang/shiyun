/**
 * 简易 Hash 路由
 * - 支持静态路由 '#/learn'
 * - 支持参数路由 '#/poem/:id'，匹配时把参数对象传给 handler
 * - hashchange 事件触发路由
 */

export function createRouter(routes) {
  const router = {
    routes,
    start() {
      window.addEventListener('hashchange', () => this.handleRoute());
      return this;
    },
    handleRoute() {
      const hash = getCurrentRoute();
      // 1. 优先匹配参数路由
      for (const pattern in this.routes) {
        if (pattern.includes(':')) {
          const params = matchRoute(pattern, hash);
          if (params) {
            try { this.routes[pattern](params); } catch (e) { console.error('路由 handler 错误:', e); }
            highlightActiveTab(hash);
            return;
          }
        }
      }
      // 2. 精确匹配
      const handler = this.routes[hash];
      if (handler) {
        try { handler(); } catch (e) { console.error('路由 handler 错误:', e); }
      } else {
        console.warn('未匹配路由:', hash);
        const fallback = this.routes['#/'];
        if (fallback) fallback();
      }
      highlightActiveTab(hash);
    },
  };
  return router;
}

/** 编程式导航 */
export function navigate(hash) {
  if (!hash.startsWith('#')) hash = '#' + hash;
  if (window.location.hash === hash) {
    // 强制触发
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  } else {
    window.location.hash = hash;
  }
}

/** 获取当前 hash，没有则返回 '#/' */
export function getCurrentRoute() {
  return window.location.hash || '#/';
}

/** 把 :param 模式转成正则 */
function patternToRegex(pattern) {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
  const regexStr = escaped.replace(/:(\w+)/g, '(?<$1>[^/]+)');
  return new RegExp('^' + regexStr + '$');
}

/** 匹配模式，返回参数对象或 null（参数值自动 URL decode） */
function matchRoute(pattern, hash) {
  const regex = patternToRegex(pattern);
  const m = hash.match(regex);
  if (!m) return null;
  // URL 解码参数（hash 中的中文/特殊字符以 %E4%B8%8A 形式编码）
  const groups = m.groups || {};
  const decoded = {};
  for (const k of Object.keys(groups)) {
    try {
      decoded[k] = decodeURIComponent(groups[k]);
    } catch {
      decoded[k] = groups[k];  // 解码失败则保留原值
    }
  }
  return decoded;
}

/** 高亮底部 tab */
function highlightActiveTab(hash) {
  const items = document.querySelectorAll('.tab-bar__item');
  items.forEach(item => {
    const href = item.getAttribute('href') || '';
    let active = false;
    if (href === '#/' && hash === '#/') active = true;
    else if (href !== '#/' && hash.startsWith(href)) active = true;
    else if (hash.startsWith('#/poem/') && href === '#/learn') active = true;
    item.classList.toggle('tab-bar__item--active', active);
  });
}
