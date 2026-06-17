import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createAudioGenerator } from '../src/generator/audio-generator.js';

function makePoems() {
  return [
    { id: 'g1-01', title: '静夜思', author: '李白', dynasty: '唐', grade: 1,
      type: '五言绝句', sequence: 1, content: ['床前明月光', '疑是地上霜', '举头望明月', '低头思故乡'] },
    { id: 'g1-02', title: '咏鹅', author: '骆宾王', dynasty: '唐', grade: 1,
      type: '七言绝句', sequence: 2, content: ['鹅鹅鹅', '曲项向天歌', '白毛浮绿水', '红掌拨清波'] },
  ];
}

function makeMockClient() {
  return {
    generateAudio: vi.fn(async ({ text }) =>
      'data:audio/mp3;base64,fake_' + text.length
    ),
  };
}

describe('createAudioGenerator', () => {
  beforeEach(() => localStorage.clear());

  it('默认 voice = alloy、speed = 0.85', async () => {
    const client = makeMockClient();
    const gen = createAudioGenerator({ client, poems: makePoems(), concurrency: 1 });
    await gen.regenerateOne('g1-01');
    const call = client.generateAudio.mock.calls[0][0];
    expect(call.voice).toBe('alloy');
    expect(call.speed).toBeCloseTo(0.85);
  });

  it('可自定义 voice 与 speed', async () => {
    const client = makeMockClient();
    const gen = createAudioGenerator({
      client, poems: makePoems(), concurrency: 1,
      voice: 'shimmer', speed: 0.95,
    });
    await gen.regenerateOne('g1-01');
    const call = client.generateAudio.mock.calls[0][0];
    expect(call.voice).toBe('shimmer');
    expect(call.speed).toBeCloseTo(0.95);
  });

  it('朗读文本应为诗的原文（多行用逗号连接 + 句号结尾）', async () => {
    const client = makeMockClient();
    const gen = createAudioGenerator({ client, poems: makePoems(), concurrency: 1 });
    await gen.regenerateOne('g1-01');
    const call = client.generateAudio.mock.calls[0][0];
    expect(call.text).toBe('床前明月光，疑是地上霜，举头望明月，低头思故乡。');
  });

  it('start() 应为每首诗调用 generateAudio 并保存到 localStorage', async () => {
    const client = makeMockClient();
    const gen = createAudioGenerator({ client, poems: makePoems(), onProgress: () => {}, concurrency: 2 });
    await gen.start();
    expect(client.generateAudio).toHaveBeenCalledTimes(2);
    expect(localStorage.getItem('shiyun_gen_audio_g1-01')).toMatch(/^data:audio\/mp3;base64,/);
    expect(localStorage.getItem('shiyun_gen_audio_g1-02')).toMatch(/^data:audio\/mp3;base64,/);
  });

  it('已生成的应被跳过', async () => {
    localStorage.setItem('shiyun_gen_audio_g1-01', 'data:audio/mp3;base64,old');
    const client = makeMockClient();
    const gen = createAudioGenerator({ client, poems: makePoems(), onProgress: () => {}, concurrency: 1 });
    await gen.start();
    expect(client.generateAudio).toHaveBeenCalledTimes(1);
  });

  it('pendingPoemIds 应返回尚未生成 audio 的诗 ID', () => {
    const gen = createAudioGenerator({ client: makeMockClient(), poems: makePoems(), onProgress: () => {} });
    expect(gen.pendingPoemIds()).toEqual(['g1-01', 'g1-02']);
  });

  it('单首失败不应阻塞其他', async () => {
    const client = {
      generateAudio: vi.fn(async ({ text }) => {
        if (text.includes('鹅')) throw new Error('TTS 服务异常');
        return 'data:audio/mp3;base64,ok';
      }),
    };
    const events = [];
    const gen = createAudioGenerator({
      client, poems: makePoems(),
      onProgress: (e) => events.push(e),
      concurrency: 1,
    });
    await gen.start();
    expect(events.filter(e => e.status === 'fail').length).toBe(1);
    expect(events.filter(e => e.status === 'success').length).toBe(1);
    expect(gen.stats().failed).toBe(1);
  });

  it('regenerateOne 应清掉旧记录后重新生成', async () => {
    localStorage.setItem('shiyun_gen_audio_g1-01', 'data:audio/mp3;base64,old');
    const client = makeMockClient();
    const gen = createAudioGenerator({ client, poems: makePoems(), concurrency: 1 });
    await gen.regenerateOne('g1-01');
    expect(localStorage.getItem('shiyun_gen_audio_g1-01')).not.toBe('data:audio/mp3;base64,old');
    expect(client.generateAudio).toHaveBeenCalledTimes(1);
  });

  it('cancel() 后未完成的应不再执行', async () => {
    const client = {
      generateAudio: vi.fn(async () => {
        await new Promise(r => setTimeout(r, 50));
        return 'data:audio/mp3;base64,ok';
      }),
    };
    const gen = createAudioGenerator({ client, poems: makePoems(), onProgress: () => {}, concurrency: 1 });
    const p = gen.start();
    gen.cancel();
    await p;
    expect(client.generateAudio.mock.calls.length).toBeLessThanOrEqual(1);
  });
});
