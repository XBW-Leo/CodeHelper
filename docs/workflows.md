# CodeHelper 工作流说明

所有工作流都可以在交互模式（`npm run pi` + slash 命令）或非交互模式（`codehelper <cmd> "..."`）下执行。

## 1. 计划驱动开发（推荐主流程）

适合多文件、多模块或影响面较大的任务。

```bash
codehelper plan "实现一个 xxx 功能"
# → 阅读输出，确认或调整计划
codehelper implement "按计划实施阶段 1-2"
# → 小步实现并验证
codehelper test
# → 跑测试、修复失败
codehelper commit
# → 规范化提交
```

交互模式下等价于：`/plan` → `/implement` → `/test` → `/commit`。

对应技能：[plan-driven-dev](../.pi/skills/plan-driven-dev/SKILL.md)

## 2. 代码审查

```bash
codehelper review                    # 审查未提交改动
codehelper review "src/core"         # 审查指定目录
codehelper review "HEAD~3..HEAD"     # 审查某段提交历史
```

对应技能：[code-review](../.pi/skills/code-review/SKILL.md)

## 3. Bug 修复

```bash
codehelper fix "列表页在移动端点击无响应"
```

流程：复现/定位根因 → 陈述根因 → 最小修复 → 补测试 → 验证。

## 4. 规范化提交

```bash
codehelper commit                    # 自动生成提交信息
codehelper commit "fix: 修复登录超时问题"
```

规则：只暂存本次任务相关文件、Conventional Commits 格式、提交前运行校验。详见 [git-workflow](../.pi/skills/git-workflow/SKILL.md)。

## 5. 发布 PR

```bash
codehelper pr                        # 自动生成标题与描述
codehelper pr "feat: 新增用户导出"
codehelper pr "feat: 新增用户导出" --draft   # 创建草稿 PR
```

会先推送远端分支，再用 `gh pr create` 创建（参数含 `--draft` 时创建草稿 PR；PR 已存在则 `gh pr edit` 更新）。

## 6. 端到端收尾

```bash
codehelper wrap "完成当前对话中的任务"
```

按 `/wrap` 流程执行：确认目标 → 规划 → 实施 → 校验 → 文档 → 提交 →（可选）关闭关联 issue。

## 7. 文档同步

```bash
codehelper docs "更新 README 的使用说明"
```

只更新与当前改动相关的文档，保证命令、路径、示例可真实运行。

## 8. 深度调试（Iteration 1）

适合"问题存在但原因不明"的场景，避免猜测式修改。

```bash
codehelper debug "列表页在移动端点击无响应"
```

流程：复现 → 最小化 → 定位根因 → 最小修复 → 补回归测试。要求一次只验证一个假设，修复前必须能说清根因；完成后按「复现条件 / 根因 / 修复方式 / 验证结果 / 遗留事项」报告。

对应技能：[debug](../.pi/skills/debug/SKILL.md)

## 9. 行为不变重构（Iteration 2）

适合"想整理代码但怕改坏"的场景。

```bash
codehelper refactor "提取 src/utils.js 中重复的价格计算逻辑"
```

流程：理解现状 → 建立测试基线 → 输出方案（默认停在方案阶段等确认，指令里加"直接做"才继续）→ 小步实施 → 回归验证。要求行为不变、不改对外接口、不顺手加功能；实施前用 git 记录状态。

对应技能：[refactor](../.pi/skills/refactor/SKILL.md)

## 10. Issue 分析（Iteration 10）

把 GitHub issue 转成可执行的分阶段计划。

```bash
codehelper issue "7350"                                # issue 编号
codehelper issue "https://github.com/owner/repo/issues/7350"  # 或完整 URL
```

流程：`gh issue view` 读取 issue 全文（含评论与 labels）→ 分类（bug / feature / 提问 / 其他）→ 结合仓库现状做只读影响面分析 → 输出「问题本质 / 影响面 / 分阶段实施计划（目标、步骤、涉及文件、验收标准）」。默认停在计划阶段，确认后再用 `/implement` 实施。

对应技能：[issue-analysis](../.pi/skills/issue-analysis/SKILL.md)

## 11. CI/PR 失败分析（Iteration 11）

PR 检查失败时自动定位根因并给出修复建议。

```bash
codehelper ci-fix "7350"      # PR 编号或 URL
```

流程：用 `gh` 定位 PR 与 head commit → 列出全部 check-runs 及结论 → 对失败检查拉取 annotations 与 job 日志 → 本地只读复现确认根因 → 输出「失败项 / 根因 / 涉及文件 / 修复建议」，停在建议阶段。

规则：只读分析，不修改 PR、不 push、不 checkout 他人分支。

对应技能：[ci-failure-analysis](../.pi/skills/ci-failure-analysis/SKILL.md)

## 12. 测试生成（Iteration 12）

为函数/模块生成单元测试骨架并运行验证。

```bash
codehelper test-gen "src/utils/math.js"
```

流程：通读目标代码与依赖，确认测试框架与项目风格 → 为每个导出生成正常路径 / 边界条件 / 错误路径用例 → 只创建或修改测试文件，不改业务代码 → 运行验证，未通过用例标 TODO 并说明原因。

对应技能：[test-generation](../.pi/skills/test-generation/SKILL.md)

## 13. 定时自动检查（Iteration 14）

一键运行配置校验、项目测试与依赖检查，生成结构化报告。

```bash
codehelper auto-check    # 报告生成到 .codehelper/reports/YYYY-MM-DD.md
```

依次执行：配置校验（`npm run validate`，含 tsc）→ 项目测试（存在 `test` 脚本时）→ 依赖过期检查（警告级）→ 依赖安全审计（警告级）。存在失败时退出码为 1，可接入 cron / launchd 做定时告警（配置示例见 README「定时自动检查」）。

## 添加新工作流

1. 在 `.pi/prompts/` 新建 `<name>.md`，frontmatter 写 `description` 与 `argument-hint`
2. 如需可复用流程，在 `.pi/skills/` 建对应 skill
3. 在 `bin/codehelper.mjs` 的 `PROMPT_COMMANDS` 注册子命令
4. 运行 `npm run validate`，并在 `docs/workflows.md` 与 `README.md` 补充说明
