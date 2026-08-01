#!/usr/bin/env bash
# 输出当前分支与工作区状态摘要（只读）
set -uo pipefail

echo "== Branch =="
git branch --show-current 2>/dev/null || echo "(detached HEAD)"

echo ""
echo "== Status =="
git status --short

echo ""
echo "== Staged diff stat =="
git diff --cached --stat

echo ""
echo "== Unstaged diff stat =="
git diff --stat
