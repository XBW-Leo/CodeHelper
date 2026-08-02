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
| Phase 5 | 工作流验证与打磨 | ⏳ 进行中 |
| Phase 6 | 核心功能迭代（P0） | 待开始 |
| Phase 7 | 进阶功能迭代（P1） | 待开始 |
| Phase 8 | 锦上添花（P2） | 待开始 |
| Phase 9 | 发布与沉淀 | 待开始 |

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

- [x] prompts：`/plan` `/implement` `/review` `/commit` `/test` `/fix` `/pr` `/docs` `/wrap`
- [x] skills：`plan-driven-dev`、`git-workflow`、`code-review`
- [x] `npm run validate` 覆盖 prompts / skills 格式校验

### Phase 4 — 扩展增强

状态：✅ 已完成（v1）

- [x] `extensions/git-checkpoint.ts`：每轮 turn 创建 git stash checkpoint，fork 时可恢复代码状态
- [x] `extensions/safety-guard.ts`：拦截危险 bash 命令（rm -rf、git reset --hard、force push 等）
- [x] `extensions/todo.ts`：`todo` 工具 + `/todos` 命令

### Phase 5 — 工作流验证与打磨

状态：⏳ 进行中

- [x] 5.1 `npm run validate` 全绿
- [ ] 5.2 交互模式首次运行：`npm run pi` → 信任项目（provider 已配置：DeepSeek / deepseek-v4-flash，密钥存于 `~/.pi/agent/auth.json`，剩余信任与首次体验待你操作）
- [ ] 5.3 端到端演练：plan → implement → test → commit → pr
- [ ] 5.4 非交互子命令逐一验证

> 说明：5.2 需要你配置模型提供商才能继续；如果想先推进纯代码类功能，也可以先做 Phase 6，之后再回来补验证。

### Phase 6 — 核心功能迭代（P0）

优先级逻辑：先把「干活（调试/重构）」和「安全」做好，再补「效率感知」。

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

#### Iteration 6 — 跨会话记忆

- 类型：extension + skill
- 目标：项目决策与踩坑记录持久化到 `.codehelper/notes/`，新会话自动加载
- 验收：两个独立会话之间能共享一条项目决策记录
- 状态：⏳ 待开始

#### Iteration 7 — 会话后总结

- 类型：extension
- 目标：每轮任务结束自动生成「做了什么 / 下一步」笔记，沉淀到 `.codehelper/notes/`
- 验收：任务结束后 notes 中出现对应记录
- 状态：⏳ 待开始

#### Iteration 8 — 成本统计

- 类型：extension
- 目标：按会话统计 token 与费用，支持导出汇总
- 验收：一个会话结束后能看到本次费用与 token 汇总
- 状态：⏳ 待开始

#### Iteration 9 — 多模型路由

- 类型：prompt 约定 + settings
- 目标：简单任务用小模型、复杂任务用大模型，避免浪费
- 实现：在 prompts/AGENTS.md 中标注各命令推荐的模型档位；settings 配 scoped models
- 验收：`/debug`、`/plan` 等命令有明确的模型推荐说明
- 状态：⏳ 待开始

#### Iteration 10 — /issue issue 分析

- 类型：prompt + skill
- 目标：输入 GitHub issue 编号，读取并分析，转成分阶段实施计划
- 验收：对一个真实 issue 输出结构化分析与计划
- 状态：⏳ 待开始

#### Iteration 11 — CI/PR 失败自动分析

- 类型：prompt + skill（基于 gh）
- 目标：PR 检查失败时自动拉取日志、定位根因、给出修复建议
- 验收：对一个失败检查输出根因与可执行的修复方案
- 状态：⏳ 待开始

#### Iteration 12 — /test-gen 测试生成

- 类型：prompt + skill
- 目标：按函数/模块自动生成单元测试骨架，遵守项目测试约定
- 验收：为指定模块生成可运行的测试骨架并通过
- 状态：⏳ 待开始

### Phase 8 — 锦上添花（P2，可选）

优先级逻辑：集成与体验类增强，等 P0/P1 稳定后再按需挑选。

- [ ] Iteration 13 — **编辑器集成**：通过 pi 的 RPC/SDK 接入 VS Code 或 Neovim
- [ ] Iteration 14 — **定时监控**：定时跑测试/依赖检查并生成报告
- [ ] Iteration 15 — **联网查证**：web search / 官方文档查证 skill
- [ ] Iteration 16 — **容器化 / 沙箱**：参考 pi containerization.md 在受限环境运行
- [ ] Iteration 17 — **会话分享与知识沉淀**：优质会话导出 HTML/笔记，形成个人知识库
- [ ] Iteration 18 — **体验优化**：shell alias、自定义主题、tmux 集成

### Phase 9 — 发布与沉淀

- [ ] CHANGELOG 与版本化（0.1.0 → 0.2.0 …）
- [ ] 把稳定技能沉淀为可安装的 pi package（可选）
- [ ] 汇总使用手册与 FAQ

## 完成标准（Definition of Done）

1. `npm run validate` 全绿
2. 交互模式：`codehelper` 可直接对话并加载全部 .pi 资源
3. 非交互模式：`codehelper <cmd> "任务"` 可执行对应工作流
4. 扩展运行无报错，危险命令有拦截确认
5. 每个功能迭代都有独立验收记录（PLAN.md 状态 + docs 说明）
