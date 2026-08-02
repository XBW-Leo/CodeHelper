---
name: ci-failure-analysis
description: CI/PR 检查失败分析：列出检查状态、拉取失败日志、定位根因、给出修复建议。当用户提供 PR 或 commit 要求分析 CI 失败时使用。
---

# CI / PR 失败分析

## 何时使用

- PR 的 CI 检查失败
- 需要了解某个 commit 的检查状态与失败原因

## 工作流

1. **定位**：解析 PR 编号 / URL 或 commit sha；用 `gh pr view <target> --json number,title,headRefName,headRefOid,state,url` 确认，或用 `gh api repos/{owner}/{repo}/commits/{sha}/check-runs?per_page=100` 直接取检查。
2. **概览**：列出全部 check-runs：name、status、conclusion、失败步骤；区分失败项与成功项。
3. **失败详情**：对每个 failed 的 check，拉取 annotations 与 job 日志：`gh api repos/{owner}/{repo}/check-runs/{id}/annotations`、`gh api repos/{owner}/{repo}/check-runs/{id}/jobs`；必要时继续取 job 的 steps 日志。
4. **本地复现**：根据日志在本地执行对应命令（只读，不修改代码），确认根因。
5. **输出**：失败项列表、根因、涉及文件、修复建议；停在建议阶段，等用户确认后再实施。
6. **报告**：本地复现结果、修复建议、风险。

## 规则

- 只读分析：不修改 PR、不 push、不 checkout 他人分支
- 失败信息不足时，明确说明缺少什么信息
- 若 PR 属于其他仓库，只做分析并提示边界，不擅自改动
- 一次聚焦一个失败项，避免多任务并行猜测

