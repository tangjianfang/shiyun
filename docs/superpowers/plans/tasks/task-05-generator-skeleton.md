# Task 5: 生成器 HTML 骨架

**依赖：** Task 1, Task 3, Task 4
**并行组：** generator-ui
**估时：** 1 天

**Files:**
- Create: `诗云-生成器.html`（单 HTML 文件，内嵌 CSS 和 JS）
- Create: `src/generator/state.js`（生成器状态管理 + 进度持久化辅助）
- Create: `tests/generator-state.test.js`（state 单元测试）

## 任务目标

构建生成器单 HTML 文件的骨架，4 步向导 UI（API Key 配置 → 年级选择 → 生成进度 → 导出），保持与学习版一致的现代简约视觉。本任务只搭骨架，实际生成逻辑在 Task 6-8 接入。

## 接口约定

`src/generator/state.js` 必须导出：

```javascript
// 写入单首诗的某类内容（如 text/image/audio）
export function savePoemPiece(poemId, type, data) { ... }
// 读取单首诗的某类内容
export function loadPoemPiece(poemId, type) { ... }
// 清除单首诗的全部内容
export function clearPoemPiece(poemId) { ... }
// 列出所有已有生成进度的诗 ID
export function listGeneratedPoemIds() { ... }
// API Key 存取
export function saveApiKey(apiKey) { ... }
export function loadApiKey() { ... }
export function clearApiKey() { ... }
```

type 取值：`'text'` | `'image'` | `'audio'`。
localStorage 键约定：
- `shiyun_api_key` — API Key
- `shiyun_gen_text_<poemId>` — 文本生成结果（JSON 字符串）
- `shiyun_gen_image_<poemId>` — 配图 dataURL
- `shiyun_gen_audio_<poemId>` — 音频 dataURL
- `shiyun_gen_settings` — 选中的年级列表（JSON 数组）

## Step 1: 写失败的测试

```javascript
// tests/generator-state.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveApiKey, loadApiKey, clearApiKey,
  savePoemPiece, loadPoemPiece, clearPoemPiece,
  listGeneratedPoemIds,
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
});
```

## Step 2: 运行测试验证失败

```bash
cd C:/tjf/github/诗云
npm test -- tests/generator-state.test.js
```

Expected: FAIL with "Cannot find module '../src/generator/state.js'"

## Step 3: 实现最小代码

### `src/generator/state.js`

```javascript
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
```

### `诗云-生成器.html`

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>诗云 · 生成器</title>
<style>
  /* === 现代简约（与学习版一致） === */
  :root {
    --primary: #4a90e2;
    --success: #28a745;
    --danger: #dc3545;
    --bg: #f5f7fa;
    --text: #2c3e50;
    --text-light: #7f8c8d;
    --border: #e1e8ed;
    --card: #ffffff;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif;
    background: var(--bg);
    color: var(--text);
    line-height: 1.6;
    min-height: 100vh;
  }
  .container { max-width: 800px; margin: 0 auto; padding: 24px; }
  header { text-align: center; padding: 32px 0 16px; }
  header h1 { font-size: 32px; color: var(--primary); margin-bottom: 8px; }
  header p { color: var(--text-light); }

  /* 步骤指示器 */
  .steps { display: flex; justify-content: space-between; margin: 32px 0; position: relative; }
  .steps::before {
    content: ''; position: absolute; top: 18px; left: 5%; right: 5%;
    height: 2px; background: var(--border); z-index: 0;
  }
  .step { position: relative; z-index: 1; text-align: center; flex: 1; }
  .step-circle {
    width: 36px; height: 36px; border-radius: 50%; background: white;
    border: 2px solid var(--border); display: inline-flex;
    align-items: center; justify-content: center; font-weight: 600;
    color: var(--text-light);
  }
  .step.active .step-circle { background: var(--primary); color: white; border-color: var(--primary); }
  .step.done .step-circle { background: var(--success); color: white; border-color: var(--success); }
  .step-label { display: block; margin-top: 8px; font-size: 14px; color: var(--text-light); }
  .step.active .step-label { color: var(--text); font-weight: 600; }

  /* 卡片 */
  .card {
    background: var(--card); border-radius: 12px; padding: 32px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04); margin-bottom: 24px;
  }
  .card h2 { font-size: 20px; margin-bottom: 16px; color: var(--text); }
  .card p.hint { color: var(--text-light); font-size: 14px; margin-bottom: 20px; }

  /* 表单 */
  label { display: block; margin-bottom: 6px; font-size: 14px; color: var(--text); font-weight: 500; }
  input[type=password], input[type=text] {
    width: 100%; padding: 10px 14px; border: 1px solid var(--border);
    border-radius: 6px; font-size: 15px; font-family: inherit;
  }
  input[type=password]:focus, input[type=text]:focus { outline: none; border-color: var(--primary); }

  .grade-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 12px; margin: 16px 0; }
  .grade-item {
    border: 2px solid var(--border); border-radius: 8px; padding: 16px 8px;
    text-align: center; cursor: pointer; transition: all 0.2s; user-select: none;
  }
  .grade-item:hover { border-color: var(--primary); }
  .grade-item.selected { background: var(--primary); color: white; border-color: var(--primary); }
  .grade-item .num { font-size: 24px; font-weight: 700; }

  /* 按钮 */
  .btn {
    padding: 10px 24px; border: none; border-radius: 6px;
    font-size: 15px; font-weight: 600; cursor: pointer;
    transition: all 0.2s; font-family: inherit;
  }
  .btn-primary { background: var(--primary); color: white; }
  .btn-primary:hover { background: #357abd; }
  .btn-primary:disabled { background: #ccc; cursor: not-allowed; }
  .btn-success { background: var(--success); color: white; }
  .btn-success:hover { background: #1e7e34; }
  .btn-ghost { background: transparent; color: var(--text-light); }
  .btn-ghost:hover { color: var(--text); }
  .actions { display: flex; justify-content: space-between; gap: 12px; margin-top: 24px; }

  /* 进度条 */
  .progress-wrap { background: var(--border); border-radius: 8px; height: 24px; overflow: hidden; position: relative; }
  .progress-bar {
    height: 100%; background: linear-gradient(90deg, var(--primary), #5ba0e8);
    width: 0; transition: width 0.3s; border-radius: 8px;
  }
  .progress-text {
    position: absolute; top: 0; left: 0; right: 0; bottom: 0;
    display: flex; align-items: center; justify-content: center;
    color: white; font-size: 13px; font-weight: 600; text-shadow: 0 1px 2px rgba(0,0,0,0.3);
  }
  .progress-detail { margin-top: 12px; color: var(--text-light); font-size: 14px; text-align: center; }
  .stat-row { display: flex; gap: 16px; justify-content: center; margin: 16px 0; }
  .stat { text-align: center; }
  .stat-num { font-size: 28px; font-weight: 700; color: var(--primary); }
  .stat-label { font-size: 13px; color: var(--text-light); }

  /* 隐藏面板 */
  .panel { display: none; }
  .panel.active { display: block; }

  /* 提示 */
  .alert { padding: 12px 16px; border-radius: 6px; margin-bottom: 16px; font-size: 14px; }
  .alert-error { background: #fee; color: var(--danger); border: 1px solid #fcc; }
  .alert-info { background: #e7f3ff; color: var(--primary); border: 1px solid #b3d9ff; }
  .alert.hidden { display: none; }

  footer { text-align: center; color: var(--text-light); font-size: 13px; padding: 32px 0; }
</style>
</head>
<body>
<div class="container">
  <header>
    <h1>诗云 · 生成器</h1>
    <p>家长用工具 · 一次性 AI 生成 112 首诗词的扩展内容</p>
  </header>

  <!-- 步骤指示器 -->
  <div class="steps" id="steps-indicator">
    <div class="step active" data-step="1"><div class="step-circle">1</div><span class="step-label">API Key</span></div>
    <div class="step" data-step="2"><div class="step-circle">2</div><span class="step-label">选年级</span></div>
    <div class="step" data-step="3"><div class="step-circle">3</div><span class="step-label">生成</span></div>
    <div class="step" data-step="4"><div class="step-circle">4</div><span class="step-label">导出</span></div>
  </div>

  <!-- Step 1: API Key -->
  <div class="card panel active" id="panel-1">
    <h2>配置 OpenAI API Key</h2>
    <p class="hint">API Key 仅保存在你本地浏览器（localStorage），不会上传任何服务器。生成完毕后可以清除。</p>
    <div class="alert alert-info" id="api-status">请输入你的 OpenAI API Key（以 sk- 开头）</div>
    <label for="api-key-input">API Key</label>
    <input type="password" id="api-key-input" placeholder="sk-..." autocomplete="off">
    <div class="actions">
      <span></span>
      <button class="btn btn-primary" id="btn-validate-key">验证并继续</button>
    </div>
  </div>

  <!-- Step 2: 年级选择 -->
  <div class="card panel" id="panel-2">
    <h2>选择要生成的年级</h2>
    <p class="hint">默认全选。每个年级约 12-26 首诗，生成时间约 5-30 分钟（视 API 速度）。</p>
    <div class="grade-grid" id="grade-grid"></div>
    <div class="actions">
      <button class="btn btn-ghost" id="btn-back-1">← 上一步</button>
      <button class="btn btn-primary" id="btn-go-generate">开始生成</button>
    </div>
  </div>

  <!-- Step 3: 生成进度 -->
  <div class="card panel" id="panel-3">
    <h2>正在生成</h2>
    <div class="stat-row">
      <div class="stat"><div class="stat-num" id="stat-text">0</div><div class="stat-label">文本</div></div>
      <div class="stat"><div class="stat-num" id="stat-image">0</div><div class="stat-label">配图</div></div>
      <div class="stat"><div class="stat-num" id="stat-audio">0</div><div class="stat-label">音频</div></div>
    </div>
    <div class="progress-wrap">
      <div class="progress-bar" id="progress-bar"></div>
      <div class="progress-text" id="progress-text">0%</div>
    </div>
    <div class="progress-detail" id="progress-detail">准备中...</div>
    <div class="actions">
      <span></span>
      <button class="btn btn-ghost" id="btn-cancel-generate">取消</button>
    </div>
  </div>

  <!-- Step 4: 导出 -->
  <div class="card panel" id="panel-4">
    <h2>生成完成</h2>
    <p class="hint">所有内容已保存。点击下方按钮导出单 HTML 学习版（包含全部诗词 + AI 配图 + AI 朗读），可拷贝到孩子设备离线使用。</p>
    <div class="alert alert-info" id="export-info">尚未开始导出</div>
    <div class="actions">
      <button class="btn btn-ghost" id="btn-back-3">← 返回</button>
      <button class="btn btn-success" id="btn-export">导出学习版</button>
    </div>
  </div>

  <footer>诗云 · 家庭古诗词学习系统</footer>
</div>

<!-- OpenAI 客户端（Task 4） -->
<script src="src/js/openai-client.js"></script>
<!-- 生成器状态管理（本任务） -->
<script src="src/generator/state.js"></script>
<!-- 生成器 UI 控制（本任务） -->
<script>
(function() {
  'use strict';

  // ===== 全局状态 =====
  const state = {
    currentStep: 1,
    selectedGrades: [1, 2, 3, 4, 5, 6],
    apiKey: null,
    openaiClient: null,
    generateCancelled: false,
  };

  // ===== DOM 引用 =====
  const $ = (id) => document.getElementById(id);

  // ===== 步骤切换 =====
  function goToStep(n) {
    state.currentStep = n;
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    $('panel-' + n).classList.add('active');
    document.querySelectorAll('.step').forEach(s => {
      const sn = parseInt(s.dataset.step, 10);
      s.classList.remove('active', 'done');
      if (sn === n) s.classList.add('active');
      else if (sn < n) s.classList.add('done');
    });
  }

  // ===== Step 1: API Key =====
  function initStep1() {
    const existing = loadApiKey();
    if (existing) {
      $('api-key-input').value = existing;
      $('api-status').textContent = '已加载已保存的 API Key。点击「验证并继续」继续。';
    }
    $('btn-validate-key').addEventListener('click', async () => {
      const key = $('api-key-input').value.trim();
      if (!key || !key.startsWith('sk-')) {
        $('api-status').className = 'alert alert-error';
        $('api-status').textContent = 'API Key 格式不正确（应以 sk- 开头）';
        return;
      }
      $('btn-validate-key').disabled = true;
      $('api-status').className = 'alert alert-info';
      $('api-status').textContent = '正在验证 API Key...';
      try {
        const client = new OpenAIClient({ apiKey: key });
        const ok = await client.validate();
        if (!ok) throw new Error('验证失败');
        saveApiKey(key);
        state.apiKey = key;
        state.openaiClient = client;
        $('api-status').textContent = 'API Key 验证通过！';
        setTimeout(() => goToStep(2), 400);
      } catch (e) {
        $('api-status').className = 'alert alert-error';
        $('api-status').textContent = '验证失败：' + e.message;
      } finally {
        $('btn-validate-key').disabled = false;
      }
    });
  }

  // ===== Step 2: 年级选择 =====
  function initStep2() {
    const grid = $('grade-grid');
    for (let g = 1; g <= 6; g++) {
      const div = document.createElement('div');
      div.className = 'grade-item selected';
      div.dataset.grade = g;
      div.innerHTML = '<div class="num">' + g + '</div><div>年级</div>';
      div.addEventListener('click', () => {
        div.classList.toggle('selected');
        const selected = Array.from(document.querySelectorAll('.grade-item.selected'))
          .map(el => parseInt(el.dataset.grade, 10));
        state.selectedGrades = selected;
      });
      grid.appendChild(div);
    }
    $('btn-back-1').addEventListener('click', () => goToStep(1));
    $('btn-go-generate').addEventListener('click', () => {
      if (state.selectedGrades.length === 0) {
        alert('请至少选择一个年级');
        return;
      }
      goToStep(3);
      // 实际生成逻辑由 Task 6 接入
      $('progress-detail').textContent =
        '骨架就绪。Task 6-8 接入后将开始调用 AI 生成内容。';
    });
  }

  // ===== Step 3: 生成（占位） =====
  function initStep3() {
    $('btn-cancel-generate').addEventListener('click', () => {
      state.generateCancelled = true;
      goToStep(2);
    });
  }

  // ===== Step 4: 导出（占位） =====
  function initStep4() {
    $('btn-back-3').addEventListener('click', () => goToStep(3));
    $('btn-export').addEventListener('click', () => {
      $('export-info').textContent =
        '导出逻辑由 Task 9 接入。本任务先占位。';
    });
  }

  // ===== 启动 =====
  document.addEventListener('DOMContentLoaded', () => {
    initStep1();
    initStep2();
    initStep3();
    initStep4();
  });
})();
</script>
</body>
</html>
```

## Step 4: 运行测试验证通过

```bash
cd C:/tjf/github/诗云
npm test -- tests/generator-state.test.js
```

Expected: PASS（11 个测试用例全部通过）

## Step 5: 提交

```bash
cd C:/tjf/github/诗云
git add 诗云-生成器.html src/generator/state.js tests/generator-state.test.js
git commit -m "feat(generator): 生成器 HTML 骨架 + state 持久化"
```

## 完成标志

```bash
cd C:/tjf/github/诗云
mkdir -p .tasks/done
echo done > .tasks/done/05
```

## 关键说明

1. **单 HTML**：所有 CSS、JS 都内嵌在 `诗云-生成器.html` 中，但通过 `<script src=>` 引入独立的 `src/js/openai-client.js` 和 `src/generator/state.js`，避免单文件过大
2. **localStorage 键命名**：`shiyun_api_key` + `shiyun_gen_<type>_<poemId>`，Task 6/7/8 必须复用此命名
3. **state.js 是纯 ESM**：既可被 Node 测试（vitest），也可被 HTML `<script src=>` 加载（注意：HTML 端因为没 type=module 需检查兼容性；如有问题可在 HTML 内用 `<script type="module">` 改写）
4. **Task 6-8 接入点**：在 `initStep2` 的 `btn-go-generate` 点击后接入生成流程；调用 `state.openaiClient` + `savePoemPiece/loadPoemPiece`
5. **Task 9 接入点**：在 `initStep4` 的 `btn-export` 点击后接入导出逻辑
6. **视觉一致性**：色板（`--primary #4a90e2`、背景 `#f5f7fa`）必须与学习版 `src/css/main.css` 完全一致，由后续任务在 CSS 集中管理
