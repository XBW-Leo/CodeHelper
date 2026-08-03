# CodeHelper 项目指令

## 项目定位

- CodeHelper 是基于 pi 框架的个人 coding agent（类 Claude Code）项目。
- 本仓库本身就是 agent 的"配置仓库"：`AGENTS.md`、`.pi/prompts/`、`.pi/skills/`、`.pi/extensions/` 共同定义 agent 的行为与自动化流程。

## 工作方式

- **先规划后实施**：复杂任务先用 `/plan` 制定分阶段计划，确认后再用 `/implement` 实施。
- **小步验证**：一次只改一个逻辑单元，改完立即运行相关校验，不批量堆积改动。
- **结论先行**：回复先给结论，再给依据；默认使用中文，代码、命令、提交信息保持英文。
- **主动报告**：任务完成后说明改动内容、验证结果与遗留事项。

## 校验命令

- `npm run validate`（`node scripts/validate.mjs`）：校验 settings、prompts、skills、extensions、model-routing 与 tsc 类型。
- 修改 prompts / skills / extensions / settings 后，必须运行 `npm run validate` 并保持全绿。

## 跨会话记忆

- 项目的重要决策、踩坑经验、用户偏好，用 `memory` 工具记录到 `.codehelper/notes.md`。
- 新会话会自动加载笔记摘要；查看全部用 `memory list`，检索用 `memory search <关键词>`。
- 记录要求：一句话一条、具体可检索，不记流水账。

## 修改 .pi 资源的规则

- **新增 prompt**：在 `.pi/prompts/<name>.md` 创建，frontmatter 必须含 `description`，可选 `argument-hint`；文件名即 slash 命令名（`/name`）。
- **新增 skill**：在 `.pi/skills/<name>/SKILL.md` 创建，遵循 [Agent Skills 标准](https://agentskills.io/specification)：frontmatter 含 `name`（小写字母/数字/连字符）和 `description`。
- **新增 extension**：在 `.pi/extensions/<name>.ts` 创建，导出默认工厂函数 `export default function (pi: ExtensionAPI)`。
- 保持每个资源小而聚焦：一个文件只做一件事；说明要具体到"何时用、怎么用"。
- 修改后同步更新 `docs/workflows.md`（如有新流程）与 `README.md`（如有新命令）。

## Git 约定

- 只暂存本次会话修改的文件：`git add <path1> <path2>`；**禁止** `git add .` 或 `git add -A`。
- 提交信息使用 Conventional Commits：`<type>[scope]: <description>`，type 取 feat / fix / docs / style / refactor / perf / test / chore。
- **禁止**破坏性命令：`git reset --hard`、`git checkout .`、`git clean -fd`、`git stash`、force push（除非用户明确要求）。
  - 例外：`git stash create` / `git stash apply` 由 git-checkpoint 扩展使用（非破坏性快照与恢复），属于安全操作。
- 新分支建议命名 `feature/<slug>` 或 `fix/<slug>`（可由用户在 settings 或 prompt 中调整）。
- 提交前运行 `npm run validate`（涉及 .pi 资源时）；涉及业务代码时运行对应项目测试。

## 文档

- 功能变更后同步更新 `docs/` 与 `README.md`。
- 完成某个开发阶段后，更新 `PLAN.md` 中的状态标记。
