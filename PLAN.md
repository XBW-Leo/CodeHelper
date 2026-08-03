# CodeHelper 开发计划

## 项目愿景

基于 [pi](https://github.com/earendil-works/pi)（`@earendil-works/pi-coding-agent`）打造一个类似 Claude Code 的个人 coding agent —— **CodeHelper**。

核心理念是"配置即代码"：通过 `AGENTS.md`（项目指令）、`.pi/prompts/`（slash 命令）、`.pi/skills/`（按需加载的能力包）和 `.pi/extensions/`（事件钩子与自定义工具）把常用工程流程变成 AI 可自动执行的工作流，并用一个轻量 CLI 统一入口。

## 总体架构

```
用户 / 终端
  │
  ▼
codehelper CLI（bin/codehelper.mjs）── npm scripts
  │
  ▼
pi coding agent（引擎：会话管理、工具调用、模型接入）
  ├─ AGENTS.md / APPEND_SYSTEM.md   → 行为与工作风格
  ├─ .pi/settings.json              → 运行参数
  ├─ .pi/prompts/*.md               → /plan /review /commit ...（slash 命令）
  ├─ .pi/skills/*/SKILL.md          → 按需加载的技能
  └─ .pi/extensions/*.ts            → 事件钩子、自定义工具
  │
  ▼
底层工具（read / write / edit / bash）+ git、gh、测试等系统命令
```

## 迭代协议（怎么一步步做）

本项目采用**一次一个功能**的迭代方式，任何阶段都不批量堆功能：

1. **选功能**：从功能池按优先级顺序挑选下一个功能（默认按编号顺序，也可指定）。
2. **出方案**：我先给出该功能的 mini 计划（目标、实现方式、涉及文件、验收标准），不写代码。
3. **确认**：你确认方案后我才开始实现。
4. **实现**：只实现这一个功能，遵循 AGENTS.md 的项目约定。
5. **验证**：运行 `npm run validate` 及该功能对应的验证。
6. **验收**：你试用并确认，或提出调整意见（此时才可进入下一个功能）。
7. **收尾**：更新 PLAN.md 状态与 docs，然后进入下一个功能。

## 进度总览

| 阶段 | 内容 | 状态 |
|------|------|------|
| Phase 0 | 调研与准备 | ✅ 完成 |
| Phase 1 | 项目骨架 | ✅ 完成 |
| Phase 2 | 核心配置 | ✅ 完成 |
| Phase 3 | 自动化命令与技能 | ✅ 完成 |
| Phase 4 | 扩展增强 | ✅ 完成 |
| Phase 5 | 工作流验证与打磨 | ✅ 完成 |
| Phase 6 | 核心功能迭代（P0，Iteration 1–5） | ✅ 完成 |
| Phase 7 | 进阶功能迭代（P1，Iteration 6–12） | ✅ 完成 |
| Phase 8 | 锦上添花（P2，Iteration 13–18） | ⏳ 进行中（1/6） |
| Phase 9 | 发布与沉淀 | 待开始 |

## 当前成果

- 资源规模：14 个 prompts、8 个 skills、9 个扩展、17+ CLI 子命令
- 引擎：pi 0.83.0（项目内 devDependencies）；provider：DeepSeek（默认 `deepseek-v4-flash`，`deepseek-v4-pro` 备用）
- 代码仓库：已推送至 GitHub（XBW-Leo/CodeHelper）
- 校验：`npm run validate` 全绿（settings / prompts / skills / extensions / model-routing / tsc）
- 每项功能均做过真实动态验收（真实 bug、真实 issue、真实失败 PR）

## 阶段详情

### Phase 0 — 调研与准备

状态：✅ 已完成（2026-08-01）

- 通读 pi 的 README、quickstart、skills、prompt-templates、extensions、settings 文档
- 分析 pi 官方扩展示例（git-checkpoint、todo、confirm-destructive、hello）
- 确认本地环境：Node v24 满足要求；pi 以项目内 devDependencies 方式安装
- 产出：PLAN.md、README、package.json

### Phase 1 — 项目骨架

状态：✅ 已完成（2026-08-01）

- [x] `package.json`：bin + npm scripts + pi 相关 devDependencies
- [x] `bin/codehelper.mjs`：CLI 包装器（交互模式 / 非交互子命令）
- [x] `scripts/setup.mjs`：环境安装与体检
- [x] `scripts/validate.mjs`：.pi 资源配置校验
- [x] `.gitignore`、README、docs/ 目录

### Phase 2 — 核心配置

状态：✅ 已完成（v1）

- [x] `AGENTS.md`：项目指令（先规划后实施、小步验证、Git 约定、校验规则）
- [x] `.pi/settings.json`：thinking level、技能命令、compaction
- [x] `.pi/APPEND_SYSTEM.md`：CodeHelper 人格与工作风格
- [ ] 全局配置 `~/.pi/agent/settings.json`（可选：defaultProjectTrust、httpProxy）

### Phase 3 — 自动化命令与技能

状态：✅ 已完成（v1）

- [x] prompts（14）：`/plan` `/implement` `/review` `/commit` `/test` `/fix` `/debug` `/refactor` `/issue` `/ci-fix` `/test-gen` `/pr` `/docs` `/wrap`
- [x] skills（8）：`plan-driven-dev`、`git-workflow`、`code-review`、`debug`、`refactor`、`issue-analysis`、`ci-failure-analysis`、`test-generation`
- [x] `npm run validate` 覆盖 prompts / skills 格式校验

### Phase 4 — 扩展增强

状态：✅ 已完成（v1）

- [x] 基础（3）：`git-checkpoint`（每轮快照）、`safety-guard`（危险命令拦截）、`todo`（待办工具）
- [x] 安全（2）：`path-guard`（路径保护）、`secret-scan`（提交前密钥扫描）
- [x] 感知（1）：`repo-status`（状态注入 + 查询工具）
- [x] 记忆（2）：`memory`（跨会话记忆）、`post-session-summary`（会话后总结）
- [x] 成本（1）：`cost-tracker`（token/费用统计）

### Phase 5 — 工作流验证与打磨

状态：✅ 已完成（2026-08-03）

- [x] 5.1 `npm run validate` 全绿
- [x] 5.2 交互模式首次运行：`npm run pi` → 信任项目 → `/status` 确认 DeepSeek 登录态与默认模型（2026-08-03 用户实机验收）
- [x] 5.3 端到端演练：plan → implement → test → commit → pr 全链路真实跑通（2026-08-03，任务：`--version` 参数；产出 commit `a252757` + Draft PR #1）
- [x] 5.4 非交互子命令逐一验证（本轮演练实测 plan / implement / test / commit / pr；其余子命令已在 P0/P1 各迭代真实验收）

> 说明：端到端演练中发现两项待办——typescript 5.9.3 → 7.x 为跨 major 升级需单独评估；`/pr` 默认创建非 Draft PR，如需 Draft 需手动转换（`gh pr ready --undo`）。

### Phase 6 — 核心功能迭代（P0）

优先级逻辑：先把「干活（调试/重构）」和「安全」做好，再补「效率感知」。

状态：✅ 全部完成（5/5）

#### Iteration 1 — /debug 深度调试技能

- 类型：skill + prompt + CLI 子命令
- 目标：遇到 bug 时按「最小复现 → 定位根因 → 修复 → 回归」的标准流程工作，避免乱试
- 实现：
  - `.pi/skills/debug/SKILL.md`：调试流程、根因分析检查清单
  - `.pi/prompts/debug.md`：`/debug` 命令
  - `bin/codehelper.mjs`：注册 `debug` 子命令
  - `docs/workflows.md`：补充调试流程
- 验收：用一个小型示例 bug 演练，输出根因分析并完成修复、补回归测试
- 状态：✅ 已完成（2026-08-02，动态验收通过：真实 bug 按五步流程定位并修复）

#### Iteration 2 — /refactor 重构技能

- 类型：skill + prompt + CLI 子命令
- 目标：行为不变的重构（提取、拆分、迁移），重构前后跑同一组测试确认无回归
- 实现：`.pi/skills/refactor/SKILL.md`、`.pi/prompts/refactor.md`、CLI 子命令、docs
- 验收：对指定模块做一次真实重构并通过原有测试
- 状态：✅ 已完成（2026-08-02，动态验收通过：重复逻辑提取为公共函数，API 不变，测试 2/2 通过）

#### Iteration 3 — 安全增强：路径保护

- 类型：extension
- 目标：在 `safety-guard` 基础上，禁止 `write`/`edit` 触碰 `.env`、密钥文件、`node_modules`、生产配置
- 实现：`.pi/extensions/path-guard.ts`（或并入 safety-guard.ts）
- 验收：尝试写受保护路径被拦截并提示原因；正常路径不受影响
- 状态：✅ 已完成（2026-08-02，动态验收通过：write 与 bash 重定向写 .env 均被拦截，普通文件写入正常）

#### Iteration 4 — 安全增强：提交前密钥扫描

- 类型：extension
- 目标：提交前扫描 staged diff，检测 API key / token / 私钥泄露并阻止提交
- 实现：`.pi/extensions/secret-scan.ts`
- 验收：构造含假密钥的暂存改动，提交被拦截并指出文件位置
- 状态：✅ 已完成（2026-08-02，动态验收通过：含假密钥的暂存改动被拦截并指出位置；清洁改动正常提交）

#### Iteration 5 — 项目状态感知

- 类型：extension
- 目标：每轮 turn 开始自动注入 git 状态摘要（分支、未提交改动），并提供 `repo-status` 工具按需查询
- 实现：`.pi/extensions/repo-status.ts`
- 验收：会话中 agent 无需手动 `git status` 即可知道分支与工作区状态
- 状态：✅ 已完成（2026-08-02，动态验收通过：agent 无需执行 git 命令即答对分支与改动数；repo-status 工具返回完整状态）

### Phase 7 — 进阶功能迭代（P1）

优先级逻辑：先解决「记忆与成本」这类长期体验，再做「GitHub 集成」和「测试生成」。

状态：✅ 全部完成（7/7）

#### Iteration 6 — 跨会话记忆

- 类型：extension + skill
- 目标：项目决策与踩坑记录持久化到 `.codehelper/notes/`，新会话自动加载
- 验收：两个独立会话之间能共享一条项目决策记录
- 状态：✅ 已完成（2026-08-02，动态验收通过：会话 1 记录落盘，会话 2 无上下文直接答对）

#### Iteration 7 — 会话后总结

- 类型：extension
- 目标：每轮任务结束自动生成「做了什么 / 下一步」笔记，沉淀到 `.codehelper/notes/`
- 验收：任务结束后 notes 中出现对应记录
- 状态：✅ 已完成（2026-08-02，动态验收通过：有改动的任务自动生成总结；纯问答不产生条目）

#### Iteration 8 — 成本统计

- 类型：extension
- 目标：按会话统计 token 与费用，支持导出汇总
- 验收：一个会话结束后能看到本次费用与 token 汇总
- 状态：✅ 已完成（2026-08-02，动态验收通过：cost-stats 实时返回统计，jsonl 按 session 独立追加）

#### Iteration 9 — 多模型路由

- 类型：prompt 约定 + settings
- 目标：简单任务用小模型、复杂任务用大模型，避免浪费
- 实现：在 prompts/AGENTS.md 中标注各命令推荐的模型档位；settings 配 scoped models
- 验收：`/debug`、`/plan` 等命令有明确的模型推荐说明
- 状态：✅ 已完成（2026-08-02，动态验收通过：plan→pro、review→flash、改配置即换模型、配置缺失回退默认）

#### Iteration 10 — /issue issue 分析

- 类型：prompt + skill
- 目标：输入 GitHub issue 编号，读取并分析，转成分阶段实施计划
- 验收：对一个真实 issue 输出结构化分析与计划
- 状态：✅ 已完成（2026-08-02，动态验收通过：真实 issue 输出分类、影响面与分阶段计划，未擅自实施）

#### Iteration 11 — CI/PR 失败自动分析

- 类型：prompt + skill（基于 gh）
- 目标：PR 检查失败时自动拉取日志、定位根因、给出修复建议
- 验收：对一个失败检查输出根因与可执行的修复方案
- 状态：✅ 已完成（2026-08-02，动态验收通过：真实失败 PR 输出检查概览、根因链路与修复建议，全程只读）

#### Iteration 12 — /test-gen 测试生成

- 类型：prompt + skill
- 目标：按函数/模块自动生成单元测试骨架，遵守项目测试约定
- 验收：为指定模块生成可运行的测试骨架并通过
- 状态：✅ 已完成（2026-08-02，动态验收通过：为示例模块生成 29 个用例全部通过，风格与项目约定一致）

### Phase 8 — 锦上添花（P2，可选）

优先级逻辑：集成与体验类增强，等 P0/P1 稳定后再按需挑选。

状态：⏳ 进行中（1/6）

- [ ] Iteration 13 — **编辑器集成**：通过 pi 的 RPC/SDK 接入 VS Code 或 Neovim
- [x] Iteration 14 — **定时监控**：`auto-check` 一键跑校验/测试/依赖检查并生成报告（可接入 cron / launchd）—— ✅ 已完成（2026-08-02 验收通过）
- [ ] Iteration 15 — **联网查证**：web search / 官方文档查证 skill
- [ ] Iteration 16 — **容器化 / 沙箱**：参考 pi containerization.md 在受限环境运行
- [ ] Iteration 17 — **会话分享与知识沉淀**：优质会话导出 HTML/笔记，形成个人知识库
- [ ] Iteration 18 — **体验优化**：shell alias、自定义主题、tmux 集成

### Phase 9 — 发布与沉淀

- [ ] CHANGELOG 与版本化（0.1.0 → 0.2.0 …）
- [ ] 把稳定技能沉淀为可安装的 pi package（可选）
- [ ] 汇总使用手册与 FAQ
- [x] 引擎升级 pi 0.82.1 → 0.83.0（升级后需回归全部扩展）—— ✅ 已完成（2026-08-03，validate 全绿、9/9 扩展 jiti 加载、真实 DeepSeek 冒烟通过；typebox 对齐 1.3.7）

## 后续优化项（Review 遗留）

- [x] 扩展 TS 类型校验：`tsc --noEmit` 加入 `npm run validate`（typescript 5.9.3 devDependency）—— ✅ 已完成（2026-08-03）
- [x] prompt 档位标注移入 frontmatter（`model-tier: heavy/light`），减少系统提示噪音 —— ✅ 已完成（2026-08-03）
- [x] notes 追加逻辑抽取公共模块（`.pi/extensions/lib/notes.ts`），统一 memory 与 post-session-summary 的日期处理（Asia/Shanghai）—— ✅ 已完成（2026-08-03）
- [x] 统一 settings `enabledModels` 与 model-routing 的模型 ID 书写格式（provider 前缀）—— ✅ 已完成（2026-08-03）

## 完成标准（Definition of Done）

1. `npm run validate` 全绿
2. 交互模式：`codehelper` 可直接对话并加载全部 .pi 资源
3. 非交互模式：`codehelper <cmd> "任务"` 可执行对应工作流
4. 扩展运行无报错，危险命令有拦截确认
5. 每个功能迭代都有独立验收记录（PLAN.md 状态 + docs 说明）
