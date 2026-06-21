# 诗云 · 下一轮重构需求表

> 捕获自 2026-06-22 全模块 review 后的待办事项。
> 全部按 TDD 执行（先写失败测试，再写实现），每次小步提交。

## 当前快照

- **测试**: 32 files / 520 tests / 100% pass
- **dist**: 94.72 MB
- **head**: `a00a986` (master)
- **审计已修**: 2 个真 bug（`addUser` 撞 ID / `updateUser` 静默创建）
- **设计统一**: 3 套搜索 → title+author；`print.filterPoems` 加 `defaultBehavior`

---

## R-1 · UI 组件化重构（最高优先级 · 5 个并行子任务）

**目标**: 把 5 个"卡片"实现收敛为 1 个 `<Card>` 原子；建立 h1/h2/h3 语义层级；统一信息密度。

### R-1.1 · 抽出 `<Card>` 原子组件
**位置**: `src/js/ui/components.js`
- [ ] 写测试：`<Card>` 接受 `{title, body, footer, variant, onClick}` props
- [ ] 实现：HTML 字符串生成器（纯函数，可测）
- [ ] 重构：`poemCard` / `cloud-poem-chip` / `stat-card` / `skeleton-card` / `cloud-node` 5 处改用 `<Card>` 派生
- [ ] 验证：5 处现有测试继续通过

### R-1.2 · 抽出 `<EmptyState>` 通用组件
**位置**: `src/js/ui/components.js`
- [ ] 现有 `emptyState` 升级：加 `action` slot（按钮/链接 HTML 透传）
- [ ] 应用到：learn.js、print.js、review.js、cloud.js、user-switcher.js、quiz.js 6 处

### R-1.3 · 抽出 `<FilterBar>` 筛选条组件
**位置**: `src/js/ui/components.js`（新建）
- [ ] 设计 props：sections=[{label, type:'chip'|'checkbox'|'radio', options, value, onChange}]
- [ ] 应用到：learn.js（chip 改 FilterBar）、print.js（checkbox 改 FilterBar）— 这是 D-2 重复 UI 收敛的前置

### R-1.4 · 语义层级：h1/h2/h3 + data-section
- [ ] 制定 h 层级规则：页面唯一 h1 = 页头；section 标题 h2；item 标题 h3
- [ ] 全站 audit 现有 h 标签，标出违规处
- [ ] 修复违规（learn 详情、cloud 节点、print 预览）
- [ ] 写 `tests/semantic-hierarchy.test.js` 抓出所有 <h1> > 1 的页面

### R-1.5 · 信息密度：列表页加折叠
- [ ] learn 列表：年级+学期+朝代 chip 默认折叠到"筛选 3 项 ▾"
- [ ] print：筛选区 6 维 chip 默认折叠到"筛选 ▾"
- [ ] progressive disclosure：默认只显示主要 chip，展开后看完整

**完成标志**: 5 个并行子任务都通过对应测试；新增 `<Card>` / `<EmptyState>` / `<FilterBar>` 在 components.js。

---

## R-2 · 重复函数合并（4 个子任务）

### R-2.1 · 合并 2 套 filter 函数
**目标**: `learn.filterLearnPoems` 和 `print.filterPoems` 行为已经不同（learn 单值/print 数组），但底层都是「多维组合筛选」。抽到 `src/js/poem-query.js`（新文件）：
- [ ] 写测试：`filterPoems(poems, { grades?, semesters?, dynasties?, authors?, keyword? })` — 数组白名单（空数组=全部）
- [ ] 写测试：`filterPoems` 接受 `options.defaultBehavior: 'all'|'none'`
- [ ] 写测试：`filterPoems` 接受 `options.scope: 'single'|'all'`（learn 用 single：grade=1；print 用 all：grades=[1]）
- [ ] learn.js: 改用 `filterPoems` + 转换器（单值→数组）
- [ ] print.js: 改用 `filterPoems` 直接传数组
- [ ] 删 learn.js 的 `filterLearnPoems`（保留 searchPoemsCase 作 backward-compat）
- [ ] 验证：所有现有测试通过

### R-2.2 · 统一 2 套 search 函数
**目标**: `data.searchPoems` + `learn.searchPoemsCase` 合并为 `searchPoemsByKeyword(poems, keyword)`:
- [ ] 写测试：纯函数，输入 poems 数组，输出过滤数组；只匹配 title+author
- [ ] 写测试：keyword='' 返全部
- [ ] 替换 data.js / learn.js 调用方
- [ ] 删 `data.searchPoems`（被新函数覆盖）

### R-2.3 · 3 个 generator 抽 `createPipelineBase`
**位置**: `src/generator/pipeline-base.js`（新文件）
- [ ] 写测试：`createPipelineBase({type, storageKey, processOne})` 返回 {pendingIds, start, cancel, regenerateOne, regenerateAll}
- [ ] 重构：text/image/audio 3 个 generator 删掉重复的 `pendingPoemIds/start/cancel/regenerateOne` 框架
- [ ] 保留各 generator 自己的 `processOne` 和 `TYPE` 常量
- [ ] 验证：3 个 generator 测试全过

### R-2.4 · 2 套作者朝代去重合并
**目标**: `getAllDynasties/Authors` (data.js) + `getAllDynasties/AuthorsForFilter` (learn.js) 合并
- [ ] 写测试：单函数 `getUniqueValues(poems, 'dynasty'|'author')` 含 `.filter(Boolean)`
- [ ] 替换 2 处调用方
- [ ] 删 4 个函数

---

## R-3 · storage.js 高级特性

### R-3.1 · 数据迁移（schema 升级路径）
- [ ] 写测试：`migrateState(oldState)` 升级 v1.0.0 → v1.1.0（如新增字段）
- [ ] 实现：版本检测 + 字段补全

### R-3.2 · localStorage 错误边界
- [ ] writeState 失败时（quota exceeded）应降级到 sessionStorage
- [ ] 写测试：模拟 quota 异常路径

### R-3.3 · 数据导出格式升级
- [ ] exportData 加 version 字段 + checksum
- [ ] importData 校验 checksum
- [ ] 写测试：损坏的 checksum 应抛错且不破坏现有数据

---

## R-4 · 测试覆盖深化

### R-4.1 · 端到端 (e2e) 测试
**位置**: `tests/e2e/` (目录已存在但空)
- [ ] 用 Playwright 写 5 个核心流程：学诗 → 考核 → 复习 → 打印 → 切换用户
- [ ] 每个流程写 happy path + 1 个 error path
- [ ] 跑通后接入 `npm test`

### R-4.2 · 视觉回归
- [ ] 关键页面（home / learn 详情 / print TOC）截图快照
- [ ] diff 检测布局漂移
- [ ] 接入 CI（`vitest run --reporter=html` + 视觉对比）

### R-4.3 · 边界 / 异常路径系统化
- [ ] localStorage 满（quota）
- [ ] 浏览器不支持 SpeechSynthesis
- [ ] 网络失败（生成器 fetch API 失败）
- [ ] poems-meta.js 缺失字段（dynamic id 解析失败）
- [ ] 跨年级乱序（g5-上-99 存在但 g3-下-01 不存在）

---

## R-5 · 性能与可访问性

### R-5.1 · 大列表虚拟化
- [ ] learn.js 112 张 poemCard 改用虚拟滚动（仅渲染视口 + buffer）
- [ ] print.js 112 首诗预览也虚拟化
- [ ] 性能测试：滚动 60fps

### R-5.2 · 键盘导航
- [ ] tab / arrow key 在 chip / card 间导航
- [ ] Enter 触发 chip / card 选中
- [ ] aria-label 全覆盖

### R-5.3 · 减少首屏白屏
- [ ] 当前 splash 屏 160ms 延迟 + 420ms 淡出，可减半
- [ ] 或改为内联骨架屏，无 splash 屏

---

## R-6 · 文档与可维护性

### R-6.1 · 模块 README
- [ ] `src/js/ui/components.js` → 加 README 说明每个组件 props
- [ ] `src/js/data.js` → 文档化 `poems` Map 生命周期
- [ ] `src/js/storage.js` → 文档化 schema + 升级路径

### R-6.2 · 决策记录 (ADR)
- [ ] `docs/decisions/001-tech-style-over-traditional.md` — 记录科技风选择
- [ ] `docs/decisions/002-print-default-none.md` — 记录 print 默认 0 首选
- [ ] `docs/decisions/003-search-scope-title-author.md` — 记录搜索只搜 title/author

---

## 执行顺序建议（避免大爆炸）

```
Wave 1 (并行):  R-2.1 filter 合并 + R-2.2 search 合并 + R-2.3 pipeline-base
Wave 2 (并行):  R-2.4 唯一值合并 + R-4.3 边界测试 + R-6.1 README
Wave 3 (并行):  R-1.1 Card + R-1.2 EmptyState + R-1.4 语义层级
Wave 4 (并行):  R-1.3 FilterBar + R-1.5 信息密度折叠
Wave 5 (并行):  R-3 storage 高级 + R-5 性能 + R-6.2 ADR
Wave 6:         R-4.1 e2e + R-4.2 视觉回归
```

每完成一个 wave，跑 `npm test` + `npm run build` 验证 0 失败再进下一个。

---

## 范围控制

**R-1 / R-2 是本轮必须做的**（用户原话"重复功能、布局混乱"对应）
**R-3 / R-4 是下一轮要做的**（用户原话"100% 覆盖 + 关联紧密"对应）
**R-5 / R-6 是 Nice to have**（除非用户明确要求，否则按需触发）

每完成一个 R-N.M 子任务，独立 commit + push，保持 master 始终绿。
