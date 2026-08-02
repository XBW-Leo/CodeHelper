---
description: 为函数/模块生成单元测试骨架并运行验证
argument-hint: "<目标文件或模块>"
---
请为目标生成单元测试骨架：$ARGUMENTS

先加载并遵循 `test-generation` skill（`.pi/skills/test-generation/SKILL.md`）的流程：

1. 通读目标代码与依赖，确认测试框架与项目风格。
2. 为每个导出函数生成测试：正常路径、边界条件、错误路径。
3. 只创建 / 修改测试文件，不修改业务代码；测试暴露 bug 时报告根因。
4. 运行测试验证，未通过用例标 TODO 并说明原因。
5. 报告：生成的文件、覆盖的导出、运行结果。

推荐模型档位：heavy（pro 级推理）。
