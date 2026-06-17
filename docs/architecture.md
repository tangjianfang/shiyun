# 诗云 · 架构详解

> 配合 [`README.md`](../README.md) 阅读。本文档深入技术架构。

## 目录

- [系统分层](#系统分层)
- [双产物架构](#双产物架构)
- [数据模型](#数据模型)
- [关键模块](#关键模块)
- [性能与体积](#性能与体积)
- [安全设计](#安全设计)
- [扩展点](#扩展点)

---

## 系统分层

诗云采用**五层架构**：

```
┌─────────────────────────────────────────┐
│  视图层 (Views)                          │
│  src/js/ui/*.js + src/learning.html     │
├─────────────────────────────────────────┤
│  业务层 (Business Logic)                 │
│  srs.js / quiz-*.js / print.js          │
├─────────────────────────────────────────┤
│  数据层 (Data)                           │
│  data.js (poems Map)                    │
│  storage.js (localStorage 封装)          │
├─────────────────────────────────────────┤
│  基础设施 (Infrastructure)              │
│  router.js / audio.js / pinyin-pro      │
├─────────────────────────────────────────┤
│  产物层 (Build Artifacts)                │
│  dist/诗云-学习版.html (单文件)          │
└─────────────────────────────────────────┘
```

### 各层职责

- **视图层**：渲染 DOM、绑定事件、调用业务层
- **业务层**：SM-2 算法、考核判分、打印排版
- **数据层**：诗词数据加载、用户进度读写
- **基础设施**：路由、音频播放、拼音查询
- **产物层**：单 HTML 文件，含所有代码 + 数据 + 媒体

## 双产物架构

### 生成器（`诗云-生成器.html`）

- **形态**：单 HTML 文件，含 OpenAI 客户端
- **运行**：浏览器打开（需联网）
- **输入**：API Key + 年级范围
- **输出**：嵌入完整 AI 内容的 `诗云-学习版.html`

### 学习版（`诗云-学习版.html`）

- **形态**：单 HTML 文件，含全部代码 + 数据 + 媒体
- **运行**：双击即用（完全离线）
- **输入**：用户操作
- **输出**：localStorage 进度

## 数据模型

### 静态数据（`src/data/poems-meta.js`）

```typescript
interface PoemMeta {
  id: string;
  title: string;
  author: string;
  dynasty: string;
  grade: 1|2|3|4|5|6;
  type: string;
  content: string[];  // 分句（去标点）
  sequence: number;
  source: string;
}
```

### 运行时数据（`window.__SHIYUN_POEMS__`）

构建时从 `poems-meta.js` 初始化，运行期由生成器填充 AI 字段：

```typescript
interface Poem extends PoemMeta {
  pinyin: string[];            // 拼音行
  translation: string;         // 翻译
  background: string;         // 背景
  annotations: Record<string, string>;  // 字词注释
  theme: string;              // 主题
  keywords: string[];         // 关键词
  image: string;              // data:image/...;base64,...
  audio: string;              // data:audio/mp3;base64,...
  keySentences: KeySentence[];
}
```

### 用户状态（localStorage key: `shiyun_user_state`）

```typescript
interface UserState {
  version: string;
  currentUser: string;        // 当前 userId
  users: Record<string, UserProfile>;
}

interface UserProfile {
  id: string;
  name: string;
  avatar: string;             // emoji
  grade: 1|2|3|4|5|6;
  createdAt: string;
  lastActiveAt: string;
  poemProgress: Record<string, PoemProgress>;
  quizHistory: QuizRecord[];
  achievements: string[];
}

interface PoemProgress {
  status: 'new' | 'learning' | 'reviewing' | 'mastered';
  learnCount: number;
  quizCount: number;
  avgScore: number;
  lastLearnedAt: string;
  nextReviewAt: string;       // ISO date
  easeFactor: number;         // SM-2
  interval: number;           // SM-2
  favorite: boolean;
  notes: string;
}

interface QuizRecord {
  poemId: string;
  mode: 'fill' | 'choice' | 'order' | 'listen';
  score: number;
  at: string;
}
```

## 关键模块

### SM-2 算法（`src/js/srs.js`）

简化版 SM-2（参考 Anki）：

```
输入：上次考核得分（0-100）
  ≥ 90:  interval = interval × 2.5, easeFactor += 0.1
  70-89: interval = interval × 1.5
  < 70:  interval = 1（重置）

连续 3 次 ≥ 90:  status = 'mastered'

输出：nextReviewAt（ISO date）
```

### 路由（`src/js/router.js`）

基于 `window.location.hash`：

```
#/              → home
#/learn         → learn
#/learn/:id     → learn detail
#/review        → review
#/quiz          → quiz
#/quiz/:mode    → quiz mode
#/print         → print
#/progress      → progress
```

### 拼音（`pinyin-pro`）

- 构建时复制 `node_modules/pinyin-pro/dist/index.js` 到 `src/lib/pinyin-pro.min.js`
- 构建产物中 `dist/lib/pinyin-pro.min.js` 由脚本复制
- 学习版通过 `<script src="./lib/pinyin-pro.min.js">` 加载（非 ES Module）
- 用法：`pinyinPro.pinyin('床前明月光', { toneType: 'none' })` → `'chuáng qián míng yuè guāng'`

### 打印

- 4 种版式在 `src/js/print.js` 的 `render*Page` 函数
- 屏幕预览用 `print.css` 的非 `@media print` 部分
- 打印用 `@media print` 部分（隐藏 UI、强制 A4、黑色文字）
- 触发：`triggerPrint(container)` 用隐藏 iframe 加载 CSS 后调 `iframe.contentWindow.print()`

## 性能与体积

### 体积估算

| 文件 | 大小 |
|------|------|
| `dist/诗云-学习版.html`（不含媒体） | ~500 KB |
| 112 首诗 × 100KB AI 配图 | ~11 MB |
| 112 首诗 × 50KB AI 音频 | ~5.6 MB |
| **总计** | **~17 MB** |

### 性能指标

| 指标 | 目标 | 实际 |
|------|------|------|
| 首次打开（无媒体） | < 3s | ~1s |
| 列表渲染（112 首） | < 200ms | ~50ms |
| SVG 图表渲染 | < 200ms | ~20ms |
| 路由切换 | < 100ms | ~10ms |
| 考核判分 | < 50ms | < 5ms |

## 安全设计

### API Key 保护

- 生成器 Key 存 localStorage（`shiyun_api_key`）
- 仅生成阶段使用
- 学习版不包含 Key
- 提示用户不要分享生成器文件

### 用户数据

- localStorage 同源访问限制（避免跨域）
- 无第三方分析 / 追踪
- 进度可导出备份

### 输入验证

- 用户名 / 头像 / 年级在 UI 层校验
- 文件导入（JSON）用 `try/catch` 防止恶意输入
- 路由参数（hash）有白名单

## 扩展点

### 添加新 AI 提供商

参考 `src/js/openai-client.js`：

```javascript
class CustomAIClient {
  async generateText({ systemPrompt, userPrompt, jsonMode }) { /* ... */ }
  async generateImage({ prompt }) { /* ... */ }
  async generateAudio({ text }) { /* ... */ }
}
```

### 添加新考核模式

1. 在 `src/js/quiz/` 创建 `quiz-newmode.js`
2. 导出 `renderNewMode(container, poem, onComplete)` 函数
3. 在 `src/js/ui/quiz.js` 注册新模式
4. 写测试

### 添加新打印版式

1. 在 `src/js/print.js` 的 `FORMAT_DEFS` 追加
2. 实现 `renderNewFormatPage(poem, ...)` 函数
3. 在 `src/css/print.css` 追加 `.page-newformat` 样式
4. 在 `@media print` 中追加对应规则

### 添加新成就

1. 在 `src/js/ui/progress.js` 的 `ACHIEVEMENT_DEFS` 追加
2. 写 `check(state, total, poems)` 函数
3. 测试触发条件
