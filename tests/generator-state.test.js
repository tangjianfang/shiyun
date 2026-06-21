import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveApiKey, loadApiKey, clearApiKey,
  savePoemPiece, loadPoemPiece, clearPoemPiece,
  listGeneratedPoemIds, saveSettings, loadSettings,
  scanLegacyPoemIds, clearLegacyPoemPieces,
} from '../src/generator/state.js';

describe('API Key 存取', () => {
  beforeEach(() => localStorage.clear());

  it('saveApiKey / loadApiKey 应能往返', () => {
    saveApiKey('sk-test-123');
    expect(loadApiKey()).toBe('sk-test-123');
  });

  it('未保存时 loadApiKey 返回 null', () => {
    expect(loadApiKey()).toBe(null);
  });

  it('clearApiKey 应清除', () => {
    saveApiKey('sk-test');
    clearApiKey();
    expect(loadApiKey()).toBe(null);
  });

  it('空字符串应抛错', () => {
    expect(() => saveApiKey('')).toThrow();
    expect(() => saveApiKey(null)).toThrow();
  });
});

describe('单首诗内容存取', () => {
  beforeEach(() => localStorage.clear());

  it('savePoemPiece 后 loadPoemPiece 应能取回', () => {
    const data = { translation: '月光洒在床上', background: '李白思乡' };
    savePoemPiece('g1-01', 'text', data);
    expect(loadPoemPiece('g1-01', 'text')).toEqual(data);
  });

  it('未保存的诗返回 null', () => {
    expect(loadPoemPiece('g1-99', 'text')).toBe(null);
  });

  it('不同 type 互不影响', () => {
    savePoemPiece('g1-01', 'text', { a: 1 });
    savePoemPiece('g1-01', 'image', 'data:image/jpeg;base64,xyz');
    expect(loadPoemPiece('g1-01', 'text')).toEqual({ a: 1 });
    expect(loadPoemPiece('g1-01', 'image')).toBe('data:image/jpeg;base64,xyz');
  });

  it('clearPoemPiece 应清除该诗所有 type', () => {
    savePoemPiece('g1-01', 'text', { a: 1 });
    savePoemPiece('g1-01', 'image', 'img');
    savePoemPiece('g1-01', 'audio', 'aud');
    clearPoemPiece('g1-01');
    expect(loadPoemPiece('g1-01', 'text')).toBe(null);
    expect(loadPoemPiece('g1-01', 'image')).toBe(null);
    expect(loadPoemPiece('g1-01', 'audio')).toBe(null);
  });

  it('image / audio 类型应原样保存字符串', () => {
    const dataUrl = 'data:image/png;base64,iVBORw0KGgo=';
    savePoemPiece('g1-01', 'image', dataUrl);
    expect(loadPoemPiece('g1-01', 'image')).toBe(dataUrl);
  });

  it('非法 type 应抛错', () => {
    expect(() => savePoemPiece('g1-01', 'video', {})).toThrow();
  });
});

describe('listGeneratedPoemIds', () => {
  beforeEach(() => localStorage.clear());

  it('应返回所有至少有一种 type 已生成的诗 ID', () => {
    savePoemPiece('g1-01', 'text', { a: 1 });
    savePoemPiece('g1-02', 'image', 'img');
    savePoemPiece('g1-03', 'audio', 'aud');
    const ids = listGeneratedPoemIds();
    expect(ids.sort()).toEqual(['g1-01', 'g1-02', 'g1-03']);
  });

  it('没有任何生成时返回空数组', () => {
    expect(listGeneratedPoemIds()).toEqual([]);
  });

  it('同一首诗多种 type 只计一次', () => {
    savePoemPiece('g1-01', 'text', { a: 1 });
    savePoemPiece('g1-01', 'image', 'img');
    savePoemPiece('g1-01', 'audio', 'aud');
    expect(listGeneratedPoemIds()).toEqual(['g1-01']);
  });
});

describe('settings 存取', () => {
  beforeEach(() => localStorage.clear());

  it('saveSettings / loadSettings 应能往返', () => {
    const settings = { grades: [1, 2, 3] };
    saveSettings(settings);
    expect(loadSettings()).toEqual(settings);
  });

  it('未保存时 loadSettings 返回 null', () => {
    expect(loadSettings()).toBe(null);
  });
});

describe('旧 ID 数据迁移', () => {
  beforeEach(() => localStorage.clear());

  it('scanLegacyPoemIds 应分类新旧 ID', () => {
    savePoemPiece('g1-01', 'text', { translation: '旧' });
    savePoemPiece('g3-12', 'image', 'data:image/png;base64,old');
    savePoemPiece('g1-上-01', 'text', { translation: '新' });
    savePoemPiece('g6-下-20', 'audio', 'data:audio/mp3;base64,new');

    const { oldIds, newIds } = scanLegacyPoemIds();
    expect(oldIds.sort()).toEqual(['g1-01', 'g3-12']);
    expect(newIds.sort()).toEqual(['g1-上-01', 'g6-下-20']);
  });

  it('没有旧 ID 时 oldIds 应为空', () => {
    savePoemPiece('g1-上-01', 'text', { translation: '新' });
    const { oldIds } = scanLegacyPoemIds();
    expect(oldIds).toEqual([]);
  });

  it('clearLegacyPoemPieces 应清除所有旧 ID 的 3 类记录', () => {
    savePoemPiece('g1-01', 'text', { translation: 'a' });
    savePoemPiece('g1-01', 'image', 'img');
    savePoemPiece('g1-01', 'audio', 'aud');
    savePoemPiece('g2-05', 'text', { translation: 'b' });
    savePoemPiece('g1-上-01', 'text', { translation: '应保留' });

    const { clearedKeys, oldIds } = clearLegacyPoemPieces();
    expect(clearedKeys).toBe(4); // g1-01 × 3 + g2-05 × 1
    expect(oldIds.sort()).toEqual(['g1-01', 'g2-05']);
    // 旧数据清除
    expect(loadPoemPiece('g1-01', 'text')).toBe(null);
    expect(loadPoemPiece('g2-05', 'text')).toBe(null);
    // 新数据保留
    expect(loadPoemPiece('g1-上-01', 'text')).toEqual({ translation: '应保留' });
  });

  it('无旧数据时 clearLegacyPoemPieces 不报错', () => {
    const { clearedKeys, oldIds } = clearLegacyPoemPieces();
    expect(clearedKeys).toBe(0);
    expect(oldIds).toEqual([]);
  });

  it('不应影响 settings 和 api key 等非 shiyun_gen_* key', () => {
    saveApiKey('sk-test');
    savePoemPiece('g1-01', 'text', { translation: '旧' });
    clearLegacyPoemPieces();
    expect(loadApiKey()).toBe('sk-test');
  });
});
