import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OpenAIClient, createClientFromStorage } from '../src/js/openai-client.js';

describe('OpenAIClient', () => {
  let mockFetch;

  beforeEach(() => {
    mockFetch = vi.fn();
    global.fetch = mockFetch;
  });

  it('generateText 应发送正确请求并解析 JSON', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: '{"translation": "test"}' } }],
      }),
    });

    const client = new OpenAIClient({ apiKey: 'sk-test' });
    const result = await client.generateText({
      systemPrompt: '你是助手',
      userPrompt: '翻译这首诗',
    });
    expect(result).toEqual({ translation: 'test' });

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.openai.com/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'Authorization': 'Bearer sk-test' }),
      })
    );
  });

  it('generateText 应在 jsonMode=false 时返回原始字符串', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'plain text reply' } }],
      }),
    });

    const client = new OpenAIClient({ apiKey: 'sk-test' });
    const result = await client.generateText({
      systemPrompt: 's',
      userPrompt: 'u',
      jsonMode: false,
    });
    expect(result).toBe('plain text reply');
  });

  it('generateImage 应返回 base64 data URL', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [{ b64_json: 'abc123' }] }),
    });

    const client = new OpenAIClient({ apiKey: 'sk-test' });
    const url = await client.generateImage({ prompt: 'a moon' });
    expect(url).toBe('data:image/png;base64,abc123');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.openai.com/v1/images/generations',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'Authorization': 'Bearer sk-test' }),
      })
    );
  });

  it('generateAudio 应将 blob 转为 data URL', async () => {
    const fakeBlob = new Blob(['fake-mp3'], { type: 'audio/mp3' });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      blob: async () => fakeBlob,
    });

    const client = new OpenAIClient({ apiKey: 'sk-test' });
    const dataUrl = await client.generateAudio({ text: '床前明月光' });
    expect(dataUrl).toMatch(/^data:audio\/mp3;base64,/);
  });

  it('API 错误应抛出（含状态码）', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => 'invalid api key',
    });

    const client = new OpenAIClient({ apiKey: 'bad' });
    await expect(client.generateText({ systemPrompt: 's', userPrompt: 'u' }))
      .rejects.toThrow(/401/);
  });

  it('JSON 解析失败应抛出明确错误', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'not-json{' } }],
      }),
    });

    const client = new OpenAIClient({ apiKey: 'sk-test' });
    await expect(
      client.generateText({ systemPrompt: 's', userPrompt: 'u' })
    ).rejects.toThrow(/非 JSON/);
  });

  it('validate 在成功时应返回 true', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });
    const client = new OpenAIClient({ apiKey: 'sk-good' });
    const result = await client.validate();
    expect(result).toBe(true);
  });

  it('validate 在失败时应返回 false', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 401 });
    const client = new OpenAIClient({ apiKey: 'sk-bad' });
    const result = await client.validate();
    expect(result).toBe(false);
  });

  it('validate 在网络错误时应返回 false', async () => {
    mockFetch.mockRejectedValueOnce(new Error('network down'));
    const client = new OpenAIClient({ apiKey: 'sk-x' });
    const result = await client.validate();
    expect(result).toBe(false);
  });

  it('createClientFromStorage 应从 localStorage 读取 apiKey', () => {
    localStorage.setItem('shiyun_api_key', 'sk-from-storage');
    const client = createClientFromStorage();
    expect(client).toBeInstanceOf(OpenAIClient);
    expect(client.apiKey).toBe('sk-from-storage');
  });

  it('createClientFromStorage 未配置时应抛出', () => {
    localStorage.removeItem('shiyun_api_key');
    expect(() => createClientFromStorage()).toThrow(/未配置 API Key/);
  });

  it('构造时缺少 apiKey 应抛出', () => {
    expect(() => new OpenAIClient({})).toThrow(/apiKey is required/);
    expect(() => new OpenAIClient()).toThrow(/apiKey is required/);
  });
});
