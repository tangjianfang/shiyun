import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createImageGenerator } from '../src/generator/image-generator.js';

function makePoems() {
  return [
    { id: 'g1-01', title: '静夜思', author: '李白', dynasty: '唐', grade: 1,
      type: '五言绝句', sequence: 1, content: ['床前明月光', '疑是地上霜'] },
    { id: 'g1-02', title: '咏鹅', author: '骆宾王', dynasty: '唐', grade: 1,
      type: '七言绝句', sequence: 2, content: ['鹅鹅鹅', '曲项向天歌'] },
  ];
}

function makeMockClient() {
  return {
    generateImage: vi.fn(async ({ prompt }) =>
      'data:image/png;base64,fake_' + prompt.slice(0, 10)
    ),
  };
}

describe('createImageGenerator', () => {
  beforeEach(() => localStorage.clear());

  it('pendingPoemIds 应返回尚未生成 image 的诗 ID', () => {
    const gen = createImageGenerator({
      client: makeMockClient(),
      poems: makePoems(),
      onProgress: () => {},
    });
    expect(gen.pendingPoemIds()).toEqual(['g1-01', 'g1-02']);
  });

  it('start() 应为每首诗调用 generateImage 并保存到 localStorage', async () => {
    const client = makeMockClient();
    const gen = createImageGenerator({ client, poems: makePoems(), onProgress: () => {}, concurrency: 2 });
    await gen.start();
    expect(client.generateImage).toHaveBeenCalledTimes(2);
    expect(localStorage.getItem('shiyun_gen_image_g1-01')).toMatch(/^data:image\/png;base64,/);
    expect(localStorage.getItem('shiyun_gen_image_g1-02')).toMatch(/^data:image\/png;base64,/);
  });

  it('已生成的应被跳过', async () => {
    localStorage.setItem('shiyun_gen_image_g1-01', 'data:image/png;base64,old');
    const client = makeMockClient();
    const gen = createImageGenerator({ client, poems: makePoems(), onProgress: () => {}, concurrency: 1 });
    await gen.start();
    expect(client.generateImage).toHaveBeenCalledTimes(1);
  });

  it('提示词应包含水墨画风格与诗主题', async () => {
    const client = makeMockClient();
    const gen = createImageGenerator({ client, poems: makePoems(), onProgress: () => {}, concurrency: 1 });
    await gen.start();
    const firstCall = client.generateImage.mock.calls[0][0];
    expect(firstCall.prompt).toContain('静夜思');
    expect(firstCall.prompt).toMatch(/ink-wash|水墨|sumi-e/i);
    expect(firstCall.size).toBe('1024x1024');
  });

  it('单首失败不应阻塞其他', async () => {
    const client = {
      generateImage: vi.fn(async ({ prompt }) => {
        if (prompt.includes('咏鹅')) throw new Error('DALL-E 服务异常');
        return 'data:image/png;base64,ok';
      }),
    };
    const events = [];
    const gen = createImageGenerator({
      client, poems: makePoems(),
      onProgress: (e) => events.push(e),
      concurrency: 1,
    });
    await gen.start();
    const fail = events.filter(e => e.status === 'fail');
    const success = events.filter(e => e.status === 'success');
    expect(fail.length).toBe(1);
    expect(success.length).toBe(1);
    expect(gen.stats().failed).toBe(1);
  });

  it('regenerateOne 应清掉旧记录后重新生成', async () => {
    localStorage.setItem('shiyun_gen_image_g1-01', 'data:image/png;base64,old');
    const client = makeMockClient();
    const gen = createImageGenerator({ client, poems: makePoems(), onProgress: () => {}, concurrency: 1 });
    await gen.regenerateOne('g1-01');
    expect(localStorage.getItem('shiyun_gen_image_g1-01')).not.toBe('data:image/png;base64,old');
    expect(client.generateImage).toHaveBeenCalledTimes(1);
  });

  it('cancel() 后未完成的应不再执行', async () => {
    const client = {
      generateImage: vi.fn(async () => {
        await new Promise(r => setTimeout(r, 50));
        return 'data:image/png;base64,ok';
      }),
    };
    const gen = createImageGenerator({ client, poems: makePoems(), onProgress: () => {}, concurrency: 1 });
    const p = gen.start();
    gen.cancel();
    await p;
    expect(client.generateImage.mock.calls.length).toBeLessThanOrEqual(1);
  });
});
