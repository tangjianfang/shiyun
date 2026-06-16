# 诗云 · 古诗词学习系统

家庭古诗词学习管理工具，包含 AI 内容生成器和学习应用。

## 目录

- [产品概述](#产品概述)
- [开发](#开发)
- [使用](#使用)
- [架构](#架构)

## 产品概述

- **诗云-生成器.html**：AI 内容生成工具（家长用，调用 OpenAI 生成 112 首诗词的扩展内容）
- **诗云-学习版.html**：孩子学习应用（双击即用，完全离线，单 HTML 文件）

## 开发

```bash
npm install
npm test
npm run build
```

## 使用

1. 双击 `诗云-生成器.html`，配置 OpenAI API Key，选择年级范围
2. 等待 AI 生成所有内容（约 30 分钟）
3. 点击"导出学习版"下载 `诗云-学习版.html`
4. 把 `诗云-学习版.html` 给孩子，双击打开即可使用

## 架构

参见 [`docs/superpowers/specs/2026-06-16-诗云-design.md`](docs/superpowers/specs/2026-06-16-诗云-design.md)
