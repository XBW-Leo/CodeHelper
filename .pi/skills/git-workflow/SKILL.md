---
name: git-workflow
description: 安全的 Git 操作与规范化提交流程（Conventional Commits）。当需要提交、创建分支、查看状态、合并或处理 Git 状态时使用。
---

# Git 工作流

## 安全规则

- 只暂存明确路径的文件：`git add <path>`；**禁止** `git add .` / `git add -A`。
- **禁止**破坏性命令：`git reset --hard`、`git checkout .`、`git clean -fd`、`git stash`（除非用户明确要求）。
- force push 前必须明确告知用户并征得同意。
- 提交前运行 `git status` 确认暂存区只包含本次任务相关的文件。
- 不提交其他会话/其他任务修改的文件。

## 提交信息格式

```
<type>[optional scope]: <description>

<body（可选，解释 why，多行用 - 开头）>
```

type 取值：`feat`、`fix`、`docs`、`style`、`refactor`、`perf`、`test`、`chore`。

## 常用流程

### 查看状态

```bash
./scripts/branch-status.sh
```

输出当前分支、工作区状态、暂存区与未暂存改动摘要。

### 规范化提交

1. `git status` + `git diff` 确认改动范围
2. 逐个暂存相关文件：`git add <path>`
3. 运行项目校验（如 `npm run validate` 或对应测试）
4. 按上述格式提交：`git commit -m "<type>: <description>"`

### 创建分支

```bash
git switch -c feature/<slug>   # 功能分支
git switch -c fix/<slug>       # 修复分支
```

分支命名约定可在 AGENTS.md 或用户指令中调整。

### 关联 issue

提交信息中按需加入 `closes #<issue>`（单个 issue）或逐个重复 `closes #1, closes #2`（多个 issue）。

