/**
 * 生成器状态管理 + localStorage 持久化
 * 供 Task 6/7/8 共享
 *
 * 键命名：
 *   shiyun_api_key
 *   shiyun_gen_text_<poemId>
 *   shiyun_gen_image_<poemId>
 *   shiyun_gen_audio_<poemId>
 *   shiyun_gen_settings
 */

const KEY_API = 'shiyun_api_key';
const KEY_SETTINGS = 'shiyun_gen_settings';
const PREFIX = 'shiyun_gen_';
const TYPES = ['text', 'image', 'audio'];

/** @typedef {'text'|'image'|'audio'} PieceType */

/** 保存 API Key */
export function saveApiKey(apiKey) {
  if (!apiKey || typeof apiKey !== 'string') {
    throw new Error('API Key 必须是非空字符串');
  }
  localStorage.setItem(KEY_API, apiKey);
}

/** 读取 API Key（无则返回 null） */
export function loadApiKey() {
  return localStorage.getItem(KEY_API);
}

/** 清除 API Key */
export function clearApiKey() {
  localStorage.removeItem(KEY_API);
}

/**
 * 保存单首诗的某类内容
 * @param {string} poemId
 * @param {PieceType} type
 * @param {*} data 任意可 JSON 序列化或字符串
 */
export function savePoemPiece(poemId, type, data) {
  if (!poemId) throw new Error('poemId 必填');
  if (!TYPES.includes(type)) throw new Error('type 必须为 text/image/audio');
  const key = PREFIX + type + '_' + poemId;
  const value = typeof data === 'string' ? data : JSON.stringify(data);
  localStorage.setItem(key, value);
}

/**
 * 读取单首诗的某类内容（无则返回 null）
 * 文本类型自动 JSON.parse，其他类型返回原始字符串
 */
export function loadPoemPiece(poemId, type) {
  if (!poemId) return null;
  if (!TYPES.includes(type)) return null;
  const key = PREFIX + type + '_' + poemId;
  const raw = localStorage.getItem(key);
  if (raw === null) return null;
  if (type === 'text') {
    try { return JSON.parse(raw); } catch { return null; }
  }
  return raw;
}

/**
 * 清除单首诗的所有生成内容
 */
export function clearPoemPiece(poemId) {
  TYPES.forEach(t => localStorage.removeItem(PREFIX + t + '_' + poemId));
}

/** 列出所有至少有一种 type 已生成的诗 ID */
export function listGeneratedPoemIds() {
  const ids = new Set();
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k || !k.startsWith(PREFIX)) continue;
    for (const t of TYPES) {
      if (k.startsWith(PREFIX + t + '_')) {
        ids.add(k.slice((PREFIX + t + '_').length));
        break;
      }
    }
  }
  return Array.from(ids);
}

/** 保存生成器设置（年级列表等） */
export function saveSettings(settings) {
  localStorage.setItem(KEY_SETTINGS, JSON.stringify(settings));
}

/** 读取生成器设置 */
export function loadSettings() {
  const raw = localStorage.getItem(KEY_SETTINGS);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

// ─────────────────────────────────────────────────────────
// ID 格式迁移：从旧格式 `g{grade}-{seq}` 升级到 `g{grade}-{上|下}-{seq:02d}`
// 旧 AI 数据以 orphan 形式留在 localStorage 中，检测 + 一键清理
// ─────────────────────────────────────────────────────────

/** 旧 ID 正则：g1-01、g2-12 等（无学期段） */
const OLD_ID_RE = /^g[1-6]-\d{1,2}$/;
/** 新 ID 正则：g1-上-01、g2-下-12 等 */
const NEW_ID_RE = /^g[1-6]-(上|下)-\d{2}$/;

/**
 * 扫描 localStorage 中的 shiyun_gen_* 记录，返回按 old/new 分类的诗 ID 集合。
 * 用于「数据迁移」提示。
 */
export function scanLegacyPoemIds() {
  const oldIds = new Set();
  const newIds = new Set();
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k || !k.startsWith(PREFIX)) continue;
    // 提取 type 之后的 poemId 部分
    for (const t of TYPES) {
      const prefix = PREFIX + t + '_';
      if (k.startsWith(prefix)) {
        const id = k.slice(prefix.length);
        if (OLD_ID_RE.test(id)) oldIds.add(id);
        else if (NEW_ID_RE.test(id)) newIds.add(id);
        break;
      }
    }
  }
  return { oldIds: Array.from(oldIds), newIds: Array.from(newIds) };
}

/**
 * 清除所有以旧 ID 格式存储的 shiyun_gen_text/image/audio_* 记录。
 * @returns {{ clearedKeys: number, oldIds: string[] }}
 */
export function clearLegacyPoemPieces() {
  const { oldIds } = scanLegacyPoemIds();
  let clearedKeys = 0;
  for (const id of oldIds) {
    for (const t of TYPES) {
      const key = PREFIX + t + '_' + id;
      if (localStorage.getItem(key) !== null) {
        localStorage.removeItem(key);
        clearedKeys++;
      }
    }
  }
  return { clearedKeys, oldIds };
}
