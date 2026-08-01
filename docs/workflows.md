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
```

会先推送远端分支，再用 `gh pr create` 创建（已存在则 `gh pr edit` 更新）。

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

## 添加新工作流

1. 在 `.pi/prompts/` 新建 `<name>.md`，frontmatter 写 `description` 与 `argument-hint`
2. 如需可复用流程，在 `.pi/skills/` 建对应 skill
3. 在 `bin/codehelper.mjs` 的 `PROMPT_COMMANDS` 注册子命令
4. 运行 `npm run validate`，并在 `docs/workflows.md` 与 `README.md` 补充说明
