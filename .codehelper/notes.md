# CodeHelper 项目笔记

> 跨会话记忆：由 memory 工具自动维护。项目决策、踩坑经验、用户偏好都记在这里。

## 2026-08-02
- 修改 .pi 下的 settings/prompts/skills/extensions 后必须运行 `npm run validate` 并保持全绿，否则不得提交。
- [总结 16:01] 目标：用 write 工具修改 /tmp/summary-demo/calc.js 支持三参数；改动：/tmp/summary-demo/calc.js；结果：验证通过（两参数行为保留、三参数新增支持）
- [总结 16:29] 目标：为 /tmp/testgen-demo/math.js 生成单元测试骨架；改动：/tmp/testgen-demo/math.test.js；结果：全部通过 ✅

## 2026-08-03
- [总结 16:08] 目标：为 codehelper CLI 增加 --version/-V/version 参数并更新 README；改动：bin/codehelper.mjs, README.md；结果：全部通过 ✅
