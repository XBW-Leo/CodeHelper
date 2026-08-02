# CodeHelper

> 基于 [pi](https://github.com/earendil-works/pi) 引擎的个人 AI Coding Agent —— 像 Claude Code 一样对话驱动开发，但行为完全由你自己的仓库定义。

CodeHelper 不重新造一个 agent 框架，而是把 pi（`@earendil-works/pi-coding-agent`）当作引擎，用「配置即代码」的方式定制出一个专属 coding agent：把常用工程流程固化成 slash 命令、技能包与自动化扩展，并用一个轻量 CLI 统一交互模式与非交互自动化入口。

一句话定位：**把「AI 怎么写代码」这件事，变成一份可 review、可版本化、可迁移的仓库配置。**

## 目录

- [设计理念](#设计理念)
- [核心能力](#核心能力)
- [快速开始](#快速开始)
- [模型与供应商配置](#模型与供应商配置)
- [CLI 用法](#cli-用法)
- [Slash 命令](#slash-命令)
- [技能包 Skills](#技能包-skills)
- [扩展 Extensions](#扩展-extensions)
- [安全机制](#安全机制)
- [目录结构](#目录结构)
- [开发路线图](#开发路线图)
- [质量与验收](#质量与验收)
- [常见问题 FAQ](#常见问题-faq)
- [与 pi 的关系](#与-pi-的关系)

## 设计理念

CodeHelper 的核心决策是**分层定制**，每层回答一个问题：

| 层 | 内容 | 回答的问题 |
|----|------|-----------|
| 行为层 | `AGENTS.md`、`.pi/APPEND_SYSTEM.md`、`.pi/settings.json` | Agent 应该怎么做事？ |
| 自动化层 | `.pi/prompts/*.md`（slash 命令）、`.pi/skills/*/SKILL.md` | 常见流程怎么一键执行？ |
| 增强层 | `.pi/extensions/*.ts`（事件钩子 + 自定义工具） | 引擎缺什么能力？ |
| 接入层 | `bin/codehelper.mjs`、`scripts/`、npm scripts | 怎么用起来？ |

```
┌─────────────────────────────────────────────────────────┐
│ 用户入口                                                  │
│   codehelper CLI（交互 / 非交互）  npm scripts             │
├─────────────────────────────────────────────────────────┤
│ pi 引擎                                                   │
│   会话管理 · 工具调用循环 · 多供应商模型接入                 │
├─────────────────────────────────────────────────────────┤
│ 行为层   AGENTS.md · APPEND_SYSTEM.md · settings.json     │
│ 自动化层 prompts（14）· skills（8）                       │
│ 增强层   extensions（9）：记忆/成本/安全/感知/总结           │
├─────────────────────────────────────────────────────────┤
│ 支撑     scripts/setup|validate|auto-check · model-routing│
└─────────────────────────────────────────────────────────┘
```

这样设计的好处：引擎升级零成本（改依赖版本即可）、行为完全可审计（所有定制都在本仓库，diff 可见）、任何一层都可以单独替换。

## 核心能力

- **计划驱动开发**：`/plan` → `/implement` → `/test` → `/commit` 的标准闭环，复杂任务先规划、确认后再动手
- **深度调试**：复现 → 最小化 → 根因分析 → 修复 → 回归测试的系统化调试流程
- **行为不变重构**：先建测试基线，再小步重构，全程回归验证
- **GitHub 集成**：issue 分析、CI/PR 失败定位、PR 创建/更新（基于 `gh`）
- **测试生成**：按函数/模块生成覆盖正常/边界/错误路径的测试骨架并运行验证
- **安全护栏**：危险命令拦截、受保护路径守卫、提交前密钥扫描（详见[安全机制](#安全机制)）
- **跨会话记忆**：项目决策与踩坑记录持久化到 `.codehelper/notes.md`，新会话自动加载
- **成本透明**：按会话累计 token 与费用，`/cost` 命令与 `cost-stats` 工具实时查询
- **多模型路由**：按任务类型自动选择 heavy/light 档模型，配置驱动、供应商无关
- **定时监控**：`auto-check` 一键跑配置校验/测试/依赖检查，生成报告，可接入 cron / launchd

资源规模：**14 个 prompts、8 个 skills、9 个 extensions、17 个 CLI 子命令**。

## 快速开始

环境要求：Node.js ≥ 22.19.0、npm；使用 `issue` / `ci-fix` / `pr` 需要 [GitHub CLI](https://cli.github.com/)（`gh auth login`）。

```bash
npm install          # 安装 pi 引擎与依赖
npm run setup        # 环境体检（可选）
npm run pi           # 进入交互模式
```

也可以在项目内直接使用本地安装的 pi：

```bash
npx pi
```

首次交互运行会询问是否信任本项目；确认后才会加载 `.pi/` 下的 prompts、skills 和 extensions。

### 配置模型提供商（二选一）

- 在 pi 内执行 `/login`，选择订阅登录或 API key 登录
- 或设置环境变量（取决于供应商），例如 `export DEEPSEEK_API_KEY=sk-...`

本项目默认使用 DeepSeek：`deepseek-v4-flash`（轻量任务）/ `deepseek-v4-pro`（复杂任务）。API key 保存在 pi 全局凭据目录 `~/.pi/agent/auth.json`（权限 600，**不在仓库内**）。

## 模型与供应商配置

模型路由由 [.codehelper/model-routing.json](.codehelper/model-routing.json) 驱动，格式为 `provider/model`，与具体供应商解耦：

```json
{
  "heavy": "deepseek/deepseek-v4-pro",
  "light": "deepseek/deepseek-v4-flash",
  "commands": { "plan": "heavy", "review": "light", ... }
}
```

当前档位分配：

| 档位 | 命令 | 场景 |
|------|------|------|
| `heavy` | plan、implement、debug、refactor、fix、issue、ci-fix、test-gen、wrap | 需要推理深度的复杂任务 |
| `light` | review、commit、test、docs、pr | 轻量任务，省 token 与延迟 |

切换到其他供应商（如 Anthropic / OpenAI / Google）：

1. 修改 `heavy` / `light` 为 `anthropic/claude-...`、`openai/gpt-...`、`google/gemini-...` 等（具体模型 ID 可在 pi 内用 `/model` 查看）
2. 配置对应 API key（环境变量或 pi 内 `/login`）
3. 非交互命令会自动按档位附加 `--model`；交互模式用 Ctrl+P 在 `enabledModels` 之间循环切换

若某个供应商暂时不可用，仅需修改这一份配置，代码与流程无需任何改动——这是「供应商无关」路由的意义。

### `.codehelper/` 目录策略

| 文件 | 是否入库 | 说明 |
|------|---------|------|
| `model-routing.json` | ✅ | 模型路由配置，随版本追踪 |
| `notes.md` | ✅ | 跨会话记忆（决策、踩坑、偏好） |
| `costs.jsonl` | ❌（gitignore） | 运行时成本流水 |
| `reports/` | ❌（gitignore） | 自动检查报告 |

## CLI 用法

`node bin/codehelper.mjs` 或 `npm run ch -- <cmd>`。子命令如下：

| 命令 | 说明 |
|------|------|
| （无参数） | 进入交互模式 |
| `plan "<任务>"` | 制定分阶段计划，不写代码 |
| `implement "<说明>"` | 按计划实施并验证 |
| `review [范围]` | 结构化代码审查（默认审查未提交改动，只审查不修改） |
| `commit [message]` | 规范化提交（Conventional Commits） |
| `test [命令]` | 运行测试/校验并修复失败 |
| `fix "<问题>"` | 定位并修复 bug |
| `debug "<问题>"` | 深度调试：复现 → 根因 → 修复 → 回归 |
| `refactor "<范围>"` | 行为不变重构：基线 → 方案 → 小步实施 → 回归 |
| `issue "<编号/URL>"` | 分析 GitHub issue 并输出分阶段实施计划 |
| `ci-fix "<PR>"` | 分析 CI/PR 检查失败：拉日志、定位根因、给修复建议 |
| `test-gen "<目标>"` | 为函数/模块生成单元测试骨架并运行验证 |
| `auto-check` | 运行配置校验/测试/依赖检查，生成报告 |
| `pr [title]` | 创建/更新 Pull Request |
| `docs [主题]` | 更新项目文档 |
| `wrap "<说明>"` | 端到端完成当前任务：实现、验证、规范化提交 |
| `setup` | 环境安装与体检 |
| `check` | 配置校验（等价于 `npm run validate`） |

非交互子命令自动携带 `--approve` 以加载项目级 .pi 资源；如需禁用可追加 `--no-approve`。用户显式传入 `--model` 时不会被路由覆盖。

### 定时自动检查

```bash
npm run ch -- auto-check   # 手动跑一次，报告生成到 .codehelper/reports/YYYY-MM-DD.md
```

失败时退出码为 1，可用于告警。macOS 用 launchd、Linux 用 cron 接入：

**macOS（launchd）**：新建 `~/Library/LaunchAgents/com.codehelper.auto-check.plist`：

```xml
<plist version="1.0">
  <dict>
    <key>Label</key><string>com.codehelper.auto-check</string>
    <key>ProgramArguments</key>
    <array>
      <string>/usr/bin/env</string>
      <string>node</string>
      <string>/Users/wuxuebin/CodeHelper/scripts/auto-check.mjs</string>
    </array>
    <key>StartCalendarInterval</key>
    <dict><key>Hour</key><integer>9</integer><key>Minute</key><integer>0</integer></dict>
  </dict>
</plist>
```

```bash
launchctl load ~/Library/LaunchAgents/com.codehelper.auto-check.plist
```

**Linux（cron）**：

```bash
0 9 * * * cd /Users/wuxuebin/CodeHelper && /usr/bin/env node scripts/auto-check.mjs
```

## Slash 命令

交互模式中输入 `/命令 参数` 即可展开对应工作流模板（14 个），与 CLI 子命令一一对应：

| 命令 | 说明 |
|------|------|
| `/plan` | 制定分阶段实施计划，先规划再动手 |
| `/implement` | 按已有计划实施，边实现边验证 |
| `/review` | 对改动或指定代码做结构化审查，只审查不修改 |
| `/commit` | 规范化提交当前改动 |
| `/test` | 运行测试/校验并修复失败 |
| `/fix` | 定位并修复 bug |
| `/debug` | 深度调试：复现 → 最小化 → 根因 → 修复 → 回归 |
| `/refactor` | 行为不变重构：基线测试 → 方案 → 小步实施 → 回归 |
| `/issue` | 分析 GitHub issue 并输出分阶段实施计划 |
| `/ci-fix` | 分析 CI/PR 检查失败并给出修复建议 |
| `/test-gen` | 生成单元测试骨架并运行验证 |
| `/pr` | 创建/更新 Pull Request |
| `/docs` | 更新项目文档 |
| `/wrap` | 端到端完成当前任务（实现、验证、提交） |

另有扩展注册的命令：`/cost`（成本统计）、`/todos`（待办查看）。

## 技能包 Skills

系统提示只放技能名称与描述，任务匹配时才加载完整 `SKILL.md`（渐进式披露，节省上下文）。8 个技能：

| 技能 | 触发场景 |
|------|---------|
| `plan-driven-dev` | 多文件/多模块改动、存在多种方案、要求「先规划再实现」 |
| `git-workflow` | 提交、分支、状态查看、合并等 Git 操作 |
| `code-review` | 审查改动、PR 或指定代码 |
| `debug` | 报告 bug、测试失败、行为异常，需要系统性定位 |
| `refactor` | 提取函数/组件、拆分模块、重命名、简化重复代码 |
| `issue-analysis` | 提供 issue 编号或 URL 要求分析 |
| `ci-failure-analysis` | 提供 PR 或 commit 要求分析 CI 失败 |
| `test-generation` | 为函数或模块补充测试 |

## 扩展 Extensions

9 个扩展通过事件钩子与自定义工具补足引擎能力：

| 扩展 | 类型 | 作用 |
|------|------|------|
| `git-checkpoint` | 事件钩子 | 每轮 turn 开始创建 git checkpoint，`/fork` 可恢复当时状态 |
| `safety-guard` | 事件钩子 | 拦截高风险 bash 命令（rm -rf、git reset --hard、force push、sudo 等） |
| `path-guard` | 事件钩子 | 禁止 write/edit 触碰 `.env`、密钥、node_modules、生产配置 |
| `secret-scan` | 事件钩子 | 提交前扫描 staged diff 的密钥/token/私钥，发现即阻止 |
| `repo-status` | 注入 + 工具 | 每轮自动注入分支与工作区状态，`repo-status` 工具按需查询 |
| `memory` | 工具 | 跨会话记忆：决策、踩坑、偏好持久化到 `.codehelper/notes.md` |
| `post-session-summary` | 事件钩子 | 有实际改动的任务结束后自动沉淀「目标 / 改动 / 结果」 |
| `cost-tracker` | 命令 + 工具 | `/cost` 命令与 `cost-stats` 工具实时统计 token 与费用 |
| `todo` | 命令 + 工具 | `todo` 工具跟踪多步任务，`/todos` 查看当前待办 |

## 安全机制

CodeHelper 在三个层面设置安全护栏，交互模式弹窗确认、非交互模式直接拒绝：

1. **命令层**：拦截 `rm -rf`、`git reset --hard`、`git checkout .`、`git clean`、force push、`sudo` 等高风险操作
2. **路径层**：禁止写 `.env`、密钥文件、`node_modules`、生产配置；对 bash 中的重定向写入、`tee`、`rm` 目标也做拦截
3. **提交层**：commit 前扫描 staged diff，检测 API key / token / 私钥泄露，发现即阻止提交并指出文件位置

## 目录结构

```
CodeHelper/
├── AGENTS.md                 # pi 加载的项目指令（工作流约定）
├── PLAN.md                   # 分阶段开发计划与验收记录
├── bin/codehelper.mjs        # CLI 包装器
├── scripts/
│   ├── setup.mjs             # 安装与体检
│   ├── validate.mjs          # .pi 资源配置校验
│   └── auto-check.mjs        # 定时自动检查（生成报告）
├── .codehelper/
│   ├── model-routing.json    # 多模型路由配置（入库）
│   ├── notes.md              # 跨会话记忆（入库）
│   ├── costs.jsonl           # 成本流水（gitignore）
│   └── reports/              # 自动检查报告（gitignore）
├── .pi/
│   ├── settings.json         # 项目级设置
│   ├── APPEND_SYSTEM.md      # 追加系统提示（人格与风格）
│   ├── prompts/              # slash 命令（14 个）
│   ├── skills/               # 按需加载的技能（8 个）
│   └── extensions/           # 事件钩子与自定义工具（9 个）
└── docs/
    ├── architecture.md       # 架构说明
    └── workflows.md          # 自动化工作流说明
```

## 开发路线图

| 阶段 | 内容 | 状态 |
|------|------|------|
| Phase 0–4 | 调研、骨架、核心配置、命令与技能、扩展 | ✅ 完成 |
| Phase 6 | 核心功能迭代（P0：调试/重构/安全/状态感知，5/5） | ✅ 完成 |
| Phase 7 | 进阶功能迭代（P1：记忆/成本/路由/issue/CI/测试生成，7/7） | ✅ 完成 |
| Phase 8 | 锦上添花（P2：定时监控已完成，1/6） | ⏳ 进行中 |
| Phase 5 | 工作流验证与打磨（交互首启、端到端演练） | ⏳ 进行中 |
| Phase 9 | 发布与沉淀（CHANGELOG、版本化、技能打包、手册） | 待开始 |

待办（P2 剩余 + 质量加固）：编辑器集成（VS Code/Neovim）、联网查证、容器化/沙箱、会话分享与知识库、体验优化（alias/主题/tmux）、`tsc --noEmit` 类型校验、prompt 档位标注迁移 frontmatter、notes 逻辑统一。详见 [PLAN.md](PLAN.md)。

## 质量与验收

每个功能的完成标准（Definition of Done）：

1. `npm run validate` 全绿（settings / prompts / skills / extensions / model-routing）
2. 交互模式：`codehelper` 可直接对话并加载全部 .pi 资源
3. 非交互模式：`codehelper <cmd> "任务"` 可执行对应工作流
4. 扩展运行无报错，危险命令有拦截确认
5. 每个功能迭代都有独立验收记录（PLAN.md 状态 + docs 说明）

已交付功能均做过**真实动态验收**：真实 bug 调试、真实 GitHub issue 分析、真实失败 PR 的 CI 定位、真实提交流程与密钥扫描拦截。

## 常见问题 FAQ

**Q：如何切换默认模型？**
修改 `.pi/settings.json` 的 `defaultProvider` / `defaultModel`；复杂/简单任务的分档见 [.codehelper/model-routing.json](.codehelper/model-routing.json)。

**Q：如何接入非 DeepSeek 供应商？**
改 `model-routing.json` 的 `heavy` / `light` 为 `provider/model` 格式，配置对应 API key 即可，代码与流程无需改动。

**Q：API key 存在哪里？**
pi 全局凭据目录 `~/.pi/agent/auth.json`（权限 600），不在仓库内；`.codehelper/costs.jsonl` 与 `reports/` 也已 gitignore。

**Q：如何自定义一个 slash 命令？**
在 `.pi/prompts/<name>.md` 新建文件，frontmatter 写 `description`，文件名即命令名；CLI 侧在 `bin/codehelper.mjs` 的 `PROMPT_COMMANDS` 注册即可。

**Q：如何查看本次会话花费？**
交互模式输入 `/cost`；agent 可用 `cost-stats` 工具；历史流水在 `.codehelper/costs.jsonl`。

## 与 pi 的关系

CodeHelper 不修改 pi 源码，而是以 pi 为引擎，通过项目内配置（AGENTS.md、prompts、skills、extensions、settings）定制行为。pi 的完整文档见 [pi.dev/docs](https://pi.dev/docs/latest)。

## 文档

- [PLAN.md](PLAN.md)：分阶段开发计划与验收记录
- [docs/architecture.md](docs/architecture.md)：架构说明
- [docs/workflows.md](docs/workflows.md)：自动化工作流说明

仓库：[github.com/XBW-Leo/CodeHelper](https://github.com/XBW-Leo/CodeHelper)
