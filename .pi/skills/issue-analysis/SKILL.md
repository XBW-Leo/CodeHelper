---
name: issue-analysis
description: GitHub issue 分析：读取 issue 与评论，分类、评估影响面，输出分阶段实施计划。当用户提供 issue 编号或 URL 要求分析时使用。
---

# Issue 分析

## 何时使用

- 用户给出 GitHub issue 编号或 URL，要求分析
- 需要把 issue 转成可执行的实施计划

## 工作流

1. **定位**：解析 `#N`、`owner/repo#N` 或完整 URL；用 `gh issue view <target> --json number,title,body,state,labels,comments,assignees,url,createdAt` 读取（可配合 `gh issue list` 确认）。
2. **通读**：标题、描述、全部评论（含用户补充与维护者澄清），理解真实诉求。
3. **分类**：bug / feature / 提问 / 其他；判断问题是否可复现、需求是否清晰。
4. **影响面分析**：结合仓库现状，用只读命令（`rg`、`ls`、`git log`、`git grep`）判断涉及的文件与模块。
5. **输出**：结构化分析（问题本质 / 根因或需求拆解 / 风险点）+ 分阶段实施计划（目标、步骤、涉及文件、验收标准），格式与 `/plan` 对齐。
6. **停下**：停在计划阶段，等用户确认后再 `/implement`，不擅自实施。

## 规则

- 全程只读，不修改任何文件
- 信息不足时，明确列出需要用户澄清的问题，不臆测
- 只分析 issue 本身，不扩大需求范围
- 关联的 PR、commit、标签变化作为背景信息参考

