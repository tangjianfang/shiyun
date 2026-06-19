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
    "data/authors-meta.js",
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


def extract_export_names(content):
    """从 ES 模块内容中提取所有被 export 的符号名。"""
    names = set()
    # export function foo / export async function foo
    for m in re.finditer(r"export\s+(?:async\s+)?function\s+(\w+)", content):
        names.add(m.group(1))
    # export const/let/var foo
    for m in re.finditer(r"export\s+(?:const|let|var)\s+(\w+)", content):
        names.add(m.group(1))
    # export class Foo
    for m in re.finditer(r"export\s+class\s+(\w+)", content):
        names.add(m.group(1))
    # export { foo, bar as baz }
    for m in re.finditer(r"export\s*\{([^}]+)\}", content):
        for part in m.group(1).split(","):
            tokens = part.strip().split()
            if not tokens:
                continue
            # "name as alias" → 外部名是 alias
            if len(tokens) >= 3 and tokens[1].lower() == "as":
                names.add(tokens[2])
            else:
                names.add(tokens[0])
    return names


def strip_and_iife(content):
    """
    将单个 ES 模块转换为 IIFE（立即执行函数），以隔离模块私有变量。
    - 导出的符号通过外部 var 声明对外暴露
    - import 别名（as 语法）在 IIFE 内用 var 赋值补齐
    - 导入语句被移除（依赖已在同一 script 块中按序定义）
    返回 (var_decls_str, iife_str)
    """
    exported = extract_export_names(content)

    # 先收集 import 别名（{ orig as alias }），在 IIFE 顶部生成 var alias = orig;
    alias_lines = []
    for m in re.finditer(
        r"import\s*\{([^}]+)\}\s*from\s*['\"][^'\"]+['\"]",
        content,
        re.DOTALL,
    ):
        for part in m.group(1).split(","):
            tokens = [t.strip() for t in part.strip().split()]
            if len(tokens) >= 3 and tokens[1] == "as":
                orig, alias = tokens[0], tokens[2]
                alias_lines.append(f"var {alias} = {orig};  // import alias")

    # 整体移除多行 import 语句
    content = re.sub(
        r"^import\s[\s\S]*?from\s+['\"][^'\"]+['\"]\s*;?\s*$",
        "",
        content,
        flags=re.MULTILINE,
    )
    content = re.sub(
        r"import\s*\{[^}]*\}\s*from\s+['\"][^'\"]+['\"]\s*;?",
        "",
        content,
        flags=re.DOTALL,
    )

    lines = content.split("\n")
    out = []
    for line in lines:
        s = line.strip()
        if re.match(r"^export\s*\{[^}]*\}\s*;?\s*$", s):
            continue
        line = re.sub(r"^(\s*)export\s+default\s+", r"\1", line)
        line = re.sub(r"^(\s*)export\s+(async\s+)function\s+(\w+)", r"\1\3 = \2function \3", line)
        line = re.sub(r"^(\s*)export\s+function\s+(\w+)", r"\1\2 = function \2", line)
        line = re.sub(r"^(\s*)export\s+class\s+(\w+)", r"\1\2 = class \2", line)
        line = re.sub(r"^(\s*)export\s+(?:const|let|var)\s+(\w+)", r"\1\2", line)
        out.append(line)

    body = "\n".join(out)
    if alias_lines:
        body = "\n".join(alias_lines) + "\n" + body
    iife = "(function() {\n" + body + "\n})();"
    var_decls = "".join(f"var {n};\n" for n in sorted(exported)) if exported else ""
    return var_decls, iife


def collect_js():
    # 顶部注入：从全局获取 POEMS_META 和 pinyin（pinyin-pro 已先行加载）
    preamble = (
        "// === 构建注入：全局依赖 ===\n"
        "var POEMS_META = window.__SHIYUN_POEMS_META__ || [];\n"
        "var pinyin = (typeof pinyinPro !== 'undefined') ? pinyinPro.pinyin : undefined;\n"
    )

    all_var_decls = []
    all_iifes = []

    def process_file(f, rel):
        content = read_text(f)
        var_decls, iife = strip_and_iife(content)
        if var_decls:
            all_var_decls.append(f"// exports: {rel}\n{var_decls}")
        all_iifes.append(f"// === {rel} ===\n{iife}")

    for rel in CORE_JS:
        f = SRC_DIR / rel
        if f.exists():
            log(f"  + JS: {f.relative_to(ROOT_DIR)}")
            process_file(f, rel)
        else:
            log(f"  - 缺失: {rel}", "warn")

    ui_dir = SRC_DIR / "js" / "ui"
    if ui_dir.exists():
        for f in sorted(ui_dir.glob("*.js")):
            rel = f.relative_to(SRC_DIR).as_posix()
            log(f"  + UI: {rel}")
            process_file(f, rel)

    parts = [preamble]
    if all_var_decls:
        parts.append("// === 模块导出声明 ===\n" + "\n".join(all_var_decls))
    parts.extend(all_iifes)
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


def _read_json(path):
    try:
        return json.loads(Path(path).read_text(encoding="utf-8"))
    except Exception:
        return {}


def enrich_poems(poems):
    """
    将本地生成的媒体与 AI 文本内容合并进诗词数据：
    - assets/audio/manifest.json → 把每首 MP3 以 base64 data URL 写入 poem['audio']
    - assets/images/manifest.json → 把每首图片压缩后以 base64 data URL 写入 poem['image']
    - assets/content/manifest.json → 合并 background/translation/annotations/theme/keywords
    返回 (audio_count, image_count, content_count)
    """
    import base64
    import io
    from PIL import Image

    # 图片压缩参数：缩放到此宽度（等比），JPEG quality
    # 960px / quality=78 → 平均约 130KB/张（原始 483KB），视觉质量仍清晰
    IMAGE_MAX_W  = 960
    IMAGE_QUALITY = 78

    def compress_image(raw_bytes):
        """读取图片，缩放到 IMAGE_MAX_W 宽（等比），重新编码为 JPEG 返回 bytes。"""
        try:
            img = Image.open(io.BytesIO(raw_bytes)).convert("RGB")
            w, h = img.size
            if w > IMAGE_MAX_W:
                img = img.resize((IMAGE_MAX_W, round(h * IMAGE_MAX_W / w)), Image.LANCZOS)
            buf = io.BytesIO()
            img.save(buf, format="JPEG", quality=IMAGE_QUALITY, optimize=True)
            return buf.getvalue()
        except Exception:
            return raw_bytes  # 压缩失败则保留原图

    audio_dir = ROOT_DIR / "assets" / "audio"
    images_dir = ROOT_DIR / "assets" / "images"
    audio_manifest = _read_json(audio_dir / "manifest.json")
    image_manifest = _read_json(images_dir / "manifest.json")
    content_manifest = _read_json(ROOT_DIR / "assets" / "content" / "manifest.json")

    audio_count = 0
    image_count = 0
    content_count = 0

    for poem in poems:
        pid = poem.get("id")

        # ── 音频内嵌 ──
        entry = audio_manifest.get(pid)
        if entry and entry.get("file"):
            mp3_path = ROOT_DIR / entry["file"]
            if mp3_path.exists():
                b64 = base64.b64encode(mp3_path.read_bytes()).decode("ascii")
                poem["audio"] = f"data:audio/mp3;base64,{b64}"
                if entry.get("durationMs"):
                    poem["audioDurationMs"] = entry["durationMs"]
                audio_count += 1

        # ── 配图内嵌（压缩后嵌入，减小文件体积） ──
        img_entry = image_manifest.get(pid)
        if img_entry and img_entry.get("file"):
            img_path = ROOT_DIR / img_entry["file"]
            if img_path.exists():
                raw = img_path.read_bytes()
                compressed = compress_image(raw)
                b64 = base64.b64encode(compressed).decode("ascii")
                poem["image"] = f"data:image/jpeg;base64,{b64}"
                image_count += 1

        # ── AI 文本内容合并 ──
        c = content_manifest.get(pid)
        if c:
            for field in ("background", "translation", "theme"):
                if c.get(field):
                    poem[field] = c[field]
            if c.get("annotations"):
                poem["annotations"] = c["annotations"]
            if c.get("keywords"):
                poem["keywords"] = c["keywords"]
            content_count += 1

    return audio_count, image_count, content_count


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


# ─────────────────────────────────────────────
# 静态依赖验证：扫描所有 JS 文件的 import/export
# 在构建前一次性报告所有缺失符号
# ─────────────────────────────────────────────

def _parse_imports(content):
    """返回 [(orig_name, source_path_str), ...] 列表。
    orig_name 是源文件里实际导出的名字（import { orig as alias } → orig）。
    """
    results = []
    for m in re.finditer(
        r"import\s*([\s\S]*?)\s*from\s*['\"]([^'\"]+)['\"]",
        content,
    ):
        clause, source = m.group(1).strip(), m.group(2)
        inner = re.search(r"\{([^}]+)\}", clause)
        if inner:
            for part in inner.group(1).split(","):
                tokens = [t.strip() for t in part.strip().split()]
                if not tokens:
                    continue
                # "orig as alias" → 检查源文件导出 orig，不是 alias
                orig = tokens[0]
                if orig:
                    results.append((orig, source))
        elif re.match(r"^\w+$", clause):
            results.append((clause, source))
    return results


def _resolve_source(src_rel, importer_path):
    """
    将 import 路径（相对于 importer_path 目录）解析为
    相对于 SRC_DIR 的 Path，只处理以 ./ 或 ../ 开头的相对路径。
    """
    if not src_rel.startswith("."):
        return None  # 第三方包（如 pinyin-pro），跳过
    base = (SRC_DIR / importer_path).parent
    resolved = (base / src_rel).resolve()
    try:
        return resolved.relative_to(SRC_DIR.resolve())
    except ValueError:
        return None


def validate_sources():
    """
    扫描 src/js/ 下所有 JS 文件：
    - 收集每个文件的 export 名称
    - 检查所有 import 引用的符号是否真的被目标文件 export
    返回错误数（0 = 全部 OK）
    """
    log("[PRE] 静态依赖验证 ...")

    js_dir = SRC_DIR / "js"
    # 收集所有 JS 文件的 exports
    file_exports: dict[str, set] = {}  # rel_path_str -> {names}
    all_js = list(js_dir.rglob("*.js"))
    for f in all_js:
        rel = f.relative_to(SRC_DIR)
        content = read_text(f)
        file_exports[str(rel)] = extract_export_names(content)

    # 已知的全局注入（构建时提供，不来自任何源文件）
    build_globals = {"POEMS_META", "pinyin"}

    errors = []
    warnings = []

    for f in all_js:
        rel_str = str(f.relative_to(SRC_DIR))
        content = read_text(f)
        imports = _parse_imports(content)
        for local_name, src_rel in imports:
            target_rel = _resolve_source(src_rel, rel_str)
            if target_rel is None:
                continue  # 第三方包，跳过
            target_key = str(target_rel)
            if not target_key.endswith(".js"):
                target_key += ".js"
            if target_key not in file_exports:
                warnings.append(f"  {rel_str}: 引用了不存在的模块 {src_rel}")
                continue
            if local_name in build_globals:
                continue
            if local_name not in file_exports[target_key]:
                errors.append(
                    f"  ✗ {rel_str}\n"
                    f"      import {{ {local_name} }} from '{src_rel}'\n"
                    f"      → {target_key} 未导出 '{local_name}'"
                )

    for w in warnings:
        log(w, "warn")
    if errors:
        log(f"发现 {len(errors)} 个缺失导出：", "error")
        for e in errors:
            log(e, "error")
    else:
        log("  ✓ 所有 import 符号均已验证", "ok")

    return len(errors)


def assemble_html(template, css, js, poems_json):
    html = template
    html = html.replace("<!-- @@STYLES -->", f"<style>\n{css}\n</style>")
    html = html.replace("<!-- @@DATA -->", f"<script>window.__SHIYUN_POEMS_META__ = {poems_json};</script>")
    html = html.replace("<!-- @@SCRIPTS -->", f'<script src="./lib/pinyin-pro.min.js"></script>\n<script>\n{js}\n</script>')
    build_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    html = html.replace("</head>", f'<meta name="build-time" content="{build_time}">\n</head>')
    return html


def build():
    log("=" * 50)
    log("诗云 · 学习版构建")
    log("=" * 50)

    # 构建前静态验证，有错误则中止
    err_count = validate_sources()
    if err_count:
        log(f"构建中止：请先修复以上 {err_count} 个缺失导出", "error")
        return False

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

    # 合并本地媒体与 AI 文本内容
    audio_count, image_count, content_count = enrich_poems(poems)
    log(f"      内嵌音频 {audio_count}/{len(poems)} 首，配图 {image_count}/{len(poems)} 首，AI 文本 {content_count}/{len(poems)} 首")
    poems_json = json.dumps(poems, ensure_ascii=False)
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
