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

## 阶段计划

### Phase 0 — 调研与准备

状态：已完成（2026-08-01）

- 通读 pi 的 README、quickstart、skills、prompt-templates、extensions、settings 文档
- 分析 pi 官方扩展示例（git-checkpoint、todo、confirm-destructive、hello）
- 确认本地环境：Node v24 满足要求；pi 未全局安装 → 采用项目内 devDependencies 方式
- 产出：PLAN.md、README、package.json

### Phase 1 — 项目骨架

状态：已完成（2026-08-01）

- [x] `package.json`：bin + npm scripts + pi 相关 devDependencies
- [x] `bin/codehelper.mjs`：CLI 包装器（交互模式 / 非交互子命令）
- [x] `scripts/setup.mjs`：环境安装与体检
- [x] `scripts/validate.mjs`：.pi 资源配置校验
- [x] `.gitignore`、README、docs/ 目录

### Phase 2 — 核心配置

状态：已完成（v1）

- [x] `AGENTS.md`：项目指令（先规划后实施、小步验证、Git 约定、校验规则）
- [x] `.pi/settings.json`：thinking level、技能命令、compaction
- [x] `.pi/APPEND_SYSTEM.md`：CodeHelper 人格与工作风格
- [ ] 全局配置 `~/.pi/agent/settings.json`（可选：defaultProjectTrust、httpProxy）

### Phase 3 — 自动化命令与技能

状态：已完成（v1）

- [x] prompts：`/plan` `/implement` `/review` `/commit` `/test` `/fix` `/pr` `/docs` `/wrap`
- [x] skills：`plan-driven-dev`、`git-workflow`、`code-review`
- [x] `npm run validate` 覆盖 prompts / skills 格式校验
- [ ] 更多技能：release（版本发布）、refactor、docs-sync（按需补充）

### Phase 4 — 扩展增强

状态：已完成（v1）

- [x] `extensions/git-checkpoint.ts`：每轮 turn 创建 git stash checkpoint，fork 时可恢复代码状态
- [x] `extensions/safety-guard.ts`：拦截危险 bash 命令（rm -rf、git reset --hard、force push 等）
- [x] `extensions/todo.ts`：`todo` 工具 + `/todos` 命令
- [ ] 更多扩展：permission gate、路径保护、自定义系统提示注入（按需补充）

### Phase 5 — 工作流验证与打磨

状态：进行中

- [x] `npm run validate` 通过（配置、prompts、skills 全绿）
- [ ] 交互模式首次运行：信任项目、`/login` 配置模型提供商
- [ ] 端到端演练：plan → implement → test → commit → pr
- [ ] 非交互子命令逐一验证（`codehelper plan/review/commit ...`）

### Phase 6 — 发布与迭代

状态：待开始

- [ ] 沉淀常用场景为更多 skill（release、refactor、技术调研）
- [ ] 容器化 / 沙箱方案（参考 pi 的 containerization.md 三种模式）
- [ ] shell alias、主题、tmux 集成
- [ ] 版本化与 CHANGELOG

## 完成标准（Definition of Done）

1. `npm run validate` 全绿
2. 交互模式：`codehelper` 可直接对话并加载全部 .pi 资源
3. 非交互模式：`codehelper <cmd> "任务"` 可执行对应工作流
4. 扩展运行无报错，危险命令有拦截确认

