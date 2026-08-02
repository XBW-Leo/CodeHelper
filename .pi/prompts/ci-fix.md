---
description: 分析 CI/PR 检查失败：列检查、拉日志、定位根因、给修复建议
argument-hint: "<PR 编号或 URL>"
---
请分析以下 PR 的 CI 检查状态：$ARGUMENTS

先加载并遵循 `ci-failure-analysis` skill（`.pi/skills/ci-failure-analysis/SKILL.md`）的流程：

1. 用 gh 定位 PR 与 head commit。
2. 列出全部 check-runs 及结论（含失败步骤）。
3. 对失败的检查拉取 annotations 与 job 日志。
4. 根据日志在本地只读复现，确认根因。
5. 输出：失败项、根因、涉及文件、修复建议；停在建议阶段，等我确认后再实施。

规则：只读分析，不修改 PR、不 push、不 checkout 他人分支。

推荐模型档位：heavy（pro 级推理）。
