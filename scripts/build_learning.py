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
5. 复制 src/lib/pinyin-pro.* 到 dist/lib/
6. 输出 dist/诗云-学习版.html

依赖：仅 Python 3.8+ 标准库（无第三方包）
"""

import argparse
import json
import re
import shutil
import subprocess
import sys
from datetime import datetime
from pathlib import Path


SCRIPT_DIR = Path(__file__).resolve().parent
ROOT_DIR = SCRIPT_DIR.parent
SRC_DIR = ROOT_DIR / "src"
DIST_DIR = ROOT_DIR / "dist"
LIB_DIR = DIST_DIR / "lib"


COLORS = {
    "info": "\033[94m",
    "ok": "\033[92m",
    "warn": "\033[93m",
    "error": "\033[91m",
}
RESET = "\033[0m"


def log(msg, level="info"):
    c = COLORS.get(level, "")
    sys.stdout.buffer.write(f"{c}[{level.upper()}]{RESET} {msg}\n".encode("utf-8"))
    sys.stdout.buffer.flush()


def read_text(path):
    return Path(path).read_text(encoding="utf-8")


def ensure_dir(p):
    Path(p).mkdir(parents=True, exist_ok=True)


def collect_css():
    css_dir = SRC_DIR / "css"
    if not css_dir.exists():
        return ""
    parts = []
    for f in sorted(css_dir.glob("*.css")):
        log(f"  + CSS: {f.relative_to(ROOT_DIR)}")
        parts.append(f"/* === {f.name} === */\n{read_text(f)}")
    return "\n\n".join(parts)


CORE_JS = [
    "js/data.js",
    "js/storage.js",
    "js/srs.js",
    "js/router.js",
    "js/audio.js",
    "js/print.js",
    "js/quiz/fill.js",
    "js/quiz/choice.js",
    "js/quiz/order.js",
    "js/quiz/listen.js",
    "js/main.js",
]


def collect_js():
    parts = []
    for rel in CORE_JS:
        f = SRC_DIR / rel
        if f.exists():
            log(f"  + JS: {f.relative_to(ROOT_DIR)}")
            parts.append(f"// === {rel} ===\n{read_text(f)}")
        else:
            log(f"  - 缺失: {rel}", "warn")
    ui_dir = SRC_DIR / "js" / "ui"
    if ui_dir.exists():
        for f in sorted(ui_dir.glob("*.js")):
            rel = f.relative_to(SRC_DIR).as_posix()
            log(f"  + UI: {rel}")
            parts.append(f"// === {rel} ===\n{read_text(f)}")
    return "\n\n".join(parts)


def extract_poems_meta():
    meta_file = SRC_DIR / "data" / "poems-meta.js"
    if not meta_file.exists():
        log(f"诗词元数据文件不存在: {meta_file}", "error")
        return "[]"
    content = read_text(meta_file)
    log(f"  + 解析: {meta_file.relative_to(ROOT_DIR)}")
    m = re.search(r"export\s+const\s+POEMS_META\s*=\s*(\[[\s\S]*?\n\])\s*;?", content)
    if not m:
        log("未找到 POEMS_META 导出", "error")
        return "[]"
    literal = m.group(1)
    try:
        result = _try_node_eval(literal)
        if result is not None:
            return json.dumps(result, ensure_ascii=False, indent=2)
    except Exception:
        pass
    log("Node.js 不可用，使用 Python 直接求值", "warn")
    parsed = _simple_parse(literal)
    return json.dumps(parsed, ensure_ascii=False, indent=2)


def _try_node_eval(literal):
    code = f"const data = {literal};\nprocess.stdout.write(JSON.stringify(data));"
    result = subprocess.run(
        ["node", "-e", code], capture_output=True, text=True, timeout=10, encoding="utf-8"
    )
    if result.returncode == 0 and result.stdout.strip():
        return json.loads(result.stdout)
    return None


def _simple_parse(literal):
    """Extract objects using regex (string/number/array values only)."""
    result = []
    for obj_match in re.finditer(r"\{([^{}]*)\}", literal):
        inner = obj_match.group(1)
        obj = {}
        for kv in re.finditer(
            r"(\w+)\s*:\s*('([^'\\]*(?:\\.[^'\\]*)*)'|(\d+(?:\.\d+)?)|true|false|null|\[([^\]]*)\])",
            inner,
        ):
            key = kv.group(1)
            if kv.group(3) is not None:
                obj[key] = kv.group(3).encode().decode("unicode_escape")
            elif kv.group(4) is not None:
                v = kv.group(4)
                obj[key] = int(v) if "." not in v else float(v)
            elif kv.group(5) is not None:
                arr_str = kv.group(5).strip()
                obj[key] = [s.strip().strip("'").encode().decode("unicode_escape")
                            for s in arr_str.split(",") if s.strip()] if arr_str else []
            else:
                obj[key] = {"true": True, "false": False, "null": None}[kv.group(0).split(":")[-1].strip()]
        if obj:
            result.append(obj)
    return result


def setup_pinyin_lib():
    ensure_dir(LIB_DIR)
    src_candidates = [
        SRC_DIR / "lib" / "pinyin-pro.min.js",
        SRC_DIR / "lib" / "pinyin-pro.js",
        ROOT_DIR / "node_modules" / "pinyin-pro" / "dist" / "index.js",
    ]
    for src in src_candidates:
        if src.exists():
            target = LIB_DIR / src.name
            log(f"  + 复制: {src.relative_to(ROOT_DIR)} -> dist/lib/")
            shutil.copy2(src, target)
            return True
    log("未找到 pinyin-pro 库", "error")
    return False


def assemble_html(template, css, js, poems_json):
    html = template
    html = html.replace("<!-- @@STYLES -->", f"<style>\n{css}\n</style>")
    html = html.replace("<!-- @@DATA -->", f"<script>window.__SHIYUN_POEMS_META__ = {poems_json};</script>")
    html = html.replace("<!-- @@SCRIPTS -->", f'<script type="module">\n{js}\n</script>\n<script src="./lib/pinyin-pro.min.js"></script>')
    build_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    html = html.replace("</head>", f'<meta name="build-time" content="{build_time}">\n</head>')
    return html


def build():
    log("=" * 50)
    log("诗云 · 学习版构建")
    log("=" * 50)

    template_path = SRC_DIR / "learning.template.html"
    if not template_path.exists():
        log(f"模板不存在: {template_path}", "error")
        return False
    log(f"[1/5] 模板: {template_path.relative_to(ROOT_DIR)}")
    template = read_text(template_path)

    log("[2/5] CSS")
    css = collect_css()
    log(f"      CSS {len(css):,} 字符")

    log("[3/5] JS")
    js = collect_js()
    log(f"      JS {len(js):,} 字符")

    log("[4/5] 诗词元数据")
    poems_json = extract_poems_meta()
    try:
        poems = json.loads(poems_json)
        log(f"      {len(poems)} 首诗")
    except json.JSONDecodeError as e:
        log(f"诗词 JSON 解析失败: {e}", "error")
        return False

    log("[5/5] pinyin-pro 库")
    if not setup_pinyin_lib():
        return False

    log("组装 HTML ...")
    final = assemble_html(template, css, js, poems_json)
    ensure_dir(DIST_DIR)
    out = DIST_DIR / "诗云-学习版.html"
    out.write_text(final, encoding="utf-8")
    size_mb = out.stat().st_size / (1024 * 1024)
    log(f"[OK] 完成: {out.relative_to(ROOT_DIR)} ({size_mb:.2f} MB)", "ok")
    return True


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    try:
        ok = build()
        if not ok:
            sys.exit(1)
    except Exception as e:
        log(f"构建失败: {e}", "error")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
