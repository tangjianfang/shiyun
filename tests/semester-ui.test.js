/**
 * 视觉验证（Vitest 版）：用 jsdom 直接加载渲染函数，验证 12 学期 timeline / 学期筛选行为。
 * 这是 npm run verify:ui 的 vitest 实现，CI 友好。
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { loadPoemMeta, poems, getPoemsBySemester, ALL_SEMESTERS } from '../src/js/data.js';
import { renderHome } from '../src/js/ui/home.js';
import { renderPoemList } from '../src/js/ui/learn.js';
import { renderPrintPage } from '../src/js/ui/print.js';
import { renderCloudPage } from '../src/js/ui/cloud.js';
import * as storage from '../src/js/storage.js';

describe('verify-ui · Home 12 学期时间线', () => {
  beforeEach(() => {
    document.body.innerHTML = '<main id="app-main"></main>';
    storage.setCurrentUserId?.('xiaoming');
    poems.clear();
    loadPoemMeta();
  });

  it('应渲染 12 张 sem-card（1 上 … 6 下）', () => {
    renderHome();
    const cards = document.querySelectorAll('.sem-card');
    expect(cards.length).toBe(12);
  });

  it('每张卡片的 label 应为 {年级} 年级 {上|下}册', () => {
    renderHome();
    const labels = [...document.querySelectorAll('.sem-card__label')].map(c => c.textContent.trim());
    const expected = [
      '1 年级 上册','1 年级 下册','2 年级 上册','2 年级 下册',
      '3 年级 上册','3 年级 下册','4 年级 上册','4 年级 下册',
      '5 年级 上册','5 年级 下册','6 年级 上册','6 年级 下册',
    ];
    for (const e of expected) {
      expect(labels, `缺 ${e}`).toContain(e);
    }
  });

  it('每张卡片应有进度条与计数', () => {
    renderHome();
    document.querySelectorAll('.sem-card').forEach(card => {
      expect(card.querySelector('.sem-card__progress .sem-card__bar'), '进度条缺失').toBeTruthy();
      expect(card.querySelector('.sem-card__count'), 'count 缺失').toBeTruthy();
    });
  });

  it('链接应包含 grade & sem 参数', () => {
    renderHome();
    const links = [...document.querySelectorAll('.sem-card')].map(a => a.getAttribute('href'));
    expect(links[0]).toBe('#/learn?grade=1&sem=%E4%B8%8A'); // 1 年级 上册
    expect(links[11]).toBe('#/learn?grade=6&sem=%E4%B8%8B'); // 6 年级 下册
  });
});

describe('verify-ui · Learn 学期筛选', () => {
  beforeEach(() => {
    document.body.innerHTML = '<main id="app-main"></main>';
    window.location.hash = '#/learn';
    poems.clear();
    loadPoemMeta();
  });

  it('默认状态：semester-chips group 应隐藏', () => {
    renderPoemList();
    const sem = document.querySelector('#semester-chips');
    expect(sem).toBeTruthy();
    expect(sem.hidden).toBe(true);
  });

  it('URL ?grade=3 应让 semester-chips group 显示', () => {
    window.location.hash = '#/learn?grade=3';
    renderPoemList();
    const sem = document.querySelector('#semester-chips');
    expect(sem.hidden).toBe(false);
  });

  it('URL ?grade=3&sem=下 → 列表过滤为 9 首', async () => {
    window.location.hash = '#/learn?grade=3&sem=下';
    renderPoemList();
    await new Promise(r => setTimeout(r, 150));
    const count = document.querySelector('#poem-list-count').textContent;
    expect(count).toMatch(/共 9 首/);
  });

  it('URL ?grade=1&sem=上 → 列表过滤为 6 首', async () => {
    window.location.hash = '#/learn?grade=1&sem=上';
    renderPoemList();
    await new Promise(r => setTimeout(r, 150));
    const count = document.querySelector('#poem-list-count').textContent;
    expect(count).toMatch(/共 6 首/);
  });

  it('URL ?grade=6&sem=下 → 列表过滤为 17 首', async () => {
    window.location.hash = '#/learn?grade=6&sem=下';
    renderPoemList();
    await new Promise(r => setTimeout(r, 150));
    const count = document.querySelector('#poem-list-count').textContent;
    expect(count).toMatch(/共 17 首/);
  });
});

describe('verify-ui · Print 学期筛选', () => {
  beforeEach(() => {
    document.body.innerHTML = '<main id="app-main"></main>';
    poems.clear();
    loadPoemMeta();
  });

  it('应渲染 semesters-chips 包含 上/下册 2 个 checkbox', () => {
    renderPrintPage(document.getElementById('app-main'));
    const cbs = document.querySelectorAll('#semesters-chips input[type=checkbox]');
    expect(cbs.length).toBe(2);
    const values = [...cbs].map(c => c.value);
    expect(values).toContain('上');
    expect(values).toContain('下');
  });

  it('semesters-chips 应有 全选/取消全选 按钮', () => {
    renderPrintPage(document.getElementById('app-main'));
    const all = document.querySelector('#semesters-chips [data-bulk-action="all"]');
    const none = document.querySelector('#semesters-chips [data-bulk-action="none"]');
    expect(all).toBeTruthy();
    expect(none).toBeTruthy();
  });

  it('勾 1 年级 + 上册 → 摘要=共 6 首诗', () => {
    renderPrintPage(document.getElementById('app-main'));
    document.querySelectorAll('#grades-chips input[type=checkbox]').forEach(cb => {
      cb.checked = (parseInt(cb.value, 10) === 1);
      cb.dispatchEvent(new Event('change', { bubbles: true }));
    });
    document.querySelectorAll('#semesters-chips input[type=checkbox]').forEach(cb => {
      cb.checked = (cb.value === '上');
      cb.dispatchEvent(new Event('change', { bubbles: true }));
    });
    const s = document.querySelector('#print-summary').textContent;
    expect(s).toMatch(/共 6 首诗/);
  });

  it('勾 6 年级 + 下册 → 摘要=共 17 首诗', () => {
    renderPrintPage(document.getElementById('app-main'));
    document.querySelectorAll('#grades-chips input[type=checkbox]').forEach(cb => {
      cb.checked = (parseInt(cb.value, 10) === 6);
      cb.dispatchEvent(new Event('change', { bubbles: true }));
    });
    document.querySelectorAll('#semesters-chips input[type=checkbox]').forEach(cb => {
      cb.checked = (cb.value === '下');
      cb.dispatchEvent(new Event('change', { bubbles: true }));
    });
    const s = document.querySelector('#print-summary').textContent;
    expect(s).toMatch(/共 17 首诗/);
  });

  it('只勾 上册（不限年级） → 应=51 首（6+7+7+7+9+9+9+11+9）', () => {
    renderPrintPage(document.getElementById('app-main'));
    document.querySelectorAll('#semesters-chips input[type=checkbox]').forEach(cb => {
      cb.checked = (cb.value === '上');
      cb.dispatchEvent(new Event('change', { bubbles: true }));
    });
    const s = document.querySelector('#print-summary').textContent;
    expect(s).toMatch(/共 51 首诗/);
  });

  it('只勾 下册（不限年级） → 应=61 首（7+7+7+9+10+11+17）', () => {
    renderPrintPage(document.getElementById('app-main'));
    document.querySelectorAll('#semesters-chips input[type=checkbox]').forEach(cb => {
      cb.checked = (cb.value === '下');
      cb.dispatchEvent(new Event('change', { bubbles: true }));
    });
    const s = document.querySelector('#print-summary').textContent;
    expect(s).toMatch(/共 61 首诗/);
  });
});

describe('verify-ui · Cloud 学期筛选', () => {
  beforeEach(() => {
    document.body.innerHTML = '<main id="app-main"></main>';
    poems.clear();
    loadPoemMeta();
  });

  it('应渲染学期 chip group（全部/上册/下册）', () => {
    renderCloudPage();
    const chips = document.querySelectorAll('#cloud-sem-chips .chip');
    expect(chips.length).toBe(3);
    const labels = [...chips].map(c => c.textContent.trim());
    expect(labels).toContain('全部学期');
    expect(labels).toContain('上册');
    expect(labels).toContain('下册');
  });

  it('默认「全部学期」应展示所有朝代行', () => {
    renderCloudPage();
    const rows = document.querySelectorAll('.cloud-row');
    expect(rows.length).toBeGreaterThan(0);
  });

  it('点击「下册」chip → 高亮 + 重新渲染', () => {
    renderCloudPage();
    const downBtn = [...document.querySelectorAll('#cloud-sem-chips .chip')].find(c => c.textContent.includes('下册'));
    downBtn.click();
    const active = document.querySelector('#cloud-sem-chips .chip--active');
    expect(active).toBeTruthy();
    expect(active.textContent).toContain('下册');
  });

  it('点击作者节点 → 详情面板按学期过滤诗作', () => {
    renderCloudPage();
    // 切到下册
    const downBtn = [...document.querySelectorAll('#cloud-sem-chips .chip')].find(c => c.textContent.includes('下册'));
    downBtn.click();
    // 找一个有下册诗的作者（先秦 诗经 采薇 / 李白等）— 但需要真实数据验证
    const nodes = document.querySelectorAll('.cloud-node');
    expect(nodes.length).toBeGreaterThan(0);
    nodes[0].click();
    const detail = document.getElementById('cloud-detail');
    expect(detail.hidden).toBe(false);
    expect(detail.innerHTML).toContain('下册');
  });
});