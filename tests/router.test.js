import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createRouter, navigate, getCurrentRoute } from '../src/js/router.js';

describe('router', () => {
  beforeEach(() => {
    window.location.hash = '';
  });

  it('createRouter 应注册路由表', () => {
    const routes = { '#/': () => 'home' };
    const router = createRouter(routes);
    expect(router.routes).toEqual(routes);
  });

  it('navigate 应更新 window.location.hash', () => {
    navigate('#/learn');
    expect(window.location.hash).toBe('#/learn');
  });

  it('navigate 支持不带 # 的入参', () => {
    navigate('/quiz');
    expect(window.location.hash).toBe('#/quiz');
  });

  it('getCurrentRoute 应返回当前 hash（无 hash 时默认为 #/）', () => {
    window.location.hash = '';
    expect(getCurrentRoute()).toBe('#/');
    window.location.hash = '#/learn';
    expect(getCurrentRoute()).toBe('#/learn');
  });

  it('handleRoute 应匹配参数路由并传参', () => {
    const handler = vi.fn();
    const router = createRouter({ '#/poem/:id': handler });
    window.location.hash = '#/poem/g1-01';
    router.handleRoute();
    expect(handler).toHaveBeenCalledWith({ id: 'g1-01' });
  });

  it('handleRoute 未匹配时应回退到 #/', () => {
    const home = vi.fn();
    const router = createRouter({ '#/': home });
    window.location.hash = '#/nope';
    router.handleRoute();
    expect(home).toHaveBeenCalled();
  });

  it('参数路由应自动 URL decode 中文 ID（如 g1-%E4%B8%8A-01 → g1-上-01）', () => {
    const handler = vi.fn();
    const router = createRouter({ '#/poem/:id': handler });
    // 模拟浏览器把 hash 中的中文字符编码为 %E4%B8%8A（部分浏览器/Safari 直接返回编码形态）
    window.location.hash = '#/poem/g1-%E4%B8%8A-01';
    router.handleRoute();
    expect(handler).toHaveBeenCalledWith({ id: 'g1-上-01' });
  });

  it('参数路由应接受未编码的原始中文 ID（Hash 已解码的浏览器）', () => {
    const handler = vi.fn();
    const router = createRouter({ '#/poem/:id': handler });
    window.location.hash = '#/poem/g1-上-01';
    router.handleRoute();
    expect(handler).toHaveBeenCalledWith({ id: 'g1-上-01' });
  });

  it('参数路由在解码失败时应回退到原始字符串', () => {
    const handler = vi.fn();
    const router = createRouter({ '#/poem/:id': handler });
    // %ZZ 是非法 percent-encoded 序列，decodeURIComponent 会抛 URIError
    window.location.hash = '#/poem/bad-%ZZ';
    router.handleRoute();
    expect(handler).toHaveBeenCalledWith({ id: 'bad-%ZZ' });
  });
});
