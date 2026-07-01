# 诗云 · Wave 2 — UI 组件化收敛 + 列表虚拟化

> 在 Wave 1（filter/search/pipeline-base 合并）已完成的基础上，把 `components.js` 收敛为
> 三个真正的原子（Card / EmptyState / FilterBar），统一全站 h 层级和卡片信息密度，
> 并对 112 首诗列表做虚拟化以保证滚动流畅。
>
> 全部按 TDD 执行（先写失败测试，再写实现），每个 R-N.M 子任务独立 commit。

## 当前快照

- **测试**：32 files / 520 tests / 100% pass
- **dist**：94.72 MB（已内联 pinyin-pro）
- **master head**：`decdca4`
- **Wave 1 已完成**：R-2.1 / R-2.2 / R-2.3 / R-2.4
- **来源**：`docs/superpowers/specs/2026-06-22-诗云-refactor-spec.md`（6 大类 18 子任务表）

---

## 1. 目标

本轮（Wave 2）完成 6 个子任务：

| ID | 任务 | 模块 |
|----|------|------|
| **R-1.1** | 抽出 `<Card>` 原子组件 | `src/js/ui/components.js` |
| **R-1.2** | 升级 `<EmptyState>` 加 `action` slot | `src/js/ui/components.js` |
| **R-1.3** | 新建 `<FilterBar>` 通用筛选条 | `src/js/ui/components.js`（新建） |
| **R-1.4** | 语义层级 h1/h2/h3 + `data-section` | `src/css/05-pages.css` + 4 页 |
| **R-1.5** | 列表页加折叠（progressive disclosure） | learn.js / print.js |
| **R-5.1** | 大列表虚拟化 | `src/js/ui/virtual-list.js`（新建） |

**完成标志**：
- 6 个子任务全部 commit
- `npm test` ≥ 542 tests 全 pass（520 现有 + 22 新增）
- `npm run build` 产物可生成
- 视觉上：5 处卡片视觉一致、列表页更紧凑、滚动 60fps

**Out of scope（本轮不做）**：
- R-3 storage 高级（迁移 / 降级 / 校验）
- R-4 e2e（Playwright）
- R-4.2 视觉回归
- R-4.3 边界 / 异常系统化
- R-5.2 键盘导航
- R-5.3 splash 屏优化
- R-6 文档 / ADR

留给 Wave 3+。

---

## 2. 架构

```
src/js/ui/components.js       ← 唯一来源：Card / EmptyState / FilterBar 三个原子
src/js/ui/virtual-list.js     ← 新建，IntersectionObserver 虚拟滚动
src/js/ui/learn.js            ← poemCard 改 Card 派生；chip 改 FilterBar
src/js/ui/print.js            ← 卡片派生 Card；筛选改 FilterBar；预览虚拟化
src/js/ui/cloud.js            ← cloud-poem-chip + cloud-node 改 Card 派生
src/js/ui/progress.js         ← stat-card 改 Card 派生
src/js/ui/home.js             ← 状态卡 / 入口卡改 Card 派生
src/css/05-pages.css          ← 新增 .card-* 变体 / .filter-bar-collapsed / virtual-list 样式
tests/components.test.js           ← 扩展：+12 测试覆盖三个原子
tests/semantic-hierarchy.test.js   ← 新建：抓 <h1> > 1 违规
tests/virtual-list.test.js         ← 新建：6 测试覆盖虚拟列表
```

**单一职责**：
- `components.js` 只导出**纯字符串构造函数**（无 DOM 操作，无副作用，可在 jsdom 单测）
- `virtual-list.js` 是**唯一接入真实 DOM** 的新模块（其他模块仍保持纯函数风格）

---

## 3. 关键 API 设计

### 3.1 Card

```js
Card({
  title?,                            // string | undefined（无 title 则不渲染 h3）
  body,                              // string | (() => string)（必填）
  footer?,                           // string
  variant: 'poem' | 'stat' | 'cloud-chip' | 'cloud-node' | 'skeleton',
  onClick?,                          // string（data 属性或内联 onclick）
  className?,                        // string（透传额外 class）
}) → string  // HTML
```

**约束**：5 个 variant 共用同一 HTML 骨架（`.card` 根 + `.card__title` + `.card__body` + `.card__footer`），
差异在 `data-variant` 属性 + CSS 修饰类。

### 3.2 EmptyState（升级）

```js
EmptyState({
  icon?,                             // string（emoji 或 HTML）
  title,                             // string（必填）
  message,                           // string
  action?,                           // string（HTML 按钮或链接，透传）
}) → string
```

**升级点**：相对 Wave 1 的 `emptyState` 函数，新增 `action` slot。原有调用方 6 处
（learn / print / review / cloud / user-switcher / quiz）按需添加 action。

### 3.3 FilterBar（新建）

```js
FilterBar({
  sections: [{
    key,                             // string（如 'grade'）
    label,                           // string（如 '年级'）
    type: 'chip'                     // 'chip' | 'checkbox' | 'radio'
        | 'checkbox'
        | 'radio',
    options: [{                      // 选项
      value,                         // string | number
      label,                         // string
      count?,                        // number（可选，chip 后显示数量）
    }],
    value,                           // 当前值（chip: single；checkbox: array；radio: single）
    defaultCollapsed?: boolean,      // 默认 false
    onChange,                        // string（内联 onchange）
  }],
  collapsible?: boolean,             // 整体可折叠（R-1.5 用）
  collapsedSummary?: string,         // 折叠时显示的摘要（如 '筛选 3 项 ▾'）
}) → string
```

### 3.4 VirtualList（新建）

```js
VirtualList({
  items: Array,                      // 列表数据
  renderItem: (item, index) => string, // 单项 HTML
  estimatedItemHeight: number,       // px（预估高度，用于撑开滚动条）
  overscan?: number,                 // 默认 5
  containerHeight?: number,          // px（默认取视口高度）
  fallback?: 'render-all',           // jsdom 无 IntersectionObserver 时降级
}) → {
  mount(el: HTMLElement): void,
  update(newItems: Array): void,
  destroy(): void,
}
```

**降级策略**：`IntersectionObserver` 不可用（jsdom / 老浏览器）时，直接渲染全部并加
`data-virtual-fallback="true"` 标记，确保测试可走 fallback 路径且无 JS 也不破坏。

---

## 4. 数据流

```
UI 渲染：  state (poems 数组) → 组件纯函数 → HTML string → innerHTML 注入
虚拟列表：IntersectionObserver 触发
            → 计算 visibleRange (start = max(0, scrollTop / h - overscan),
                                  end   = min(items.length, start + viewCount + 2*overscan))
            → renderItem(visibleSlice) → 撑开占位 padding
```

**关键不变量**：
- 滚动条总高度 = `items.length * estimatedItemHeight`（撑开）
- 可见区域通过 `transform: translateY(start * h)` 平移渲染层
- 渲染层只挂载 `viewCount + 2*overscan` 个真实 DOM

---

## 5. 错误处理

| 失败点 | 处理 |
|--------|------|
| Card / EmptyState / FilterBar 任一参数非法 | 返回带 `console.warn` 的降级 HTML（显示空态而非抛错） |
| 虚拟列表无 `IntersectionObserver` | fallback 到 `render-all` 模式，加 `data-virtual-fallback="true"` |
| 虚拟列表 `items=[]` | 渲染 `<EmptyState title="暂无内容" />`，不发警告 |
| 虚拟列表 `renderItem` 抛错 | catch 后用 `EmptyState` 替换该项，不影响其他项 |
| Card title 包含 `<script>` | 通过 `escapeHtml()` 转义（components.js 内部工具） |

---

## 6. 测试策略

| 文件 | 测试数 | 覆盖 |
|------|--------|------|
| `tests/components.test.js` 扩展 | +12 | Card 5 variant × {正常/空 action} + EmptyState action slot + FilterBar 3 type |
| `tests/semantic-hierarchy.test.js` 新建 | 4 | 检测 <h1> > 1；learn/print/cloud/progress 4 页全合规 |
| `tests/virtual-list.test.js` 新建 | 6 | mount / update / destroy + 滚动行为 + overscan + fallback |
| **回归** | 520 | 现有 520 tests 全 pass（增量不破坏） |
| **合计** | **≥ 542 (520 + 22)** | |

**TDD 顺序（每个 R-N.M 子任务都遵循红绿重构）**：
1. 写失败测试
2. 跑 `npm test -- <file>` 确认红
3. 写最小实现
4. 跑测试确认绿
5. 重构（提取公共代码、改名）
6. 跑全量 `npm test` 确认无回归
7. `git add` + `git commit`（commit message 格式：`refactor(R-1.1): <subject>`）

---

## 7. 执行顺序（避免大爆炸）

按依赖关系严格串行：

```
Step 1  R-1.1 Card 原子       （无依赖，先做）
Step 2  R-1.2 EmptyState 升级  （独立）
Step 3  R-1.4 语义层级         （独立，先于 FilterBar 因为 FilterBar 内部 h3 要规范）
Step 4  R-1.3 FilterBar        （依赖 Card / 语义层级）
Step 5  R-1.5 折叠             （依赖 FilterBar）
Step 6  R-5.1 虚拟列表         （独立，最后做；可以先在 learn.js 试跑再扩到 print.js）
```

每完成一个 Step，跑 `npm test` + `npm run build` 验证 0 失败再进下一个。

---

## 8. 范围控制与风险

**风险**：
- **R-1.1 Card 派生 5 处**：每处现有测试必须继续通过；如有不通过的差异（class 名、data 属性），
  保留兼容层（如同时输出旧 class + 新 class），下个 wave 再删
- **R-1.5 折叠**：默认折叠可能让用户找不到筛选项；解决方案是折叠摘要文本包含已选项数
  （如「筛选 3 项 ▾」），且 aria-expanded 同步
- **R-5.1 虚拟列表**：CSS 高度预估不准会跳屏；用 `ResizeObserver` 监听真实高度修正（第一版可省略，先用估算高度）

**回退策略**：每个 R-N.M 子任务独立 commit；如某步破坏测试，可 `git revert` 单独回退，不影响其他步骤。

---

## 9. 后续 wave 预告

完成本轮后剩余 12 子任务，按依赖排序：

```
Wave 3: R-3.1 数据迁移 + R-3.2 storage 降级 + R-3.3 导出校验
Wave 4: R-4.3 边界测试 + R-6.1 模块 README + R-6.2 ADR
Wave 5: R-4.1 e2e (Playwright) + R-4.2 视觉回归
Wave 6: R-5.2 键盘导航 + R-5.3 splash 优化
```

每 wave 独立 spec + 独立 commit 链。
