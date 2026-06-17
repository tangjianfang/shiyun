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
});
