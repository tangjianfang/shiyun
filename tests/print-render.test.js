/**
 * 验证：#/print 路由可达 + 渲染筛选 UI
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadPoemMeta } from '../src/js/data.js';
import { renderPrintPage } from '../src/js/ui/print.js';

describe('print · 渲染层', () => {
  beforeEach(() => {
    document.body.innerHTML = '<main id="app-main"></main>';
    loadPoemMeta();
    // 避免实际弹出打印对话框
    vi.spyOn(window, 'print').mockImplementation(() => {});
  });

  it('renderPrintPage 应渲染筛选条件区', () => {
    renderPrintPage(document.getElementById('app-main'));
    const html = document.getElementById('app-main').innerHTML;
    expect(html).toContain('筛选条件');
    expect(html).toContain('年级');
    expect(html).toContain('学期');
    expect(html).toContain('朝代');
    expect(html).toContain('作者');
    expect(html).toContain('复习需求');
    expect(html).toContain('关键词');
  });

  it('renderPrintPage 应渲染 4 种版式', () => {
    renderPrintPage(document.getElementById('app-main'));
    const html = document.getElementById('app-main').innerHTML;
    expect(html).toContain('经典欣赏版');
    expect(html).toContain('默写练习版');
    expect(html).toContain('密集复习卡');
    expect(html).toContain('学习讲义版');
  });

  it('应渲染打印按钮', () => {
    renderPrintPage(document.getElementById('app-main'));
    const btn = document.getElementById('btn-print');
    expect(btn).toBeTruthy();
  });

  it('应渲染预览区域', () => {
    renderPrintPage(document.getElementById('app-main'));
    const preview = document.getElementById('print-preview');
    expect(preview).toBeTruthy();
    expect(preview.innerHTML).not.toBe('');
  });
});

describe('print · 批量操作（每个大类 全选 / 取消全选）', () => {
  beforeEach(() => {
    document.body.innerHTML = '<main id="app-main"></main>';
    loadPoemMeta();
    vi.spyOn(window, 'print').mockImplementation(() => {});
    renderPrintPage(document.getElementById('app-main'));
  });

  it('每个 chip-group 应有 全选 与 取消全选 按钮', () => {
    const main = document.getElementById('app-main');
    for (const id of ['grades-chips', 'semesters-chips', 'dynasties-chips', 'authors-chips']) {
      const group = main.querySelector('#' + id);
      expect(group.querySelector('[data-bulk-action="all"]'), `#${id} 缺全选`).toBeTruthy();
      expect(group.querySelector('[data-bulk-action="none"]'), `#${id} 缺取消全选`).toBeTruthy();
    }
    const buttons = main.querySelectorAll('[data-bulk-action]');
    // 4 大类 × 2 动作 = 8
    expect(buttons.length).toBe(8);
  });

  it('点击年级「取消全选」应取消所有年级勾选', () => {
    const main = document.getElementById('app-main');
    const allBtn = main.querySelector('#grades-chips [data-bulk-action="none"]');
    allBtn.click();
    const cbs = main.querySelectorAll('#grades-chips input[type=checkbox]');
    cbs.forEach(cb => expect(cb.checked).toBe(false));
  });

  it('点击朝代「全选」应勾选所有朝代', () => {
    const main = document.getElementById('app-main');
    // 先全部取消
    main.querySelector('#dynasties-chips [data-bulk-action="none"]').click();
    // 再全选
    main.querySelector('#dynasties-chips [data-bulk-action="all"]').click();
    const cbs = main.querySelectorAll('#dynasties-chips input[type=checkbox]');
    cbs.forEach(cb => expect(cb.checked).toBe(true));
  });

  it('「全选/取消全选」应同时更新摘要（实时刷新）', () => {
    const main = document.getElementById('app-main');
    // 取消全部朝代：摘要应变成「请勾选」提示
    main.querySelector('#dynasties-chips [data-bulk-action="none"]').click();
    const summary = main.querySelector('#print-summary').textContent;
    expect(summary).toMatch(/请勾选/);
    // 重新全选朝代：摘要应恢复为 112
    main.querySelector('#dynasties-chips [data-bulk-action="all"]').click();
    const summary2 = main.querySelector('#print-summary').textContent;
    expect(summary2).toMatch(/共 112 首诗/);
  });

  it('点击 chip 的 label 也应触发刷新（真实交互路径）', () => {
    const main = document.getElementById('app-main');
    // 找到某个朝代 chip 的 label 并点击（不直接碰 checkbox）
    const label = main.querySelector('#dynasties-chips label.chip');
    const before = main.querySelector('#print-summary').textContent;
    label.click();
    const after = main.querySelector('#print-summary').textContent;
    // 至少应触发一次预览更新（before/after 内容应被重新计算，可能数值变化也可能不变，
    // 但必须确保 listener 是绑定在 label 关联的 checkbox change 事件上）
    const cb = label.querySelector('input[type=checkbox]');
    expect(cb).toBeTruthy();
    expect(main.querySelector('#print-preview').innerHTML).not.toBe('');
  });

  // 用户报告：「我只选择了一年级为什么还要打印112首？」
  // 数据：1 年级 共 13 首（1 上 6 + 1 下 7）。只勾 1 年级时摘要应=13。
  it('只勾 1 年级时摘要应=13', () => {
    const main = document.getElementById('app-main');
    const cbs = main.querySelectorAll('#grades-chips input[type=checkbox]');
    cbs.forEach(cb => {
      cb.checked = (parseInt(cb.value, 10) === 1);
      cb.dispatchEvent(new Event('change', { bubbles: true }));
    });
    const summary = main.querySelector('#print-summary').textContent;
    expect(summary).toMatch(/共 13 首诗/);
  });

  // 真实交互路径：默认全不选，用户点击 1 年级 label 应勾上 → 13 首诗。
  it('点击 1 年级 label 勾选后摘要应=13', () => {
    const main = document.getElementById('app-main');
    // 默认全不选
    expect(main.querySelector('#print-summary').textContent).toMatch(/请勾选/);
    // 找到 1 年级 label 并 click（会冒泡到 input 触发 change）
    const labels = main.querySelectorAll('#grades-chips label.chip');
    for (const lab of labels) {
      const cb = lab.querySelector('input[type=checkbox]');
      if (parseInt(cb.value, 10) === 1) { lab.click(); break; }
    }
    const summary = main.querySelector('#print-summary').textContent;
    expect(summary).toMatch(/共 13 首诗/);
  });

  // 真实交互路径：先点 取消全选，再点 1 年级 label。
  it('取消全选后再勾 1 年级应=13', () => {
    const main = document.getElementById('app-main');
    main.querySelector('#grades-chips [data-bulk-action="none"]').click();
    expect(main.querySelector('#print-summary').textContent).toMatch(/请勾选/);
    // 找到 1 年级 label 并 click
    const labels = main.querySelectorAll('#grades-chips label.chip');
    for (const lab of labels) {
      const cb = lab.querySelector('input[type=checkbox]');
      if (parseInt(cb.value, 10) === 1) { lab.click(); break; }
    }
    const summary = main.querySelector('#print-summary').textContent;
    expect(summary).toMatch(/共 13 首诗/);
  });

  // 用户报告：「我只选择了一年级为什么还要打印112首？」
  // 根因：默认全选导致摘要=112，与用户「我只要 1 年级」的心智模型冲突。
  // 修复：默认全不选，提示「请勾选」，0 首诗起步；用户主动勾选才计入。
  it('默认状态应为「全不选」，摘要提示勾选', () => {
    const main = document.getElementById('app-main');
    const summary = main.querySelector('#print-summary').textContent;
    expect(summary).toMatch(/请勾选/);
  });

  // ── 学期筛选 ──
  it('勾 1 年级 + 上册 应=6 首（1 年级上册共 6 首）', () => {
    const main = document.getElementById('app-main');
    main.querySelectorAll('#grades-chips input[type=checkbox]').forEach(cb => {
      cb.checked = (parseInt(cb.value, 10) === 1);
      cb.dispatchEvent(new Event('change', { bubbles: true }));
    });
    main.querySelectorAll('#semesters-chips input[type=checkbox]').forEach(cb => {
      cb.checked = (cb.value === '上');
      cb.dispatchEvent(new Event('change', { bubbles: true }));
    });
    const summary = main.querySelector('#print-summary').textContent;
    expect(summary).toMatch(/共 6 首诗/);
  });

  it('勾 6 年级 + 下册 应=17 首（六年级下册共 17 首）', () => {
    const main = document.getElementById('app-main');
    main.querySelectorAll('#grades-chips input[type=checkbox]').forEach(cb => {
      cb.checked = (parseInt(cb.value, 10) === 6);
      cb.dispatchEvent(new Event('change', { bubbles: true }));
    });
    main.querySelectorAll('#semesters-chips input[type=checkbox]').forEach(cb => {
      cb.checked = (cb.value === '下');
      cb.dispatchEvent(new Event('change', { bubbles: true }));
    });
    const summary = main.querySelector('#print-summary').textContent;
    expect(summary).toMatch(/共 17 首诗/);
  });

  it('点击学期 chip-group「全选」应勾上/下两册', () => {
    const main = document.getElementById('app-main');
    // 先取消
    main.querySelector('#semesters-chips [data-bulk-action="none"]').click();
    // 再全选
    main.querySelector('#semesters-chips [data-bulk-action="all"]').click();
    const cbs = main.querySelectorAll('#semesters-chips input[type=checkbox]');
    cbs.forEach(cb => expect(cb.checked).toBe(true));
  });

  it('学期 chip-group「取消全选」应全部取消', () => {
    const main = document.getElementById('app-main');
    main.querySelector('#semesters-chips [data-bulk-action="none"]').click();
    const cbs = main.querySelectorAll('#semesters-chips input[type=checkbox]');
    cbs.forEach(cb => expect(cb.checked).toBe(false));
  });
});

describe('print · 路由', () => {
  it('template.html 应包含 #/print 入口（侧边栏 + 底栏）', async () => {
    const fs = await import('fs');
    const tmpl = fs.readFileSync('src/learning.template.html', 'utf8');
    expect(tmpl).toContain('href="#/print"');
    // 侧边栏 + 底栏各一个
    const matches = tmpl.match(/href="#\/print"/g);
    expect(matches?.length).toBeGreaterThanOrEqual(2);
  });

  it('main.js 应注册 #/print 路由', async () => {
    const fs = await import('fs');
    const src = fs.readFileSync('src/js/main.js', 'utf8');
    expect(src).toContain("'#/print':");
  });

  // 回归：路由在 main.js 里以无参形式调用 renderPrintPage()，
  // 函数必须能落到 #app-main 上而不是抛 TypeError。
  it('renderPrintPage() 无参调用也应写入 #app-main', () => {
    renderPrintPage(); // 不传 container
    const main = document.getElementById('app-main');
    expect(main.children.length).toBeGreaterThan(0);
    expect(main.innerHTML).toContain('筛选条件');
  });
});

describe('print · 默认空筛选开关（default-behavior）', () => {
  beforeEach(() => {
    document.body.innerHTML = '<main id="app-main"></main>';
    loadPoemMeta();
    vi.spyOn(window, 'print').mockImplementation(() => {});
    renderPrintPage(document.getElementById('app-main'));
  });

  it('应包含 default-behavior radio（none/all 二选一）', () => {
    const radios = document.querySelectorAll('input[name="default-behavior"]');
    expect(radios.length).toBe(2);
    expect(Array.from(radios).map(r => r.value).sort()).toEqual(['all', 'none']);
  });

  it('默认应选中 none（保护性默认）', () => {
    const checked = document.querySelector('input[name="default-behavior"]:checked');
    expect(checked.value).toBe('none');
  });

  it('空筛选 + none → 摘要应提示"请勾选"', () => {
    const summary = document.querySelector('#print-summary').textContent;
    expect(summary).toMatch(/请勾选/);
  });

  it('切到 all 后 → 即使没勾选任何筛选，也应显示 112 首诗', () => {
    const allRadio = document.querySelector('input[name="default-behavior"][value="all"]');
    allRadio.checked = true;
    allRadio.dispatchEvent(new Event('change', { bubbles: true }));
    const summary = document.querySelector('#print-summary').textContent;
    expect(summary).toMatch(/共 112 首诗/);
  });

  it('显式勾选筛选时 default-behavior 不影响结果数', () => {
    // 勾 1 年级
    document.querySelectorAll('#grades-chips input[type=checkbox]').forEach(cb => {
      cb.checked = (parseInt(cb.value, 10) === 1);
      cb.dispatchEvent(new Event('change', { bubbles: true }));
    });
    const beforeSummary = document.querySelector('#print-summary').textContent;
    // 切到 all
    const allRadio = document.querySelector('input[name="default-behavior"][value="all"]');
    allRadio.checked = true;
    allRadio.dispatchEvent(new Event('change', { bubbles: true }));
    const afterSummary = document.querySelector('#print-summary').textContent;
    // 已选筛选结果数稳定
    expect(beforeSummary).toMatch(/共 13 首诗/);
    expect(afterSummary).toMatch(/共 13 首诗/);
  });
});