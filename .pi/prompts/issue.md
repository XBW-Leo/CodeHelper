---
description: 分析 GitHub issue 并输出分阶段实施计划
argument-hint: "<issue 编号或 URL>"
model-tier: heavy
---
请分析以下 GitHub issue：$ARGUMENTS

先加载并遵循 `issue-analysis` skill（`.pi/skills/issue-analysis/SKILL.md`）的流程：

1. 用 `gh issue view` 读取 issue 全文（标题、描述、评论、labels、state）。
2. 分类：bug / feature / 提问 / 其他。
3. 结合仓库现状分析影响面（只使用只读命令）。
4. 输出：问题本质、影响面、分阶段实施计划（目标 / 步骤 / 涉及文件 / 验收标准）。
5. 停在计划阶段，不实施；等我确认后再用 /implement。
