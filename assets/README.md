# assets · 资产目录

诗云系统的 AI 生成资产。`诗云-学习版.html` 通过 build 脚本把这些文件 base64 内嵌。

## 目录结构

```
assets/
├── audio/         # 90 个 MP3 朗诵文件（按 POEMS_META 新 ID 命名）
├── images/        # 90 个 JPG 配图（按 POEMS_META 新 ID 命名）
├── content/       # 90 条 AI 生成的诗词背景/译文/注释/主题/关键词
├── _archive/      # 旧 ID 格式的 224 个文件，留作审计 trail
│   ├── audio/     # 旧 g1-01-... 命名
│   ├── images/    # 旧 g1-01.jpg 命名
│   └── content/   # 旧 manifest 备份（manifest.old.json）
└── MIGRATION_REPORT.md   # ID 格式迁移详细报告
```

## ID 格式

- **旧**：`g{1-6}-{01-NN}-{title}-{dynasty}-{author}.{ext}`（按年级连续编号）
- **新**：`g{1-6}-{上|下}-{01-NN}-{title}.{ext}`（按 12 学期）

例：
- 旧：`assets/audio/g1-01-静夜思-唐-李白.mp3`
- 新：`assets/audio/g1-下-03-静夜思.mp3`

## 完整性

- POEMS_META 收录 112 首诗（部编版 2019 年 11 月第 1 版）
- 音频：**112/112**（官方下载源，2026-06-21 链接）
- 配图：90/112（生成器生成）
- AI 文本：90/112（生成器生成）

## 音频来源

```
src/data/小学生必备古诗词112首/   ← 官网下载的 112 个 mp3
        ↓ scripts/link-user-audio.mjs
assets/audio/                    ← 链接后的资产，文件名按 POEMS_META 新 ID 命名
```

唯一差异：`092 回乡偶书.mp3` 在 POEMS_META 中为 `g6-上-06 回乡偶书（其一）`，脚本以 POEMS_META 标题命名。

## 待补齐

- 22 张图片（POEMS_META 中 22 首诗无对应配图）
- 22 套 AI 文本（POEMS_META 中 22 首诗无 AI 注释/译文/主题）

需用 `诗云-生成器.html` 跑一遍。