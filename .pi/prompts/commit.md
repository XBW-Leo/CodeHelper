---
description: 规范化提交当前改动（Conventional Commits）
argument-hint: "[message]"
---
请整理并提交当前工作区的改动。

规则：
1. 先运行 `git status` 和 `git diff`，确认改动内容与范围。
2. 只暂存本次会话相关的文件，逐个执行 `git add <path>`；**禁止** `git add .` 或 `git add -A`。
3. 提交信息使用 Conventional Commits：`<type>[optional scope]: <description>`；type 从 feat / fix / docs / style / refactor / perf / test / chore 中选择。
4. 若提供了 $ARGUMENTS，优先用作提交信息；否则根据改动内容自动生成简洁、准确的信息。
5. 提交前运行项目校验命令（本仓库为 `npm run validate`；若涉及业务代码则运行对应测试）。
6. 提交后报告：提交 hash、包含的文件列表、提交信息。
