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