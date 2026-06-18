#!/bin/bash
echo "=========================================="
echo "  诗云 · 一键验证"
echo "=========================================="
echo
echo "[1/3] 单元测试..."
npm test
echo
echo "[2/3] 构建测试..."
pytest tests/test_build_script.py -v
echo
echo "[3/3] 重新构建..."
python scripts/build_learning.py
echo
echo "=========================================="
echo "  验证完成"
echo "=========================================="
