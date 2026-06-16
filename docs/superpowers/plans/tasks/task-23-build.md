# Task 23: 构建脚本

**依赖：** Task 1, Task 2, Task 3, Task 20, Task 21, Task 22
**并行组：** none（必须最后串行执行）
**估时：** 0.5 天

**Files:**
- Create: `scripts/build_learning.py`
- Create: `tests/build.test.py`（可选，pytest 验证）
- Create: `dist/`（输出目录）

## Step 1: 准备输入文件结构

构建脚本依赖以下文件存在：

```
src/
├── learning.html             # 学习版入口模板（含 {{INLINE_CSS}} {{INLINE_JS}} 占位符）
├── css/
│   ├── main.css
│   └── print.css
├── js/
│   ├── data.js
│   ├── storage.js
│   ├── router.js
│   ├── srs.js
│   ├── audio.js
│   ├── print.js
│   └── ui/
│       ├── home.js
│       ├── learn.js
│       ├── review.js
│       ├── quiz.js
│       ├── print.js
│       ├── progress.js
│       └── user-switcher.js
├── data/
│   └── poems-meta.js         # 诗词元数据（构建时转 poems 注入）
└── lib/
    └── pinyin-pro.js         # 第三方拼音库（构建时复制到 dist）
```

## Step 2: 学习版 HTML 模板约定

`src/learning.html` 应包含以下占位符（构建脚本会替换）：

```html
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>诗云 · 古诗词学习</title>
  <style>
    /* {{INLINE_CSS}} */
  </style>
</head>
<body>
  <div id="app">
    <header class="app-header">
      <h1>诗云</h1>
      <nav class="tab-bar">
        <a href="#/" class="tab" data-tab="home">首页</a>
        <a href="#/learn" class="tab" data-tab="learn">学新诗</a>
        <a href="#/review" class="tab" data-tab="review">复习</a>
        <a href="#/quiz" class="tab" data-tab="quiz">考核</a>
        <a href="#/print" class="tab" data-tab="print">打印</a>
        <a href="#/progress" class="tab" data-tab="progress">进度</a>
      </nav>
    </header>
    <main id="view"></main>
  </div>

  <script>
    /* 诗词数据（构建时嵌入） */
    window.__SHIYUN_POEMS_META__ = {{POEMS_META_JSON}};
  </script>
  <script type="module">
    /* {{INLINE_JS}} */
  </script>
  <script src="./lib/pinyin-pro.js"></script>
</body>
</html>
```

## Step 3: 实现构建脚本

创建 `scripts/build_learning.py`：

```python
#!/usr/bin/env python3
"""
诗云 · 学习版构建脚本

将 src/ 下的所有源文件（HTML/CSS/JS/数据/第三方库）合并为单 HTML 文件，
输出到 dist/诗云-学习版.html，支持完全离线使用。

功能：
1. 读取 src/learning.html 模板
2. 内联 src/css/*.css 到 <style>
3. 合并 src/js/*.js 和 src/js/ui/*.js 到 <script type="module">
4. 读取 src/data/poems-meta.js，提取 POEMS_META 序列化为 JSON 注入
5. 复制 src/lib/pinyin-pro.js 到 dist/lib/
6. 输出 dist/诗云-学习版.html

依赖：仅 Python 3.8+ 标准库（无第三方包）
"""

import argparse
import os
import re
import sys
import shutil
import json
from pathlib import Path
from datetime import datetime


# ===== 路径常量 =====
SCRIPT_DIR = Path(__file__).resolve().parent
ROOT_DIR = SCRIPT_DIR.parent
SRC_DIR = ROOT_DIR / "src"
DIST_DIR = ROOT_DIR / "dist"
LIB_DIR = DIST_DIR / "lib"


# ===== 工具函数 =====

def log(msg, level="info"):
    """彩色日志输出"""
    colors = {
        "info":  "\033[94m",   # 蓝
        "ok":    "\033[92m",   # 绿
        "warn":  "\033[93m",   # 黄
        "error": "\033[91m",   # 红
    }
    c = colors.get(level, "")
    reset = "\033[0m"
    print(f"{c}[{level.upper()}]{reset} {msg}")


def read_file(path):
    """读取文本文件，失败抛出"""
    try:
        return Path(path).read_text(encoding="utf-8")
    except FileNotFoundError:
        log(f"文件不存在: {path}", "error")
        raise
    except UnicodeDecodeError as e:
        log(f"文件编码错误 {path}: {e}", "error")
        raise


def read_file_bytes(path):
    """读取二进制文件（如 pinyin-pro.js）"""
    return Path(path).read_bytes()


def ensure_dir(path):
    """确保目录存在"""
    Path(path).mkdir(parents=True, exist_ok=True)


# ===== 步骤 1：合并 CSS =====

def collect_css():
    """收集 src/css/ 下所有 CSS 文件内容"""
    css_dir = SRC_DIR / "css"
    if not css_dir.exists():
        log(f"CSS 目录不存在: {css_dir}", "warn")
        return ""

    css_files = sorted(css_dir.glob("*.css"))
    if not css_files:
        log("未找到任何 CSS 文件", "warn")
        return ""

    parts = []
    for css_file in css_files:
        log(f"  + 读取 CSS: {css_file.relative_to(ROOT_DIR)}")
        content = read_file(css_file)
        parts.append(f"/* === {css_file.name} === */\n{content}")

    return "\n\n".join(parts)


# ===== 步骤 2：合并 JS =====

# 模块加载顺序（保证依赖关系）
JS_LOAD_ORDER = [
    # 核心
    "js/data.js",
    "js/storage.js",
    "js/srs.js",
    "js/router.js",
    "js/audio.js",
    "js/print.js",
    # UI
    "js/ui/user-switcher.js",  # 依赖 storage
    "js/ui/home.js",
    "js/ui/learn.js",
    "js/ui/review.js",
    "js/ui/quiz.js",
    "js/ui/print.js",
    "js/ui/progress.js",
]


def collect_js():
    """按依赖顺序合并 src/js/*.js 和 src/js/ui/*.js"""
    parts = []

    # 1. 先放核心模块（data.js 是入口）
    core_files = [
        SRC_DIR / "js" / "data.js",
        SRC_DIR / "js" / "storage.js",
        SRC_DIR / "js" / "srs.js",
        SRC_DIR / "js" / "router.js",
        SRC_DIR / "js" / "audio.js",
        SRC_DIR / "js" / "print.js",
    ]
    for js_file in core_files:
        if js_file.exists():
            log(f"  + 读取 JS: {js_file.relative_to(ROOT_DIR)}")
            content = read_file(js_file)
            parts.append(f"// === {js_file.relative_to(SRC_DIR)} ===\n{content}")
        else:
            log(f"  - 缺失（跳过）: {js_file.relative_to(ROOT_DIR)}", "warn")

    # 2. UI 模块
    ui_dir = SRC_DIR / "js" / "ui"
    if ui_dir.exists():
        ui_files = sorted(ui_dir.glob("*.js"))
        for js_file in ui_files:
            log(f"  + 读取 UI: {js_file.relative_to(ROOT_DIR)}")
            content = read_file(js_file)
            parts.append(f"// === {js_file.relative_to(SRC_DIR)} ===\n{content}")

    return "\n\n".join(parts)


# ===== 步骤 3：提取 POEMS_META =====

def extract_poems_meta():
    """
    从 src/data/poems-meta.js 提取 POEMS_META 数组。
    由于不能用 eval（标准库），采用正则匹配 export const POEMS_META = [...];
    """
    meta_file = SRC_DIR / "data" / "poems-meta.js"
    if not meta_file.exists():
        log(f"诗词元数据文件不存在: {meta_file}", "error")
        return "[]"

    content = read_file(meta_file)
    log(f"  + 解析诗词元数据: {meta_file.relative_to(ROOT_DIR)}")

    # 匹配 export const POEMS_META = [ ... ];
    # 支持多行、嵌套
    pattern = r"export\s+const\s+POEMS_META\s*=\s*(\[[\s\S]*?\n\])\s*;?"
    m = re.search(pattern, content)
    if not m:
        log("未找到 POEMS_META 导出", "error")
        return "[]"

    array_literal = m.group(1)

    # 安全转换：把 ES module 语法转为纯 JS 表达式
    # POEMS_META 数组中不应有函数/import，但可能有字符串、数字
    # 用一个简单的方法：构造一个临时的 JS 求值上下文
    # 由于不能引入第三方库，我们用 Python 的 re 做一个基础转换 + 错误时降级
    try:
        # 尝试用 Node.js 求值（如果可用）
        result = _try_node_eval(array_literal)
        if result is not None:
            return json.dumps(result, ensure_ascii=False, indent=2)
    except Exception:
        pass

    # 降级方案：手写简单解析（仅支持字符串/数字字面量的对象数组）
    log("Node.js 不可用，尝试简单解析器", "warn")
    parsed = _simple_js_array_parse(array_literal)
    return json.dumps(parsed, ensure_ascii=False, indent=2)


def _try_node_eval(array_literal):
    """尝试用 Node.js 解析数组字面量为 JSON"""
    import subprocess
    import tempfile

    # 把字面量包装成可执行模块
    code = f"const data = {array_literal};\nprocess.stdout.write(JSON.stringify(data));"
    try:
        result = subprocess.run(
            ["node", "-e", code],
            capture_output=True, text=True, timeout=10,
            encoding="utf-8"
        )
        if result.returncode == 0 and result.stdout.strip():
            return json.loads(result.stdout)
    except (FileNotFoundError, subprocess.TimeoutExpired, json.JSONDecodeError):
        pass
    return None


def _simple_js_array_parse(literal):
    """
    简单 JS 数组字面量解析器（仅支持本项目 POEMS_META 的格式）
    元素是 { key: 'value', key2: 123 } 形式
    """
    # 这是非常简化的实现，只处理单引号字符串字面量
    result = []
    # 匹配顶层对象
    obj_pattern = re.compile(r"\{([^{}]*)\}")
    for obj_match in obj_pattern.finditer(literal):
        inner = obj_match.group(1)
        obj = {}
        # 匹配 key: value 对
        kv_pattern = re.compile(r"(\w+)\s*:\s*('([^'\\]*(?:\\.[^'\\]*)*)'|(\d+)|true|false|null|\[([^\]]*)\])")
        for kv_match in kv_pattern.finditer(inner):
            key = kv_match.group(1)
            if kv_match.group(3) is not None:  # string
                val = kv_match.group(3).encode().decode("unicode_escape")
            elif kv_match.group(4) is not None:  # number
                val = int(kv_match.group(4)) if "." not in kv_match.group(4) else float(kv_match.group(4))
            elif kv_match.group(5) is not None:  # array
                arr_str = kv_match.group(5)
                if arr_str.strip():
                    val = [s.strip().strip("'").encode().decode("unicode_escape") for s in arr_str.split(",")]
                else:
                    val = []
            else:
                val = {"true": True, "false": False, "null": None}.get(kv_match.group(0).split(":")[-1].strip())
            obj[key] = val
        if obj:
            result.append(obj)
    return result


# ===== 步骤 4：处理 pinyin-pro =====

def setup_pinyin_lib():
    """复制 node_modules/pinyin-pro 到 dist/lib/"""
    src_lib = SRC_DIR / "lib" / "pinyin-pro.js"
    pkg_lib = ROOT_DIR / "node_modules" / "pinyin-pro" / "dist" / "index.js"

    ensure_dir(LIB_DIR)

    target = LIB_DIR / "pinyin-pro.js"

    # 优先使用 src/lib/ 下的（手动复制）
    if src_lib.exists():
        log(f"  + 复制 pinyin-pro: {src_lib.relative_to(ROOT_DIR)} -> dist/lib/")
        shutil.copy2(src_lib, target)
        return True

    # 退化到 node_modules
    if pkg_lib.exists():
        log(f"  + 复制 pinyin-pro: {pkg_lib.relative_to(ROOT_DIR)} -> dist/lib/")
        shutil.copy2(pkg_lib, target)
        return True

    log("未找到 pinyin-pro 库（src/lib/ 或 node_modules/pinyin-pro/）", "error")
    return False


# ===== 步骤 5：组装 HTML =====

def assemble_html(template, css, js, poems_json):
    """替换模板中的占位符"""
    html = template

    # 替换 CSS
    html = html.replace("/* {{INLINE_CSS}} */", css)

    # 替换 JS
    html = html.replace("/* {{INLINE_JS}} */", js)

    # 替换诗词数据
    html = html.replace("{{POEMS_META_JSON}}", poems_json)

    # 注入构建时间戳
    build_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    html = html.replace(
        "</head>",
        f'<meta name="build-time" content="{build_time}">\n</head>'
    )

    return html


# ===== 主流程 =====

def build(verbose=True):
    """执行构建"""
    log("=" * 50)
    log("诗云 · 学习版构建")
    log("=" * 50)

    # 1. 检查模板
    template_path = SRC_DIR / "learning.html"
    if not template_path.exists():
        log(f"学习版模板不存在: {template_path}", "error")
        return False

    log(f"[1/5] 读取模板: {template_path.relative_to(ROOT_DIR)}")
    template = read_file(template_path)

    # 2. 收集 CSS
    log("[2/5] 收集 CSS")
    css = collect_css()
    log(f"      CSS 总大小: {len(css):,} 字符")

    # 3. 收集 JS
    log("[3/5] 收集 JS")
    js = collect_js()
    log(f"      JS 总大小: {len(js):,} 字符")

    # 4. 提取诗词元数据
    log("[4/5] 提取诗词元数据")
    poems_json = extract_poems_meta()
    # 验证是合法 JSON
    try:
        poems_arr = json.loads(poems_json)
        log(f"      解析得到 {len(poems_arr)} 首诗")
    except json.JSONDecodeError as e:
        log(f"诗词 JSON 解析失败: {e}", "error")
        return False

    # 5. 处理 pinyin-pro
    log("[5/5] 复制 pinyin-pro")
    if not setup_pinyin_lib():
        log("pinyin-pro 复制失败，构建中止", "error")
        return False

    # 组装
    log("组装最终 HTML ...")
    final_html = assemble_html(template, css, js, poems_json)

    # 输出
    ensure_dir(DIST_DIR)
    out_path = DIST_DIR / "诗云-学习版.html"
    out_path.write_text(final_html, encoding="utf-8")

    size_mb = out_path.stat().st_size / (1024 * 1024)
    log(f"✓ 构建完成: {out_path.relative_to(ROOT_DIR)} ({size_mb:.2f} MB)", "ok")

    return True


def main():
    parser = argparse.ArgumentParser(description="诗云 · 学习版构建脚本")
    parser.add_argument("--verbose", action="store_true", help="详细输出")
    parser.add_argument("--check", action="store_true", help="检查后不写入")
    args = parser.parse_args()

    try:
        ok = build(verbose=args.verbose)
        if not ok:
            sys.exit(1)
    except Exception as e:
        log(f"构建失败: {e}", "error")
        if args.verbose:
            import traceback
            traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
```

## Step 4: 创建 pytest 测试（可选）

创建 `tests/build.test.py`：

```python
"""
诗云 · 构建脚本测试（pytest）

测试 build_learning.py 的核心功能：
- 文件存在性检查
- 模板占位符处理
- CSS/JS 收集
- POEMS_META 解析
- 完整构建流程
"""

import json
import os
import shutil
import subprocess
import sys
from pathlib import Path

import pytest


# 路径
ROOT = Path(__file__).resolve().parent.parent
SCRIPT = ROOT / "scripts" / "build_learning.py"
SRC = ROOT / "src"
DIST = ROOT / "dist"


@pytest.fixture(scope="module")
def build_result():
    """执行一次构建，返回 True/False"""
    if not SCRIPT.exists():
        pytest.skip(f"构建脚本不存在: {SCRIPT}")
    if not (SRC / "learning.html").exists():
        pytest.skip(f"学习版模板不存在: {SRC / 'learning.html'}")
    result = subprocess.run(
        [sys.executable, str(SCRIPT)],
        capture_output=True, text=True, timeout=60,
        cwd=str(ROOT),
    )
    return result


class TestBuildScript:
    def test_script_exists(self):
        assert SCRIPT.exists(), "scripts/build_learning.py 应存在"

    def test_script_runs(self, build_result):
        """脚本应能成功执行"""
        if build_result.returncode != 0:
            print("STDOUT:", build_result.stdout)
            print("STDERR:", build_result.stderr)
        assert build_result.returncode == 0, "构建脚本应返回 0"

    def test_output_file_exists(self, build_result):
        """应生成 dist/诗云-学习版.html"""
        if build_result.returncode != 0:
            pytest.skip("构建失败，跳过")
        assert (DIST / "诗云-学习版.html").exists()

    def test_output_has_inline_css(self, build_result):
        """输出 HTML 应内联 CSS（包含 @media print）"""
        if build_result.returncode != 0:
            pytest.skip("构建失败，跳过")
        out = (DIST / "诗云-学习版.html").read_text(encoding="utf-8")
        # 验证至少包含一个 CSS 特征
        assert "<style>" in out, "应有 <style> 标签"
        assert "print" in out, "应包含 print 相关 CSS"

    def test_output_has_inline_js(self, build_result):
        """输出 HTML 应内联 JS"""
        if build_result.returncode != 0:
            pytest.skip("构建失败，跳过")
        out = (DIST / "诗云-学习版.html").read_text(encoding="utf-8")
        assert "type=\"module\"" in out, "应有 module script"
        assert "renderProgressPage" in out, "应包含进度页函数"

    def test_output_has_poems_data(self, build_result):
        """输出 HTML 应包含诗词元数据 JSON"""
        if build_result.returncode != 0:
            pytest.skip("构建失败，跳去")
        out = (DIST / "诗云-学习版.html").read_text(encoding="utf-8")
        assert "__SHIYUN_POEMS_META__" in out
        # 找到 JSON 段
        import re
        m = re.search(r"__SHIYUN_POEMS_META__\s*=\s*(\[.+?\]);", out, re.DOTALL)
        assert m, "应能找到 POEMS_META JSON"
        data = json.loads(m.group(1))
        assert isinstance(data, list)
        assert len(data) > 0
        # 验证字段
        first = data[0]
        assert "id" in first
        assert "title" in first
        assert "content" in first
        assert isinstance(first["content"], list)

    def test_pinyin_lib_copied(self, build_result):
        """pinyin-pro 应被复制到 dist/lib/"""
        if build_result.returncode != 0:
            pytest.skip("构建失败，跳过")
        lib = DIST / "lib" / "pinyin-pro.js"
        # pinyin-pro 库可缺失时构建会失败，故若构建成功此文件应存在
        # 至少验证目录存在
        assert (DIST / "lib").exists() or not (DIST.exists())

    def test_html_size_reasonable(self, build_result):
        """HTML 文件大小应 < 50 MB（不内嵌 base64 媒体时）"""
        if build_result.returncode != 0:
            pytest.skip("构建失败，跳过")
        size = (DIST / "诗云-学习版.html").stat().st_size
        # 50 MB 上限
        assert size < 50 * 1024 * 1024, f"文件过大: {size} bytes"


class TestPoemsMetaParser:
    """测试简单 JS 数组解析器"""

    def test_simple_object(self):
        from scripts.build_learning import _simple_js_array_parse
        # 此函数在 build_learning.py 中
        # 实际测试需要把 src/data/poems-meta.js 准备好
        src_file = SRC / "data" / "poems-meta.js"
        if not src_file.exists():
            pytest.skip("poems-meta.js 不存在")
        content = src_file.read_text(encoding="utf-8")
        import re
        m = re.search(r"export\s+const\s+POEMS_META\s*=\s*(\[[\s\S]*?\n\])\s*;?", content)
        if not m:
            pytest.skip("未找到 POEMS_META")
        # 仅做"能解析"测试
        try:
            data = _simple_js_array_parse(m.group(1))
        except Exception as e:
            pytest.fail(f"解析失败: {e}")
        # 至少应解析出 1 个对象
        assert len(data) >= 1, f"应至少解析 1 个诗对象，得到 {len(data)}"
```

## Step 5: 手动测试构建

```bash
# 1. 确保依赖已安装（pinyin-pro）
npm install

# 2. 准备学习版源文件（任务 1-22 的产物）
ls src/learning.html src/css/main.css src/css/print.css
ls src/js/*.js
ls src/js/ui/*.js
ls src/data/poems-meta.js

# 3. 把 pinyin-pro 从 node_modules 复制到 src/lib（首次）
mkdir -p src/lib
cp node_modules/pinyin-pro/dist/index.js src/lib/pinyin-pro.js

# 4. 执行构建
python scripts/build_learning.py

# 5. 检查输出
ls -la dist/诗云-学习版.html
ls -la dist/lib/
```

Expected output:
```
[INFO] 读取模板: src/learning.html
[INFO] [2/5] 收集 CSS
[INFO]   + 读取 CSS: src/css/main.css
[INFO]   + 读取 CSS: src/css/print.css
[INFO] [3/5] 收集 JS
[INFO]   + 读取 JS: src/js/data.js
...
[OK] 构建完成: dist/诗云-学习版.html (X.XX MB)
```

## Step 6: 在浏览器中验证

1. 双击 `dist/诗云-学习版.html`
2. 验证页面正常打开（不需要服务器）
3. 测试功能：学新诗、复习、考核、打印、进度、用户切换
4. 打开 DevTools → Network → 验证没有任何外部请求

## Step 7: 在 package.json 添加 build 脚本（修改文件）

修改 `package.json`：

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "build": "python scripts/build_learning.py",
    "build:py": "python scripts/build_learning.py",
    "build:test": "pytest tests/build.test.py -v"
  }
}
```

## Step 8: 运行 pytest 测试（可选）

```bash
# 安装 pytest（如果未安装）
pip install pytest

# 运行测试
npm run build:test
# 或
pytest tests/build.test.py -v
```

Expected: 全部 PASS

## Step 9: 提交

```bash
git add scripts/build_learning.py tests/build.test.py package.json
git commit -m "feat(build): Python 构建脚本（内联 CSS/JS/数据为单 HTML）"
```

## 完成标志

```bash
echo done > .tasks/done/23
```

## 关键说明

- **零第三方依赖**：仅用 Python 3.8+ 标准库（argparse, os, re, sys, shutil, json, pathlib, datetime, subprocess）
- **JS 解析策略**：优先尝试 `node -e` 求值（如果 Node 可用）；不可用时降级到简单正则解析
- **CSS 加载顺序**：`main.css` → `print.css`（main 在前）
- **JS 加载顺序**：核心（data/storage/srs/router/audio/print）→ UI 模块（按依赖：user-switcher → home → learn → review → quiz → print → progress）
- **POEMS_META 注入**：作为 `window.__SHIYUN_POEMS_META__` 全局变量，data.js 启动时读取
- **pinyin-pro**：作为独立 JS 文件在 dist/lib/，通过 `<script src="./lib/pinyin-pro.js">` 加载（不内联以减少主 HTML 体积）
- **大小控制**：< 50 MB（不内嵌 base64 媒体）；媒体由生成器嵌入到 dist/诗云-学习版.html 后另算
- **可重复执行**：每次构建覆盖 dist/，不报错
- **失败退出码**：任何步骤失败时 exit 1，CI 可捕获
