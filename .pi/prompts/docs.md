---
description: 更新项目文档
argument-hint: "[范围或主题]"
model-tier: light
---
请更新项目文档。主题/范围：${@:-根据当前改动自动判断}

要求：
1. 只更新与本次改动相关的文档，不重写无关部分。
2. 保持文档与代码一致：命令、路径、参数示例必须真实可运行。
3. 按项目结构更新：README.md、docs/*.md；涉及 .pi 资源变更时同步 docs/workflows.md；完成开发阶段后更新 PLAN.md 状态。
4. 报告改了哪些文档、为什么改。
