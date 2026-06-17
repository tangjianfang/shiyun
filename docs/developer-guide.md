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
├── quiz/                # 4 种考核模式核心逻辑
│   ├── fill.js
│   ├── choice.js
│   ├── order.js
│   └── listen.js
├── main.js              # 入口
└── ui/
    ├── home.js
    ├── learn.js
    ├── review.js
    ├── quiz.js
    ├── print.js         # 打印 UI
    ├── progress.js
    └── user-switcher.js
```

加载顺序由 `scripts/build_learning.py` 的 `CORE_JS` 列表控制。

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

- 位置：`tests/test_build_script.py`（pytest）
- 覆盖：构建脚本的输出文件结构、HTML 完整性

### E2E 测试

- 位置：`tests/e2e/manual-test.md`
- 频率：每次发布前
- 详细：[`e2e/manual-test.md`](e2e/manual-test.md)

### 跑测试

```bash
npm test                  # 单元测试
npm run test:watch        # 监视
npm run test:build        # 构建测试（需 pytest）
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

找到 `shiyun_user_state` 键，查看 JSON 结构。

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

### 常见问题

**Q: 修改后浏览器没反应？**
A: 强制刷新（Ctrl+Shift+R / Cmd+Shift+R）

**Q: 进度数据突然丢失？**
A: 检查 `localStorage.clear()` 是否被误调；用「导出进度」备份

**Q: 构建失败但本地没问题？**
A: 检查 `src/learning.template.html` 占位符（`<!-- @@STYLES -->` / `<!-- @@DATA -->` / `<!-- @@SCRIPTS -->`）

---

## 常见任务

### 添加一首诗

```bash
# 1. 编辑 src/data/poems-meta.js，追加：
#    { id: 'g3-21', title: '新诗', author: '...', dynasty: '...',
#      grade: 3, type: '...', sequence: 21, source: '...',
#      content: ['...', '...', ...] }

# 2. 跑测试
npm test

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
npm test

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
