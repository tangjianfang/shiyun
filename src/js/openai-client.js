/**
 * OpenAI 客户端封装
 * - 文本生成（GPT-4o-mini）
 * - 配图生成（DALL-E 3）
 * - 音频生成（TTS-1）
 *
 * 浏览器环境使用：API Key 存 localStorage
 * 测试环境使用：mock 注入
 */

const DEFAULT_BASE = 'https://api.openai.com/v1';

/**
 * @typedef {Object} AIClientConfig
 * @property {string} apiKey
 * @property {string} [baseUrl]
 * @property {string} [textModel]
 * @property {string} [imageModel]
 * @property {string} [ttsModel]
 * @property {string} [ttsVoice]
 */

export class OpenAIClient {
  constructor(config) {
    if (!config || !config.apiKey) {
      throw new Error('OpenAIClient: apiKey is required');
    }
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || DEFAULT_BASE;
    this.textModel = config.textModel || 'gpt-4o-mini';
    this.imageModel = config.imageModel || 'dall-e-3';
    this.ttsModel = config.ttsModel || 'tts-1';
    this.ttsVoice = config.ttsVoice || 'alloy';
  }

  /** 通用 fetch 包装（返回 JSON） */
  async _request(path, body) {
    const res = await fetch(this.baseUrl + path, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      let errText;
      try {
        errText = await res.text();
      } catch {
        errText = '<no body>';
      }
      throw new Error(`OpenAI API ${res.status}: ${errText}`);
    }
    return res.json();
  }

  /** 文本生成（默认 JSON 模式） */
  async generateText({ systemPrompt, userPrompt, jsonMode = true, temperature = 0.7 }) {
    if (!systemPrompt || !userPrompt) {
      throw new Error('generateText: systemPrompt and userPrompt are required');
    }
    const body = {
      model: this.textModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature,
    };
    if (jsonMode) {
      body.response_format = { type: 'json_object' };
    }
    const data = await this._request('/chat/completions', body);
    const content = data.choices?.[0]?.message?.content;
    if (content === undefined) {
      throw new Error('OpenAI API 返回缺少 choices[0].message.content');
    }
    if (jsonMode) {
      try {
        return JSON.parse(content);
      } catch (e) {
        throw new Error('AI 返回非 JSON: ' + content);
      }
    }
    return content;
  }

  /** 配图生成（DALL-E 3） */
  async generateImage({ prompt, size = '1024x1024', quality = 'standard' }) {
    if (!prompt) {
      throw new Error('generateImage: prompt is required');
    }
    const data = await this._request('/images/generations', {
      model: this.imageModel,
      prompt,
      size,
      quality,
      n: 1,
      response_format: 'b64_json',
    });
    const b64 = data.data?.[0]?.b64_json;
    if (!b64) {
      throw new Error('OpenAI API 返回缺少 data[0].b64_json');
    }
    return 'data:image/png;base64,' + b64;
  }

  /** 音频生成（TTS-1） */
  async generateAudio({ text, voice = this.ttsVoice, speed = 0.85 }) {
    if (!text) {
      throw new Error('generateAudio: text is required');
    }
    const res = await fetch(this.baseUrl + '/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.ttsModel,
        voice,
        input: text,
        speed,
        response_format: 'mp3',
      }),
    });
    if (!res.ok) {
      let errText;
      try {
        errText = await res.text();
      } catch {
        errText = '<no body>';
      }
      throw new Error(`TTS API ${res.status}: ${errText}`);
    }
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('FileReader 读取音频失败'));
      reader.readAsDataURL(blob);
    });
  }

  /** 校验 API Key 是否有效 */
  async validate() {
    try {
      const res = await fetch(this.baseUrl + '/models', {
        headers: { 'Authorization': `Bearer ${this.apiKey}` },
      });
      return res.ok;
    } catch {
      return false;
    }
  }
}

/** 全局单例（从 localStorage 读取配置） */
export function createClientFromStorage() {
  const apiKey = localStorage.getItem('shiyun_api_key');
  if (!apiKey) throw new Error('未配置 API Key');
  return new OpenAIClient({ apiKey });
}

export const DEFAULT_CONFIG = {
  baseUrl: DEFAULT_BASE,
  textModel: 'gpt-4o-mini',
  imageModel: 'dall-e-3',
  ttsModel: 'tts-1',
  ttsVoice: 'alloy',
};
