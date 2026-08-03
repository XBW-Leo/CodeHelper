# CodeHelper 项目笔记

> 跨会话记忆：由 memory 工具自动维护。项目决策、踩坑经验、用户偏好都记在这里。

## 2026-08-02
- 修改 .pi 下的 settings/prompts/skills/extensions 后必须运行 `npm run validate` 并保持全绿，否则不得提交。
- [总结 16:01] 目标：请用 write 工具修改 /tmp/summary-demo/calc.js：让 add 支持三个参数，同时保留两个参数时的行为。；改动：/tmp/summary-demo/calc.js；结果：验证通过：
- `add(1,2)` → 3（两参数行为保留）
- `add(1,2,3)` → 6（三参数新增支持）

无遗留事项。
- [总结 16:29] 目标：请为目标生成单元测试骨架：/tmp/testgen-demo/math.js

先加载并遵循 `test-generation` skill（`.pi/skills/test-generation/SKILL.md`）的流程：

1. 通读；改动：/tmp/testgen-demo/math.test.js；结果：全部通过。以下是完整报告。

---

## 测试生成报告

### 生成的文件

| 文件 | 说明 |
|------|------|
| `/tmp/testgen-demo/math.test.js` | 单元测试，使用 `node:test` + `node:assert/strict` |

### 覆盖的导出 & 用例

| 导出函数 | 正常路径 | 边界条件 | 错误路径 | 合

## 2026-08-03
- [总结 16:08] 目标：请按当前对话中已确认的计划实施。附加说明：按已确认计划实施：为 codehelper CLI 增加 --version/-V/version 参数（读取 package.json version），README 表格中 --version ；改动：/Users/wuxuebin/项目/CodeHelper/bin/codehelper.mjs, /Users/wuxuebin/项目/CodeHelper/README.md；结果：全部通过 ✅

---

## 完成报告

### 改了什么

| 文件 | 改动 |
|------|------|
| `bin/codehelper.mjs` | 新增 `showVersion()` 函数读取 `package.json` 的 `version`；在 switch 中添加 `--version`/`-V`/`version` case；在 USAGE 字符串中添加 `--v
