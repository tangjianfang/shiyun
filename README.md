# 诗云 · 古诗词学习系统

> 家庭古诗词学习管理工具 · 部编版 1-6 年级 112 首必背古诗词
> AI 配图配音 · SM-2 科学复习 · 离线运行 · 1-2 个孩子独立进度

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.0.0-green.svg)](#)

诗云是一个**家庭场景**的古诗词学习系统，由两部分组成：

1. **诗云-生成器.html**（家长用）：浏览器打开，调用 OpenAI 一次性生成 112 首诗词的扩展内容（翻译/背景/配图/音频）
2. **诗云-学习版.html**（孩子用）：单 HTML 文件，双击即用，完全离线，5 大功能模块（学习/复习/考核/打印/进度）

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
- [家长指南](#家长指南)
- [数据隐私](#数据隐私)
- [故障排查](#故障排查)
- [路线图](#路线图)
- [贡献](#贡献)
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
5. 生成完成后点击「导出学习版」→ 下载 `诗云-学习版.html`（约 0.5-50 MB）

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
| 🏠 **首页** | `#/` | 当前用户摘要、今日复习入口、学习/复习/考核/打印/进度 5 个 tab |
| 📖 **学习** | `#/learn` | 列表筛选、详情页、朗读、收藏、考核 |
| 🔄 **复习** | `#/review` | SM-2 算法判定待复习、自动安排 |
| ✏️ **考核** | `#/quiz` | 4 种模式（填空/选择/排序/听诗） |
| 📊 **进度** | `#/progress` | 统计/曲线/饼图/12 枚徽章 |

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
│   ├── learning.template.html     # 单文件构建模板（含占位符）
│   ├── css/{main,print}.css
│   ├── js/
│   │   ├── data.js storage.js router.js srs.js audio.js print.js
│   │   ├── quiz/{fill,choice,order,listen}.js
│   │   ├── main.js
│   │   └── ui/{home,learn,review,quiz,print,progress,user-switcher}.js
│   ├── data/poems-meta.js         # 112 首诗词元数据
│   └── lib/pinyin-pro.js          # 拼音库
│
├── tests/
│   ├── *.test.js                  # 单元测试（Vitest）
│   ├── test_build_script.py       # 构建脚本测试（pytest）
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
npm run test:build          # 构建脚本测试（pytest）

# 构建（Python）
npm run build               # 等价于 python scripts/build_learning.py
```

### 项目结构说明

- **`src/js/`** 是模块化代码，按 ES Modules 加载
- **`src/js/data.js`** 是诗词数据层，`poems` 是运行时 Map
- **`src/js/storage.js`** 是 localStorage 封装，含多用户管理
- **`src/js/srs.js`** 是 SM-2 算法实现
- **`src/js/quiz/`** 是 4 种考核模式核心逻辑
- **`src/js/ui/`** 是各页面 UI（home/learn/review/quiz/print/progress/user-switcher）
- **`src/css/`** 包含 main.css（屏幕样式）和 print.css（打印样式）
- **`scripts/build_learning.py`** 读取 `src/learning.template.html` + `src/` 输出 `dist/诗云-学习版.html`

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
3. 「学习」→ 选年级 → 选一首诗 → 看详情 → 朗读 3 遍 → 收藏
4. 「我学完了」→ 简短考核 → 进度更新

**家长每周：**
- 打印一份「密集复习卡」让孩子带去学校
- 查看「进度」页了解学习曲线

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
| 拼音不显示 | 检查 `dist/lib/pinyin-pro.min.js` 是否存在 |
| 进度数据丢失 | 检查是否清空浏览器数据；定期用「导出进度」备份 |
| 打印出来没图 | 打印对话框选「打印背景图形」（Chrome 高级选项） |
| 多用户切换混乱 | 每个用户有独立 ID，删除前确保是当前用户 |

### 调试技巧

- **Chrome DevTools → Console**：查看 JS 错误
- **Chrome DevTools → Application → LocalStorage**：查看 `shiyun_user_state`
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

---

## 许可

本项目采用 [MIT License](LICENSE)。
