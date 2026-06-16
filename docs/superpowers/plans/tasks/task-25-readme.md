# Task 25: README + 文档

**依赖：** Task 1-24 全部
**并行组：** none（最后执行）
**估时：** 0.5 天

**Files:**
- Rewrite: `README.md`
- Create: `docs/architecture.md`（架构说明，引用自 README）
- Create: `docs/developer-guide.md`（开发者指南，引用自 README）
- Create: `docs/parent-guide.md`（家长使用指南，引用自 README）
- Create: `docs/troubleshooting.md`（故障排查）
- Create: `LICENSE`（MIT 协议）

## Step 1: 重写 README.md

```markdown
# 诗云 · 古诗词学习系统

> 家庭古诗词学习管理工具 · 部编版 1-6 年级 112 首必背古诗词
> AI 配图配音 · SM-2 科学复习 · 离线运行 · 1-2 个孩子独立进度

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.0.0-green.svg)](#)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](#)

诗云是一个**家庭场景**的古诗词学习系统，由两部分组成：

1. **诗云-生成器**（家长用）：浏览器打开，调用 OpenAI 一次性生成 112 首诗词的扩展内容（翻译/背景/配图/音频）
2. **诗云-学习版**（孩子用）：单 HTML 文件，双击即用，完全离线，5 大功能模块（学习/复习/考核/打印/进度）

---

## 目录

- [快速开始](#快速开始)
  - [家长：5 分钟上手](#家长5-分钟上手)
  - [开发者：本地开发](#开发者本地开发)
- [产品介绍](#产品介绍)
  - [愿景](#愿景)
  - [5 大功能](#5-大功能)
  - [技术亮点](#技术亮点)
- [架构](#架构)
  - [双产物架构](#双产物架构)
  - [数据流](#数据流)
  - [文件结构](#文件结构)
- [开发者指南](#开发者指南)
  - [环境要求](#环境要求)
  - [构建与测试](#构建与测试)
  - [项目结构说明](#项目结构说明)
  - [扩展开发](#扩展开发)
- [家长指南](#家长指南)
  - [首次使用](#首次使用)
  - [日常使用](#日常使用)
  - [打印复习材料](#打印复习材料)
  - [多孩子支持](#多孩子支持)
- [数据隐私](#数据隐私)
- [故障排查](#故障排查)
- [路线图](#路线图)
- [贡献](#贡献)
- [致谢](#致谢)
- [许可](#许可)

---

## 快速开始

### 家长：5 分钟上手

> 适用对象：希望快速给 1-2 个孩子用上诗云的家长

**第 1 步：生成内容（一次性，30 分钟）**

1. 浏览器（Chrome/Edge）双击打开 `诗云-生成器.html`
2. 配置 OpenAI API Key（[申请地址](https://platform.openai.com/api-keys)）— 仅在浏览器本地保存，不上传
3. 选择年级范围（默认全选 1-6 年级）
4. 点击「开始生成」→ 等待约 30 分钟（112 首 × 3 种内容 = 336 次 AI 调用）
5. 生成完成后点击「导出学习版」→ 下载 `诗云-学习版.html`（约 5-50 MB）

> 💡 **提示**：生成时不要关闭浏览器。生成器支持断点续传：意外关闭后再次打开会从上次中断处继续。

**第 2 步：给孩子使用**

1. 把 `诗云-学习版.html` 复制到孩子的设备（电脑/平板）
2. 双击打开（无需安装、无需联网）
3. 首次打开：创建用户档案（姓名 + 年级 + emoji 头像）
4. 开始学习！

### 开发者：本地开发

> 适用对象：希望修改源码、提交 PR、扩展功能的开发者

```bash
# 1. 克隆仓库
git clone https://github.com/yourname/shiyun.git
cd shiyun

# 2. 安装依赖
npm install

# 3. 运行单元测试
npm test

# 4. 开发模式：直接用浏览器打开 src/learning.html
#    Windows: start src/learning.html
#    macOS:   open src/learning.html
#    Linux:   xdg-open src/learning.html

# 5. 构建生产版本
npm run build
# 产物：dist/诗云-学习版.html
```

---

## 产品介绍

### 愿景

打造"**双击即用 + 科学复习 + 离线友好**"的家庭古诗词学习工具：

- **零运维**：纯静态 HTML，无服务器、无数据库
- **AI 个性化**：112 首诗词全部由 AI 配图、配音、注释，贴合诗词意境
- **科学复习**：基于 SM-2 间隔重复算法，让孩子在记忆临界点复习
- **多维筛选**：按年级、作者、朝代、复习需求筛选
- **A4 打印**：4 种版式（经典欣赏 / 默写练习 / 密集复习 / 学习讲义）

### 5 大功能

| 模块 | 路径 | 关键能力 |
|------|------|---------|
| 📖 **学新诗** | 首页 → 学新诗 | 列表筛选、详情页、朗读、收藏 |
| 🔄 **复习** | 首页 → 今日复习 | SM-2 算法判定待复习、自动安排 |
| ✏️ **考核** | 首页 → 考核 | 4 种模式（填空/选择/排序/听诗） |
| 🖨️ **打印** | 首页 → 打印 | 4 种版式、浏览器原生打印 |
| 📊 **进度** | 首页 → 进度 | 统计/曲线/饼图/12 枚徽章 |

### 技术亮点

- **零运行时依赖**：浏览器原生 ES Modules，无 React/Vue
- **零打印库**：`@media print` + 4 种自定义版式
- **零图表库**：纯 SVG 折线图 + 饼图
- **零 Python 包**：构建脚本仅用标准库
- **零后端**：localStorage 存进度，base64 内嵌媒体
- **小体积**：不含媒体的 HTML < 500 KB，含全部媒体 < 50 MB

---

## 架构

### 双产物架构

```
                ┌─────────────────┐
                │ 诗云-生成器.html │ (家长·一次性)
                │  • 配置 API Key  │
                │  • 调 OpenAI     │
                │  • 导出学习版    │
                └────────┬────────┘
                         │ 嵌入完整数据
                         ↓
                ┌─────────────────┐
                │ 诗云-学习版.html │ (孩子·日常·离线)
                │  • 112 首诗词    │
                │  • 5 大功能      │
                │  • localStorage  │
                └─────────────────┘
```

### 数据流

1. **生成阶段**（联网）
   - 家长在生成器中配置 API Key
   - 生成器逐首调 OpenAI（文本/图像/音频）
   - 生成的数据通过 Python 脚本嵌入到学习版 HTML
2. **学习阶段**（离线）
   - 孩子双击学习版，所有功能本地运行
   - 学习进度写入 localStorage
   - 媒体资源（base64）从 HTML 内嵌加载

### 文件结构

```
诗云/
├── docs/
│   ├── superpowers/
│   │   ├── specs/2026-06-16-诗云-design.md   # 设计文档
│   │   └── plans/                             # 实施计划
│   ├── architecture.md                        # 架构详解
│   ├── developer-guide.md                     # 开发者指南
│   ├── parent-guide.md                        # 家长指南
│   └── troubleshooting.md                     # 故障排查
│
├── 诗云-生成器.html              # 产物1：AI 内容生成器（家长用）
│
├── src/                          # 学习版源码
│   ├── learning.html              # 学习版入口模板
│   ├── css/{main,print}.css
│   ├── js/
│   │   ├── data.js storage.js router.js srs.js audio.js print.js
│   │   └── ui/{home,learn,review,quiz,print,progress,user-switcher}.js
│   ├── data/poems-meta.js         # 112 首诗词元数据
│   └── lib/pinyin-pro.js          # 拼音库
│
├── tests/
│   ├── *.test.js                  # 单元测试（Vitest）
│   ├── build.test.py              # 构建脚本测试（pytest）
│   └── e2e/                       # 端到端测试
│       ├── manual-test.md
│       └── automated-test.md
│
├── scripts/
│   └── build_learning.py          # 打包学习版（Python 3.8+）
│
├── dist/                          # 构建产物
│   └── 诗云-学习版.html           # 产物2：可分发的学习版
│
├── package.json
├── vitest.config.js
├── README.md                      # 本文件
└── LICENSE
```

---

## 开发者指南

> 详细开发者文档参见 [`docs/developer-guide.md`](docs/developer-guide.md)。以下是快速参考。

### 环境要求

- **Node.js** 18+ （开发模式）
- **Python** 3.8+ （构建脚本）
- **现代浏览器**：Chrome 90+ / Edge 90+ / Firefox 88+ / Safari 14+
- **操作系统**：Windows / macOS / Linux

### 构建与测试

```bash
# 单元测试（Vitest）
npm test                    # 跑一次
npm run test:watch          # 监视模式

# 构建（Python）
npm run build               # 等价于 python scripts/build_learning.py
npm run build:py            # 同上

# 构建测试（pytest，可选）
pip install pytest
npm run build:test          # pytest tests/build.test.py -v
```

### 项目结构说明

- **`src/js/`** 是模块化代码，按 ES Modules 加载
- **`src/js/data.js`** 是诗词数据层，`poems` 是运行时 Map
- **`src/js/storage.js`** 是 localStorage 封装，含多用户管理
- **`src/js/srs.js`** 是 SM-2 算法实现
- **`src/js/ui/`** 是各页面 UI（home/learn/review/quiz/print/progress/user-switcher）
- **`src/css/`** 包含 main.css（屏幕样式）和 print.css（打印样式）
- **`scripts/build_learning.py`** 读取 src/ 输出 dist/

### 扩展开发

**添加一首诗：**
1. 编辑 `src/data/poems-meta.js`
2. 在 POEMS_META 数组追加 `{ id, title, author, dynasty, grade, type, content, ... }`
3. 跑 `npm test` 验证完整性
4. 跑 `npm run build` 重新打包

**添加一个成就：**
1. 编辑 `src/js/ui/progress.js` 的 `ACHIEVEMENT_DEFS`
2. 追加 `{ id, name, desc, icon, check }`
3. 测试：手动完成触发条件 → 徽章应解锁

**修改打印版式：**
1. 编辑 `src/js/print.js`（render*Page 函数）
2. 编辑 `src/css/print.css`（@media print 和屏幕预览）
3. 测试：`npm run build` → 双击 dist 文件 → 浏览器打印预览

**接入新的 AI 提供商：**
1. 参考 `src/js/openai-client.js`（生成器端）
2. 实现文本/图像/音频三种接口
3. 生成器 UI 中切换 base URL 和模型名

---

## 家长指南

> 详细家长文档参见 [`docs/parent-guide.md`](docs/parent-guide.md)。

### 首次使用

1. 双击 `诗云-生成器.html`
2. 填入 OpenAI API Key → 点「验证」（绿色✓=可用）
3. 选择孩子的年级范围
4. 点「开始生成」→ 等待约 30 分钟
5. 点「导出学习版」→ 得到 `诗云-学习版.html`

### 日常使用

**孩子的使用流程（典型 30 分钟）：**

1. 打开 `诗云-学习版.html` → 点头像确认是「小明」/「小红」
2. 首页「今日复习 N 首」→ 点「开始复习」→ 完成 5-10 道题
3. 「学新诗」→ 选年级 → 选一首诗 → 看详情 → 朗读 3 遍 → 收藏
4. 「我学完了」→ 简短考核 → 进度更新

**家长每周：**
- 打印一份「密集复习卡」让孩子带去学校
- 查看「进度」页了解学习曲线

### 打印复习材料

1. 进「打印」tab
2. 选筛选条件（建议：年级 + 已学 + 收藏）
3. 选版式（推荐「密集复习卡」一页 4 首）
4. 点「🖨️ 打印」→ 选「另存为 PDF」→ 发送到打印机

### 多孩子支持

- 点头像 → 列表 → 「+ 新建用户」
- 输入姓名、年级、emoji 头像
- 切换时点头像 → 选另一个孩子
- 每个孩子的进度完全独立

---

## 数据隐私

诗云的设计哲学是**用户数据归用户所有**：

- ✅ **本地存储**：所有学习进度存在浏览器 localStorage，不上传任何服务器
- ✅ **API Key 本地保存**：OpenAI Key 仅存在浏览器 localStorage，仅在生成阶段使用
- ✅ **离线运行**：学习版完全离线，无任何外部请求（除生成阶段）
- ✅ **可导出/导入**：进度支持 JSON 导出备份，跨设备迁移
- ✅ **无追踪**：无 Google Analytics、无 Cookie、无第三方分析

**唯一外部通信**：在生成阶段，生成器调用 OpenAI API（文本/图像/音频），发送内容是诗词标题/作者，接收生成结果。

**建议**：
- 家长在公共设备上使用后，点「退出」/「清除」按钮
- 定期「导出进度」做备份
- 不要把含 API Key 的生成器文件分享给他人

---

## 故障排查

> 详细故障排查参见 [`docs/troubleshooting.md`](docs/troubleshooting.md)。

### 常见问题

| 问题 | 解决 |
|------|------|
| 双击 HTML 打开是空白页 | 浏览器版本过低，升级到 Chrome 90+ |
| 生成器提示「API Key 无效」 | 重新到 OpenAI 控制台复制，注意去掉首尾空格 |
| 朗读按钮无反应 | 该诗尚未生成音频（学习版由生成器嵌入媒体） |
| 拼音不显示 | 检查 `dist/lib/pinyin-pro.js` 是否存在 |
| 进度数据丢失 | 检查是否清空浏览器数据；定期用「导出进度」备份 |
| 打印出来没图 | 打印对话框选「打印背景图形」（Chrome 高级选项） |
| 多用户切换混乱 | 每个用户有独立 ID，删除前确保是当前用户 |

### 错误处理（参考设计文档第 9 节）

| 场景 | 诗云的处理 |
|------|-----------|
| API Key 无效 | 生成器实时校验，红色提示 |
| AI 生成某首失败 | 单首标记失败、可重试，不阻塞其他 |
| 网络中断 | 生成器断点续传，下次打开恢复 |
| 浏览器不兼容 | 在首页检测，提示升级 |
| localStorage 满 | 提示用户导出进度，重置 |
| 误删学习版 | 从备份（家长生成的源文件）重新生成 |
| 误操作清除进度 | 设置页「导入进度」JSON 文件恢复 |

### 调试技巧

- **Chrome DevTools → Console**：查看 JS 错误
- **Chrome DevTools → Application → LocalStorage**：查看 `shiyun_state`
- **Chrome DevTools → Network**：学习版应无任何外部请求
- **构建失败**：跑 `python scripts/build_learning.py --verbose` 看详细日志

---

## 路线图

### 已完成（v1.0）
- ✅ 112 首诗词元数据
- ✅ 数据层（data.js）
- ✅ AI 客户端（OpenAI）
- ✅ 生成器（API Key / 生成 / 导出）
- ✅ 学习版骨架 + 路由
- ✅ 4 种考核模式
- ✅ SM-2 复习算法
- ✅ 4 种打印版式
- ✅ 进度管理 + 12 枚徽章
- ✅ 多用户切换（1-2 个孩子）
- ✅ Python 构建脚本

### 计划中（v1.1+）
- 📱 PWA 离线安装（添加到主屏幕）
- 🌙 暗色模式
- 🔊 朗读时显示字幕（跟读）
- 📤 微信公众号集成（菜单/文章/海报）
- 🎮 微信小游戏（闯关/拼诗/飞花令）
- 🤖 多 AI 提供商（Claude / 文心 / 通义）
- 📊 家长学习报告（每周邮件）

### 不做（YAGNI）
- ❌ 用户注册、登录系统
- ❌ 多设备同步
- ❌ 服务端 / 数据库
- ❌ 移动 App
- ❌ 朗读评分 / 语音识别
- ❌ 支付 / 商业化

---

## 贡献

欢迎贡献！无论是 bug 报告、功能建议、还是代码 PR。

### 如何贡献

1. Fork 本仓库
2. 创建 feature 分支（`git checkout -b feature/amazing-feature`）
3. 提交改动（`git commit -m 'feat: 添加某某功能'`）
4. 推送到分支（`git push origin feature/amazing-feature`）
5. 发起 Pull Request

### 提交规范

- `feat:` 新功能
- `fix:` 修复 bug
- `docs:` 文档变更
- `style:` 代码格式（无逻辑变更）
- `refactor:` 重构（无功能变更）
- `test:` 测试相关
- `chore:` 杂项（构建/依赖等）

### 测试要求

- 所有 PR 必须通过 `npm test`
- 修改打印 / 进度 / 用户相关请跑 `tests/e2e/manual-test.md` 相关章节
- 新功能应附单元测试

---

## 致谢

### 诗词来源
- 教育部《义务教育语文课程标准》
- 部编版（人教社）小学语文 1-6 年级教材必背篇目

### 技术栈
- [OpenAI](https://openai.com/) - GPT-4o-mini / DALL-E 3 / TTS-1
- [pinyin-pro](https://github.com/zh-lx/pinyin-pro) - 浏览器端拼音库
- [Vitest](https://vitest.dev/) - 单元测试框架
- [Python](https://www.python.org/) - 构建脚本

### 灵感
- [Anki](https://apps.ankiweb.net/) - SM-2 算法来源
- [Kids Vocab](https://example.com) - 家庭学习产品参考

### 贡献者
- 项目维护者：[Your Name](https://github.com/yourname)
- 提交者列表：[Contributors](https://github.com/yourname/shiyun/graphs/contributors)

---

## 许可

本项目采用 [MIT License](LICENSE)。

```
MIT License

Copyright (c) 2026 诗云项目贡献者

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 联系方式

- 问题反馈：[GitHub Issues](https://github.com/yourname/shiyun/issues)
- 邮件：shiyun@example.com
- 微信公众号：搜索「诗云」（规划中）

> 用爱发电 ❤️ · 让每个家庭都能轻松学古诗词
```

## Step 2: 创建 docs/architecture.md

```markdown
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

### 用户状态（localStorage）

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

- 构建时复制 `node_modules/pinyin-pro/dist/index.js` 到 `dist/lib/`
- 学习版通过 `<script src="./lib/pinyin-pro.js">` 加载（非 ES Module）
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
```

## Step 3: 创建 docs/developer-guide.md

```markdown
# 诗云 · 开发者指南

> 详细架构参见 [`architecture.md`](architecture.md)。本文档专注开发流程。

## 目录

- [环境搭建](#环境搭建)
- [开发工作流](#开发工作流)
- [代码规范](#代码规范)
- [测试规范](#测试规范)
- [构建与发布](#构建与发布)
- [调试技巧](#调试技巧)
- [常见任务](#常见任务)

---

## 环境搭建

### 1. 安装 Node.js

```bash
# 推荐使用 nvm
nvm install 18
nvm use 18

# 验证
node --version  # 应 ≥ 18
```

### 2. 安装 Python（仅构建需要）

```bash
# macOS
brew install python3

# Windows
# 从 https://www.python.org/ 下载 3.8+

# Linux
sudo apt install python3

# 验证
python3 --version  # 应 ≥ 3.8
```

### 3. 克隆与安装

```bash
git clone https://github.com/yourname/shiyun.git
cd shiyun
npm install
```

### 4. 验证

```bash
npm test            # 跑单元测试
npm run build       # 构建（应生成 dist/诗云-学习版.html）
```

---

## 开发工作流

### 推荐 IDE 设置

- **VS Code** + 扩展：ESLint, Prettier, Vitest, Python
- `.vscode/settings.json`（推荐）：
  ```json
  {
    "editor.formatOnSave": true,
    "editor.tabSize": 2,
    "files.encoding": "utf8"
  }
  ```

### 日常开发

```bash
# 1. 启动监视测试
npm run test:watch

# 2. 在浏览器打开 src/learning.html（开发模式）
#    - 文件路径直开即可（无服务器）
#    - 注意：开发态需要 pinyin-pro 在 src/lib/ 下

# 3. 修改 src/ 下的文件 → 浏览器刷新即可看到效果

# 4. 改完跑一遍相关测试 + 手动验证
```

### 调试构建

```bash
# 详细输出
python scripts/build_learning.py --verbose

# 检查不写文件
python scripts/build_learning.py --check
```

---

## 代码规范

### JavaScript

- **风格**：ES Modules，无构建步骤
- **导出**：用 `export function`（不用 `default` 除非必要）
- **命名**：
  - 函数/变量：camelCase
  - 类：PascalCase
  - 常量：UPPER_SNAKE_CASE
  - 文件名：kebab-case.js
- **注释**：JSDoc 风格，函数前必须有 `@param`/`@returns`
- **错误处理**：用 `try/catch`，不要静默吞错

### CSS

- **命名**：BEM 风格（`block__element--modifier`）
- **变量**：CSS 自定义属性（`--color-primary`）
- **单位**：rem / em / 百分比为主，px 仅用于边框等不可缩放属性
- **打印**：所有样式分两部分（屏幕 + `@media print`）

### Git 提交

- 提交信息：`<type>(<scope>): <subject>`
- 类型：`feat` / `fix` / `docs` / `style` / `refactor` / `test` / `chore`
- 示例：`feat(quiz): 添加填空模式判分逻辑`
- 主题用中文或英文皆可，但保持一致

### 文件组织

```
src/js/
├── data.js              # 诗词数据层（必须最先加载）
├── storage.js           # localStorage 封装
├── srs.js               # SM-2 算法
├── router.js            # 路由
├── audio.js             # 音频播放
├── print.js             # 打印排版（核心）
├── ui/
│   ├── home.js
│   ├── learn.js
│   ├── review.js
│   ├── quiz.js
│   ├── print.js         # 打印 UI
│   ├── progress.js
│   └── user-switcher.js
```

加载顺序由 `scripts/build_learning.py` 的 `JS_LOAD_ORDER` 控制。

---

## 测试规范

### 单元测试（Vitest）

- **位置**：`tests/*.test.js`
- **命名**：`<module>.test.js` 对应 `<module>.js`
- **覆盖**：纯函数（计算、解析、状态机）必须有测试
- **不覆盖**：UI 渲染（用 E2E 手动测试）

**示例**：
```javascript
// tests/srs.test.js
import { describe, it, expect } from 'vitest';
import { calculateNextReview } from '../src/js/srs.js';

describe('calculateNextReview', () => {
  it('得分 ≥ 90 应延长间隔', () => {
    const r = calculateNextReview({ score: 95, prevInterval: 5 });
    expect(r.interval).toBeGreaterThan(5);
  });

  it('得分 < 70 应重置间隔', () => {
    const r = calculateNextReview({ score: 50, prevInterval: 10 });
    expect(r.interval).toBe(1);
  });
});
```

### 集成测试

- 位置：`tests/build.test.py`（pytest）
- 覆盖：构建脚本的输出文件结构、HTML 完整性

### E2E 测试

- 位置：`tests/e2e/manual-test.md`
- 频率：每次发布前
- 详细：[`e2e/manual-test.md`](e2e/manual-test.md)

### 跑测试

```bash
npm test                  # 单元测试
npm run test:watch        # 监视
npm run build:test        # 构建测试（需 pytest）
```

---

## 构建与发布

### 本地构建

```bash
# 1. 确保测试通过
npm test

# 2. 构建
npm run build

# 3. 验证
ls -la dist/诗云-学习版.html
# 应 < 50 MB（不含媒体时 < 1 MB）
```

### 发布流程

1. 更新版本号：`package.json` 和 `README.md`
2. 更新 `CHANGELOG.md`
3. 跑 `npm test` + `npm run build` + 手动 E2E
4. 提交：`git commit -m "chore: release v1.x.y"`
5. 打 tag：`git tag v1.x.y`
6. 推送：`git push origin main --tags`
7. 创建 GitHub Release（附 `dist/诗云-学习版.html`）

---

## 调试技巧

### Chrome DevTools

#### 1. 查看 localStorage

```
DevTools → Application → Storage → Local Storage → file://
```

找到 `shiyun_state` 键，查看 JSON 结构。

#### 2. 测试 storage 函数

```javascript
// 在 Console 中
const { getCurrentUserState, switchUser } = await import('./src/js/storage.js');
console.log(getCurrentUserState());
```

#### 3. 模拟 API 失败

```javascript
// 在生成器的 Console 中覆盖 fetch
const originalFetch = window.fetch;
window.fetch = (url, options) => {
  if (url.includes('openai.com')) {
    return Promise.reject(new Error('Mocked network error'));
  }
  return originalFetch(url, options);
};
```

#### 4. 性能分析

```
DevTools → Performance → Record → 操作 → Stop
```

查看是否有长任务（> 50ms）。

#### 5. 内存泄漏

```
DevTools → Memory → Take heap snapshot → 操作 → Take heap snapshot → Compare
```

### 常见问题

**Q: 修改后浏览器没反应？**
A: 强制刷新（Ctrl+Shift+R / Cmd+Shift+R）

**Q: 进度数据突然丢失？**
A: 检查 `localStorage.clear()` 是否被误调；用「导出进度」备份

**Q: 构建失败但本地没问题？**
A: 检查 `src/learning.html` 占位符（`{{INLINE_CSS}}` / `{{INLINE_JS}}` / `{{POEMS_META_JSON}}`）

---

## 常见任务

### 添加一首诗

```bash
# 1. 编辑 src/data/poems-meta.js，追加：
#    { id: 'g3-21', title: '新诗', author: '...', dynasty: '...',
#      grade: 3, type: '...', sequence: 21, source: '...',
#      content: ['...', '...', ...] }

# 2. 跑测试
npm test -- tests/data-poems-meta.test.js

# 3. 跑构建
npm run build

# 4. 验证：双击 dist/诗云-学习版.html 看到新诗
```

### 添加一个成就

```javascript
// 1. 编辑 src/js/ui/progress.js，找到 ACHIEVEMENT_DEFS，追加：
//    { id: 'new-ach', name: '新成就', desc: '说明', icon: '🎉',
//      check: (state) => /* 触发条件 */ }

// 2. 跑测试
npm test -- tests/progress.test.js

# 3. 验证：手动触发条件 → 徽章墙显示新成就高亮
```

### 修改打印版式

```css
/* 1. 编辑 src/css/print.css，修改 .page-classic 样式 */

/* 2. 编辑 src/js/print.js 的 renderClassicPage 函数 */

/* 3. 验证：
   - 浏览器开发模式刷新
   - 打开打印页 → 切换到经典版 → 看预览
   - 浏览器打印预览 → 看效果
*/
```

### 接入新 AI 提供商

```javascript
/* 1. 创建 src/js/ai-clients/anthropic-client.js：
   export class AnthropicClient {
     async generateText({ systemPrompt, userPrompt }) { ... }
     async generateImage({ prompt }) { ... }
     async generateAudio({ text }) { ... }
   }
*/

/* 2. 在生成器 UI 添加选择下拉 */
/* 3. 测试：用 Anthropic API Key 验证生成 */
/* 4. 跑构建 */
```
```

## Step 4: 创建 docs/parent-guide.md

```markdown
# 诗云 · 家长使用指南

> 本指南面向**非技术背景**的家长，用通俗语言解释如何使用诗云帮助孩子学习古诗词。

## 目录

- [什么是诗云](#什么是诗云)
- [快速开始（5 分钟）](#快速开始5-分钟)
- [日常使用](#日常使用)
- [4 种考核模式怎么选](#4-种考核模式怎么选)
- [打印怎么用最划算](#打印怎么用最划算)
- [如何鼓励孩子](#如何鼓励孩子)
- [数据安全说明](#数据安全说明)
- [常见问题](#常见问题)

---

## 什么是诗云

诗云是一个**家庭场景**的古诗词学习系统，专为 1-6 年级小学生设计。它有两个部分：

1. **诗云-生成器**（家长用一次）：用 AI 给 112 首诗配上图片、音频、注释
2. **诗云-学习版**（孩子天天用）：一个 HTML 文件，双击就能用，不需要联网

**最棒的是**：一次配置，孩子能用到高中（12 年级），完全离线，零广告，零打扰。

---

## 快速开始（5 分钟）

### 第 1 步：注册 OpenAI（仅首次需要）

1. 打开 https://platform.openai.com/
2. 注册账号（需要科学上网）
3. 充值 $5（约 35 元，够用 1 年）
4. 创建 API Key：https://platform.openai.com/api-keys
5. 复制 Key（一串 `sk-...` 字符）

> 💡 **OpenAI 是什么？** 是国外一家 AI 公司，提供 GPT 文本生成、DALL-E 图像生成、TTS 语音合成。本项目用它的 API 一次性生成 112 首诗的扩展内容。

### 第 2 步：运行生成器

1. 浏览器双击 `诗云-生成器.html`（推荐 Chrome / Edge）
2. 粘贴 API Key → 点「验证」（绿色✓=可用）
3. 选择孩子年级（默认全选 1-6）
4. 点「开始生成」→ 等待约 30 分钟
5. 完成后点「导出学习版」→ 下载文件

> 💡 **生成要多久？** 112 首诗 × 3 种内容（文本/图片/音频）= 约 336 次 AI 调用。正常 30 分钟。如果网络慢可能 1-2 小时。

### 第 3 步：给孩子用

1. 把 `诗云-学习版.html` 复制到孩子的设备（电脑 / 平板 / 手机）
2. 双击打开
3. 第一次：点头像 → 「+ 新建用户」→ 填姓名/年级/选 emoji 头像
4. 开始学习！

---

## 日常使用

### 推荐每日 30 分钟流程

**前 10 分钟：复习**
1. 打开学习版
2. 点头像确认是孩子本人
3. 点「今日复习」→ 完成 5-10 道题
4. 错的题 → 答案会自动显示

**中间 15 分钟：学新诗**
1. 点「学新诗」
2. 选一首孩子喜欢的诗
3. 详情页：先看图想象 → 听 3 遍朗读 → 跟读 2 遍
4. 点「我学完了」→ 简短考核

**最后 5 分钟：考核 + 进度**
1. 点「考核」→ 选模式（推荐「填空」）
2. 完成 10-20 题
3. 点「进度」看本周学习了多少

### 周计划

| 时间 | 内容 |
|------|------|
| 周一 | 学 1-2 首新诗 |
| 周二 | 复习 + 默写 1 首 |
| 周三 | 考核 20 题 |
| 周四 | 学新诗 + 朗读练习 |
| 周五 | 打印一份「密集复习卡」带去学校 |
| 周末 | 家长陪孩子读 / 讲诗的故事 |

---

## 4 种考核模式怎么选

| 模式 | 难度 | 适合 | 说明 |
|------|------|------|------|
| **填空** | ★★ | 3-6 年级 | 把诗里挖 1-2 个空，孩子从字库选字填 |
| **选择** | ★ | 1-2 年级 | 给上句选下句，4 选 1 |
| **排序** | ★★★ | 4-6 年级 | 打乱 4 句，孩子拖动排序 |
| **听诗** | ★★ | 全年级 | 播放 AI 朗读，4 首诗名里选听到的 |

**推荐组合**：
- 1 年级：听诗 100% + 选择 50%
- 3 年级：填空 70% + 选择 30%
- 6 年级：填空 50% + 排序 30% + 听诗 20%

---

## 打印怎么用最划算

### 4 种版式选择

| 版式 | 用途 | 何时用 |
|------|------|--------|
| **经典欣赏版** | 欣赏 + 朗读 | 周末陪孩子读 |
| **默写练习版** | 默写训练 | 周末默写 1-2 首 |
| **密集复习卡** | 携带复习 | 打印带去学校 |
| **学习讲义版** | 备课 | 家长备课用 |

### 推荐打印流程

1. 点「打印」tab
2. 筛选条件选：
   - **年级**：当前年级
   - **复习需求**：选「今日待复习」或「已收藏」
3. 版式选「**密集复习卡**」（一页 4 首，最省纸）
4. 点「🖨️ 打印」→ 「另存为 PDF」→ 发到打印机
5. A4 纸张，纵向，无页眉页脚

### 省纸技巧

- 选「密集复习卡」一页 4 首
- 双向打印
- 字号 9pt 仍可读

---

## 如何鼓励孩子

### 1. 善用徽章系统

进度页有 12 枚徽章，孩子会主动想解锁：

- 🌱 **初窥诗门**：学完第 1 首诗
- ⭐ **初窥诗门·掌握**：掌握第 1 首诗
- 🌟 **小有所成**：掌握 10 首诗
- 🎖️ **诗词童子**：掌握 30 首诗
- 🏅 **诗中秀才**：掌握 50 首诗
- 👑 **诗中之圣**：掌握 100 首诗
- 🏆 **诗云之巅**：掌握全部 112 首
- 📝 **勤学不辍**：完成 10 次考核
- 🎯 **考核达人**：完成 100 次考核
- 🔥 **七日连读**：连续 7 天学习
- 🌙 **月圆诗成**：连续 30 天学习
- 📚 **博览群朝**：覆盖所有朝代

### 2. 设定小目标

和孩子一起定：
- 「这个月掌握 10 首诗就奖励 XXX」
- 「连续 7 天学习解锁 🔥 徽章」

### 3. 一起读诗

周末抽 15 分钟，和孩子一起看「经典欣赏版」打印件：
- 你念一句，孩子念一句
- 讲讲诗的故事（背景）
- 让孩子背最喜欢的 1 句

### 4. 不要强迫

- 不强求每天 30 分钟
- 孩子烦了就停
- 考试前突击也来得及（AI 知道哪些待复习）

---

## 数据安全说明

**诗云不收集任何用户数据**：

- ✅ 学习进度存在孩子设备的浏览器（localStorage）
- ✅ 不上传任何服务器
- ✅ 不发邮件、不发短信
- ✅ API Key 仅在家长电脑上保存

**你唯一需要担心的**：

1. **孩子清空浏览器数据** → 进度丢失
   - 解决：定期让孩子点「进度 → 导出进度」备份

2. **电脑坏了** → 进度丢失
   - 解决：把 `诗云-学习版.html` + 导出的 JSON 多存几处（U 盘、网盘）

3. **OpenAI Key 泄露** → 别人能用你的额度
   - 解决：不要把生成器文件发给别人；定期在 OpenAI 控制台查看用量

---

## 常见问题

### Q1：双击 HTML 没反应？

A：可能是默认浏览器问题。
- Windows：右键 → 打开方式 → 选 Chrome
- macOS：右键 → 打开方式 → 其他 → 选 Chrome

### Q2：生成很慢，怀疑卡住了？

A：在生成器页面看进度条。
- 如果进度条 > 5 分钟没动 → 检查网络（可能需要科学上网）
- 如果一直 0% → 检查 API Key 是否有效

### Q3：朗读没声音？

A：检查
1. 设备是否静音
2. 是否允许浏览器播放声音
3. 该诗是否已生成音频（有些生成失败的诗没音频）

### Q4：进度丢失了怎么恢复？

A：
1. 找到最近的「诗云-进度-XXXX.json」备份文件
2. 打开学习版 → 进度页 → 导入进度 → 选文件
3. 没有备份的话……只能重新学习（所以建议每周导出 1 次）

### Q5：能多设备共享进度吗？

A：当前**不支持**。每个设备的进度独立。
- 临时方案：导出 JSON → 在另一设备导入
- 未来方案：PWA + 云同步（在路线图）

### Q6：API Key 安全吗？

A：
- Key 仅存在你的浏览器 localStorage（本地）
- 生成器直连 OpenAI API，不过中间服务器
- 但**不要把生成器 HTML 文件分享给不信任的人**
- 建议在 OpenAI 控制台设月度限额（如 $5/月）

### Q7：能换其他 AI 吗？

A：可以，技术上支持。修改 `src/js/openai-client.js` 切换为：
- Claude（[anthropic.com](https://anthropic.com)）
- 文心一言（百度）
- 通义千问（阿里）
- DeepSeek（国内，便宜）
详见 [developer-guide.md](developer-guide.md) 的「接入新 AI 提供商」章节。

### Q8：能加新诗吗？

A：可以，编辑 `src/data/poems-meta.js` 追加条目，详见 [developer-guide.md](developer-guide.md)。

---

## 联系支持

- GitHub Issues（推荐）：https://github.com/yourname/shiyun/issues
- 邮件：shiyun@example.com
- 微信公众号：搜索「诗云」（规划中）

> **最后**：诗云是开源免费软件，作者不提供商业支持。请善用 GitHub Issues 搜索相似问题。
```

## Step 5: 创建 docs/troubleshooting.md

```markdown
# 诗云 · 故障排查

> 本文汇总常见问题及解决方案。

## 目录

- [构建问题](#构建问题)
- [生成器问题](#生成器问题)
- [学习版问题](#学习版问题)
- [打印问题](#打印问题)
- [进度数据问题](#进度数据问题)
- [浏览器兼容性](#浏览器兼容性)
- [性能问题](#性能问题)
- [设计文档第 9 节错误处理清单](#设计文档第-9-节错误处理清单)

---

## 构建问题

### 构建脚本报错 `ModuleNotFoundError`

**症状**：
```
ModuleNotFoundError: No module named 'xxx'
```

**原因**：脚本依赖了第三方包，但我们只用标准库。

**解决**：
```bash
# 确认 Python 版本
python --version  # 应 ≥ 3.8

# 重新执行（不应需要 pip install）
python scripts/build_learning.py
```

### 构建产物太大（> 50MB）

**症状**：`dist/诗云-学习版.html` 超过 50 MB

**原因**：内嵌了过多 base64 媒体（112 首诗 × 图片+音频）

**解决**：
1. 在生成器中重新生成时**降低图片质量**（DALL-E 3 用 `quality: 'standard'` 而非 `hd`）
2. 减少音频时长（截取关键 30 秒）
3. 未来优化：媒体按需加载（首屏只加载 1 年级）

### 诗词元数据解析失败

**症状**：
```
[ERROR] 诗词 JSON 解析失败: Unexpected token
```

**原因**：`src/data/poems-meta.js` 格式非标准

**解决**：
1. 用 `node -e "const m = require('./src/data/poems-meta.js'); console.log(m.POEMS_META.length);"` 测试
2. 确保 export 语法正确：`export const POEMS_META = [...]`
3. 确保所有字符串用单引号

---

## 生成器问题

### API Key 验证失败

**症状**：红色提示「API Key 无效」

**解决**：
1. 重新复制 Key，注意去掉首尾空格
2. 检查 OpenAI 账户余额（[Usage 页面](https://platform.openai.com/usage)）
3. 检查是否需要科学上网
4. 测试其他模型：`curl https://api.openai.com/v1/models -H "Authorization: Bearer sk-..."`

### 单首诗生成失败

**症状**：进度条卡在某首 / 某首标红

**解决**：
1. **重试单首**：生成器 UI 应有「重新生成」按钮
2. **跳过这首**：点「标记完成」→ 临时填占位内容 → 继续
3. **检查 quota**：OpenAI 可能有 rate limit

### 浏览器崩溃 / 关闭后丢失进度

**症状**：意外关闭后，下次打开又要重新生成

**解决**：
- 生成器应有断点续传逻辑（已生成的诗在 IndexedDB / localStorage）
- 重新打开会自动恢复
- 若仍丢失：从最近的导出文件开始（如有）

---

## 学习版问题

### 双击 HTML 打开是空白页

**可能原因 & 解决**：

| 原因 | 解决 |
|------|------|
| 浏览器版本过低 | 升级到 Chrome 90+ / Edge 90+ / Firefox 88+ |
| 文件路径含中文/特殊字符 | 放到 `C:\shiyun\诗云-学习版.html` 试试 |
| 浏览器禁用了 JS | 设置 → 隐私 → 允许 JavaScript |
| 文件损坏 | 重新构建 / 重新下载 |

### Console 报错

**症状**：DevTools Console 有红色错误

**调试步骤**：
1. 截图错误信息
2. 搜索错误关键词
3. 常见错误：
   - `pinyinPro is not defined` → 缺 `dist/lib/pinyin-pro.js`
   - `Cannot find module './ui/xxx.js'` → 构建未完成
   - `localStorage is not available` → 隐私模式

### 朗读按钮无反应

**可能原因**：

| 原因 | 解决 |
|------|------|
| 该诗无音频（生成器未生成） | 显示「暂无音频」（应有 fallback） |
| 浏览器自动播放策略 | 让用户先点击页面任意位置 |
| 音频文件太大（> 10MB） | 改用更短的音频 |

**调试**：
```javascript
// 在 Console 中查看所有诗的音频状态
window.__SHIYUN_POEMS__.forEach(p => {
  console.log(p.id, p.title, p.audio ? '有' : '无', p.audio?.length);
});
```

### 拼音不显示

**可能原因**：
- `dist/lib/pinyin-pro.js` 缺失或被删除
- `<script src="./lib/pinyin-pro.js">` 加载失败

**解决**：
1. 重新构建：`npm run build`
2. 检查 `dist/lib/pinyin-pro.js` 文件存在
3. 浏览器 F12 → Network → 验证 pinyin-pro.js 返回 200

### 路由跳转失败

**症状**：点击 tab 无反应 / 跳到错误页

**解决**：
1. 检查 URL hash 是否正确（如 `#/learn`）
2. 浏览器后退按钮是否被劫持
3. 在 Console 中：`location.hash` 查看当前路由

---

## 打印问题

### 打印出来是空白 / 没内容

**可能原因**：
- 浏览器打印对话框选了「仅当前页」
- CSS 加载失败

**解决**：
1. 打印对话框 → 设为「所有页」
2. 验证：浏览器「打印预览」应显示完整内容
3. 检查 `dist/诗云-学习版.html` 是否含 `<link rel="stylesheet" href="./css/print.css">` 或内联 print.css

### 图片打印不出来

**可能原因**：浏览器默认不打印背景图

**解决**：
- Chrome：打印对话框 → 「更多设置」→ 勾选「打印背景图形」
- Firefox：类似选项
- 验证：先用「另存为 PDF」看是否含图

### 打印版式错乱

**可能原因**：浏览器缩放比例 / 纸张大小不对

**解决**：
1. 打印对话框 → 纸张：A4
2. 缩放：100%
3. 边距：默认 / 无
4. 方向：纵向（默认）

### 分页切断一首诗

**解决**：
- print.css 已有 `page-break-inside: avoid` 规则
- 若仍切断：把 `.poem-card` 也加 `page-break-inside: avoid`
- 终极方案：换版式（如「经典欣赏版」每页一首）

---

## 进度数据问题

### 进度突然丢失

**可能原因**：
1. 浏览器清空缓存（隐私模式 / 设置变更）
2. localStorage 写满（5-10MB 上限）
3. 多人共用电脑

**恢复**：
- 「进度 → 导入进度」选最近的 JSON 备份
- 没有备份：只能重新学习

**预防**：
- 每周「导出进度」一次
- 多处备份（U 盘、网盘）
- 不要用浏览器「无痕模式」

### 多用户进度串了

**症状**：切换到小红，看到小明的进度

**原因**：localStorage 数据被损坏 / 版本兼容问题

**解决**：
1. 打开 DevTools → Application → Local Storage
2. 找到 `shiyun_state`，查看 JSON 结构
3. 确认 `currentUser` 字段正确
4. 严重损坏：清空 localStorage 重新开始（先导出备份！）

### localStorage 满

**症状**：进度保存失败，Console 报 `QuotaExceededError`

**解决**：
1. 导出进度备份
2. 删除一些老旧记录
3. 终极：清空 localStorage 重新开始
4. 未来：迁移到 IndexedDB（更大容量）

---

## 浏览器兼容性

### Chrome / Edge（推荐）

- 版本要求：90+
- 测试覆盖：完整
- 已知问题：无

### Firefox

- 版本要求：88+
- 测试覆盖：基本
- 已知问题：打印对话框 UI 略不同

### Safari

- 版本要求：14+
- 测试覆盖：基本
- 已知问题：
  - 拖拽排序手势需额外测试
  - 音频自动播放策略更严

### 移动端

- iOS Safari 14+：基本可用，触摸优化中
- Android Chrome：基本可用
- 已知问题：
  - 拼音字体在某些 Android 设备显示异常
  - 拖拽排序需 touch events 适配

### 隐私 / 无痕模式

- localStorage 在无痕模式下会话结束即清除
- **不推荐**在无痕模式下长期使用

---

## 性能问题

### 首次打开很慢（> 5 秒）

**可能原因**：
- HTML 文件太大（> 30 MB，媒体过多）
- 设备性能差

**解决**：
1. 重新生成时降低图片分辨率（512x512 即可）
2. 音频改用更短（30 秒关键句）
3. 设备升级 / 换用电脑

### 列表页滚动卡顿

**可能原因**：112 首诗的缩略图过大

**解决**：
- 用 lazy loading
- 缩略图压缩到 200x200

### SVG 图表渲染慢

**解决**：
- 学习曲线限制 30 天（已实现）
- 饼图朝代数 < 10（已实现）
- 大数据量时改为 Canvas

---

## 设计文档第 9 节错误处理清单

| 场景 | 诗云的处理 |
|------|-----------|
| API Key 无效 | 生成器实时校验，红色提示 |
| AI 生成某首失败 | 单首标记失败、可重试，不阻塞其他 |
| 网络中断 | 生成器断点续传，下次打开恢复 |
| 浏览器不兼容 | 首页检测，提示升级 |
| localStorage 满 | 提示用户导出进度，重置 |
| 误删学习版 | 从备份（家长生成的源文件）重新生成 |
| 误操作清除进度 | 设置页「导入进度」JSON 文件恢复 |

---

## 仍无法解决？

1. **搜索 GitHub Issues**：https://github.com/yourname/shiyun/issues?q=is%3Aissue
2. **创建新 Issue**：
   - 标题：简洁描述
   - 正文：浏览器版本、操作系统、错误截图、复现步骤
3. **联系作者**：shiyun@example.com

> 提 Issue 前请先尝试清空 localStorage 重新开始（先备份），很多问题就此解决。
```

## Step 6: 创建 LICENSE

创建 `LICENSE`：

```
MIT License

Copyright (c) 2026 诗云项目贡献者

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Step 7: 在 package.json 添加 docs 脚本（修改文件）

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "build": "python scripts/build_learning.py",
    "build:py": "python scripts/build_learning.py",
    "build:test": "pytest tests/build.test.py -v",
    "docs:serve": "python -m http.server 8000 --directory docs",
    "docs:build": "echo 'No build needed for markdown docs'"
  }
}
```

## Step 8: 验证文档完整性

```bash
# 1. 验证 README
cat README.md | head -50

# 2. 验证所有 docs 文件存在
ls -la docs/
ls -la docs/architecture.md docs/developer-guide.md docs/parent-guide.md docs/troubleshooting.md

# 3. 验证 LICENSE
cat LICENSE | head -10

# 4. （可选）起一个本地服务器查看文档渲染
npm run docs:serve
# 浏览器打开 http://localhost:8000/
```

## Step 9: 提交

```bash
git add README.md docs/architecture.md docs/developer-guide.md docs/parent-guide.md docs/troubleshooting.md LICENSE package.json
git commit -m "docs: 完整文档（README + 架构 + 开发者指南 + 家长指南 + 故障排查）"
```

## 完成标志

```bash
echo done > .tasks/done/25
```

## 关键说明

- **README.md 面向两类读者**：
  - 家长：5 分钟上手、日常使用、打印、鼓励孩子
  - 开发者：本地开发、构建、扩展
  - 用目录区分，加「快速开始」和「目录」导航
- **分层文档**：
  - `README.md`：概览
  - `docs/architecture.md`：深入架构
  - `docs/developer-guide.md`：开发流程
  - `docs/parent-guide.md`：家长使用
  - `docs/troubleshooting.md`：故障排查
- **数据隐私章节**：明确说明诗云不收集数据，仅本地存储
- **故障排查覆盖**：构建 / 生成器 / 学习版 / 打印 / 进度 / 兼容性 / 性能 7 大类
- **路线图**：v1.0 完成项 + v1.1+ 计划 + 不做项（YAGNI）
- **致谢**：诗词来源、技术栈、灵感来源
- **MIT 协议**：宽松开源，利于传播
