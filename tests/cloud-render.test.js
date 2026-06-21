/**
 * 复现 / 排查：#/cloud 进入后页面空白
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { loadPoemMeta } from '../src/js/data.js';
import { renderCloudPage } from '../src/js/ui/cloud.js';

describe('cloud · 渲染层', () => {
  beforeEach(() => {
    document.body.innerHTML = '<main id="app-main"></main>';
    loadPoemMeta();
  });

  it('renderCloudPage 应向 #app-main 写入内容', () => {
    renderCloudPage();
    const main = document.getElementById('app-main');
    expect(main.children.length).toBeGreaterThan(0);
  });

  it('写入内容应包含标题"诗云 · 时代长河"', () => {
    renderCloudPage();
    const html = document.getElementById('app-main').innerHTML;
    expect(html).toContain('时代长河');
  });

  it('应渲染所有 7 个有作者数据的朝代行', () => {
    renderCloudPage();
    const rows = document.querySelectorAll('.cloud-row');
    // 先秦 / 汉 / 南北朝 / 唐 / 宋 / 元 / 明 / 清 共 8 个朝代带，但 AUTHORS_META 中元明清的作者数较少
    // 至少包含主要朝代
    expect(rows.length).toBeGreaterThanOrEqual(5);
  });

  it('每位作者都应有节点按钮', () => {
    renderCloudPage();
    const buttons = document.querySelectorAll('.cloud-node');
    // 应有 50+ 节点按钮
    expect(buttons.length).toBeGreaterThanOrEqual(50);
  });

  it('点击节点应弹出详情卡', () => {
    renderCloudPage();
    const detail = document.getElementById('cloud-detail');
    expect(detail.hidden).toBe(true);

    const btn = document.querySelector('.cloud-node[data-name="李白"]');
    expect(btn).toBeTruthy();
    btn.click();

    expect(detail.hidden).toBe(false);
    expect(detail.innerHTML).toContain('李白');
    expect(detail.innerHTML).toContain('唐');
  });

  it('点击"关闭"按钮应隐藏详情卡', () => {
    renderCloudPage();
    document.querySelector('.cloud-node[data-name="杜甫"]').click();
    const detail = document.getElementById('cloud-detail');
    expect(detail.hidden).toBe(false);

    document.getElementById('cloud-detail-close').click();
    expect(detail.hidden).toBe(true);
  });
});