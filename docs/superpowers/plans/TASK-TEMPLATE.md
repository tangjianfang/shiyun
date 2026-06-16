# 任务文件模板

每个任务文件应遵循以下结构：

```markdown
# Task NN: [任务名称]

**依赖：** [前置任务 ID，用逗号分隔]
**并行组：** [group 名称（如果可并行），或 "none"]
**估时：** [X 天]

**Files:**
- Create: `exact/path/to/file.js`
- Create: `exact/path/to/test.js`
- Modify: `path/to/existing.js:123-145`（如需要）

## Step 1: 写失败的测试

[解释测试目的]

```javascript
// tests/exact/path/test.js
import { describe, it, expect } from 'vitest';
import { targetFunction } from '../../src/path/target.js';

describe('targetFunction', () => {
  it('should do X', () => {
    const result = targetFunction(input);
    expect(result).toBe(expected);
  });
  // ... 更多测试
});
```

## Step 2: 运行测试验证失败

```bash
npm test -- tests/path/test.js
```

Expected: FAIL with "function not defined"

## Step 3: 实现最小代码

```javascript
// src/path/target.js
export function targetFunction(input) {
  // 实现
  return expected;
}
```

## Step 4: 运行测试验证通过

```bash
npm test -- tests/path/test.js
```

Expected: PASS

## Step 5: 提交

```bash
git add src/path/target.js tests/path/test.js
git commit -m "feat(scope): 添加 [功能]"
```

## 完成标志

创建文件 `.done/NN`（空文件即可）：

```bash
touch .done/NN
```

## 关键说明

[任何重要的实现细节、模式参考、与上游任务的关系]
```

## 关键规则

1. **代码必须完整**：每一步的代码块要能直接复制运行
2. **测试先行**：TDD 流程，5 步缺一不可
3. **提交频繁**：每完成一个任务组件就提交
4. **不要重复**：如果其他任务有相同模式，引用而非复制
5. **明确接口**：类型/JSDoc 必须清楚，下游任务能直接使用
