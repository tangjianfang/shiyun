# 诗云 · 编排指南

本文档说明如何使用 `orchestrate.bat` 自动执行 25 个开发任务。

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 初始化 Git（如果是首次）
git init
git add .
git commit -m "chore: 初始提交"

# 3. 一键执行所有任务
./orchestrate.bat

# 或：只执行指定任务
./orchestrate.bat 5 6 7

# 或：查看当前进度
./orchestrate.bat --status

# 或：重置进度重新执行
./orchestrate.bat --reset
./orchestrate.bat
```

## 工作原理

```
orchestrate.bat
  ├── 生成 25 个任务 prompt 模板（.tasks/prompts/）
  ├── 按 8 个阶段执行任务：
  │   ├── Phase 1: 基础（4 个串行）
  │   ├── Phase 2: 基础并行（2 个并行）
  │   ├── Phase 3: 生成器（5 个串行）
  │   ├── Phase 4: 学习版骨架
  │   ├── Phase 5: 详情+列表
  │   ├── Phase 6: 4 个考核模式（并行）
  │   ├── Phase 7: 复习/进度/打印/用户
  │   └── Phase 8: 构建/测试/文档
  ├── 每个任务调用一个 Claude Code 会话
  ├── 独立任务并行执行（节省时间）
  └── 完成后生成 .tasks/done/ALL.done
```

## 任务状态

每个任务完成后会在 `.tasks/done/` 创建一个空文件作为标志：
- `.tasks/done/01` - Task 01 完成
- `.tasks/done/02` - Task 02 完成
- ...
- `.tasks/done/ALL.done` - 全部完成

## 任务文件

每个任务的详细定义在 `docs/superpowers/plans/tasks/`：
```
docs/superpowers/plans/tasks/
├── task-01-project-init.md
├── task-02-poems-meta.md
├── task-03-data-model.md
├── task-04-openai-client.md
├── task-05-generator-skeleton.md
├── task-06-text-generator.md
├── task-07-image-generator.md
├── task-08-audio-generator.md
├── task-09-export.md
├── task-10-learning-skeleton.md
├── task-11-storage.md
├── task-12-srs.md
├── task-13-detail-page.md
├── task-14-list-page.md
├── task-15-quiz-fill.md
├── task-16-quiz-choice.md
├── task-17-quiz-order.md
├── task-18-quiz-listen.md
├── task-19-review.md
├── task-20-progress.md
├── task-21-print.md
├── task-22-multi-user.md
├── task-23-build.md
├── task-24-e2e-test.md
└── task-25-readme.md
```

## 日志

每个任务的执行日志在 `.tasks/logs/`：
- `.tasks/logs/task-01.log`
- `.tasks/logs/task-02.log`
- ...

如果任务失败，查看对应日志了解详情。

## 中断恢复

- 如果 `orchestrate.bat` 中途中断，重新运行会跳过已完成的任务
- 使用 `--reset` 强制重新执行所有任务
- 使用 `--status` 查看当前进度

## 依赖任务图

```
01 (项目初始化)
  ├── 02 (诗词元数据)
  ├── 03 (数据模型)
  └── 04 (OpenAI客户端)
       └── 05 (生成器骨架)
            ├── 06 (文本生成)
            ├── 07 (配图生成)
            ├── 08 (音频生成)
            └── 09 (导出学习版)

03 ─┬─ 10 (学习版骨架)
    ├─ 11 (localStorage) ─────┐
    └─ 12 (SM-2 算法) ────────┤
                              │
10, 11 ──── 13 (诗词详情页)   │
10, 11, 13 ── 14 (列表页)     │
                              │
10, 12 ─┬─ 15 (填空)           │
        ├─ 16 (选择)  [并行]   │
        ├─ 17 (排序)           │
        └─ 18 (听诗选诗)       │
                              │
12, 15-18 ──── 19 (复习流程)   │
11, 12 ──────── 20 (进度管理)  │
10, 13 ──────── 21 (打印)      │
11 ──────────── 22 (多用户)    │
                              │
01, 02, 03, 10, 23 ── 23 (构建脚本)
01-22 ──────────── 24 (E2E测试)
01-24 ──────────── 25 (README)
```

## 性能预估

- 总任务数：25
- 串行任务：21
- 并行任务：6（分 3 组）
- 单任务时间：5-30 分钟（取决于复杂度）
- **总执行时间：约 6-12 小时**（Claude Code 真实执行）

## 故障排查

| 问题 | 解决方案 |
|------|----------|
| `claude` 命令未找到 | `npm install -g @anthropic-ai/claude-code` |
| 任务卡住 | `Ctrl+C` 中断后重新运行，会跳过已完成 |
| 任务失败 | 查看 `.tasks/logs/task-NN.log`，修复后重跑该任务 |
| Git 冲突 | 任务内含 `git commit`，确保工作区干净 |
| 依赖缺失 | 运行 `npm install` |

## 注意事项

1. **不要手动编辑 `.tasks/done/`** - 它是自动管理的
2. **不要删除 `.tasks/logs/`** - 失败排查需要
3. **定期 `git push`** - 任务执行会产生大量提交
4. **API Key 准备好** - Task 6-8 需要 OpenAI API Key

## 完成后的产物

- `诗云-生成器.html` - 家长用的 AI 内容生成器
- `dist/诗云-学习版.html` - 孩子用的学习应用（双击即用）
- `dist/poems.json` - 诗词数据（备份）
- `README.md` - 完整使用文档
