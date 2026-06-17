"""
诗云 · 构建脚本测试

测试 build_learning.py 的核心功能：
- 脚本存在
- 能成功执行
- 输出 HTML 包含内联 CSS / JS / 诗词元数据
- pinyin-pro 已复制到 dist/lib/
- 输出文件大小合理
"""

import json
import re
import subprocess
import sys
from pathlib import Path

import pytest


ROOT = Path(__file__).resolve().parent.parent
SCRIPT = ROOT / "scripts" / "build_learning.py"
SRC = ROOT / "src"
DIST = ROOT / "dist"


@pytest.fixture(scope="module")
def build_result():
    if not SCRIPT.exists():
        pytest.skip(f"构建脚本不存在: {SCRIPT}")
    if not (SRC / "learning.template.html").exists():
        pytest.skip(f"模板不存在: {SRC / 'learning.template.html'}")
    return subprocess.run(
        [sys.executable, str(SCRIPT)],
        capture_output=True, text=True, timeout=60,
        cwd=str(ROOT), encoding="utf-8",
    )


class TestBuildScript:
    def test_script_exists(self):
        assert SCRIPT.exists(), "scripts/build_learning.py 应存在"

    def test_script_runs(self, build_result):
        if build_result.returncode != 0:
            print("STDOUT:", build_result.stdout)
            print("STDERR:", build_result.stderr)
        assert build_result.returncode == 0

    def test_output_file_exists(self, build_result):
        if build_result.returncode != 0:
            pytest.skip("构建失败")
        assert (DIST / "诗云-学习版.html").exists()

    def test_output_has_inline_css(self, build_result):
        if build_result.returncode != 0:
            pytest.skip("构建失败")
        out = (DIST / "诗云-学习版.html").read_text(encoding="utf-8")
        assert "<style>" in out
        assert "print" in out, "应包含 print 相关 CSS"

    def test_output_has_inline_js(self, build_result):
        if build_result.returncode != 0:
            pytest.skip("构建失败")
        out = (DIST / "诗云-学习版.html").read_text(encoding="utf-8")
        assert 'type="module"' in out
        assert "renderProgressPage" in out

    def test_output_has_poems_data(self, build_result):
        if build_result.returncode != 0:
            pytest.skip("构建失败")
        out = (DIST / "诗云-学习版.html").read_text(encoding="utf-8")
        assert "__SHIYUN_POEMS_META__" in out
        m = re.search(r"__SHIYUN_POEMS_META__\s*=\s*(\[.+?\]);", out, re.DOTALL)
        assert m, "应能找到 POEMS_META JSON"
        data = json.loads(m.group(1))
        assert isinstance(data, list)
        assert len(data) > 0
        first = data[0]
        assert "id" in first
        assert "title" in first
        assert "content" in first
        assert isinstance(first["content"], list)

    def test_pinyin_lib_copied(self, build_result):
        if build_result.returncode != 0:
            pytest.skip("构建失败")
        lib = DIST / "lib"
        assert lib.exists()
        # 至少应有一个 pinyin-pro 文件
        files = list(lib.glob("pinyin-pro*"))
        assert files, "应有 pinyin-pro 库文件"

    def test_html_size_reasonable(self, build_result):
        if build_result.returncode != 0:
            pytest.skip("构建失败")
        size = (DIST / "诗云-学习版.html").stat().st_size
        assert size < 5 * 1024 * 1024, f"文件过大: {size} bytes"
        assert size > 50 * 1024, f"文件过小: {size} bytes"

    def test_poem_count_is_112(self, build_result):
        """应包含 112 首诗（部编版 1-6 年级）"""
        if build_result.returncode != 0:
            pytest.skip("构建失败")
        out = (DIST / "诗云-学习版.html").read_text(encoding="utf-8")
        m = re.search(r"__SHIYUN_POEMS_META__\s*=\s*(\[.+?\]);", out, re.DOTALL)
        data = json.loads(m.group(1))
        assert len(data) == 112
