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
   - `pinyinPro is not defined` → 缺 `dist/lib/pinyin-pro.min.js`
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
- `dist/lib/pinyin-pro.min.js` 缺失或被删除
- `<script src="./lib/pinyin-pro.min.js">` 加载失败

**解决**：
1. 重新构建：`npm run build`
2. 检查 `dist/lib/pinyin-pro.min.js` 文件存在
3. 浏览器 F12 → Network → 验证 pinyin-pro.min.js 返回 200

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
2. 找到 `shiyun_user_state`，查看 JSON 结构
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

## 仍无法解决？

1. **搜索 GitHub Issues**：https://github.com/yourname/shiyun/issues?q=is%3Aissue
2. **创建新 Issue**：
   - 标题：简洁描述
   - 正文：浏览器版本、操作系统、错误截图、复现步骤
3. **联系作者**：shiyun@example.com

> 提 Issue 前请先尝试清空 localStorage 重新开始（先备份），很多问题就此解决。
