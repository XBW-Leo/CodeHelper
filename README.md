# CodeHelper

基于 [pi](https://github.com/earendil-works/pi) 框架的个人 coding agent（类 Claude Code），把常用工程流程变成 AI 可自动执行的工作流。

## 特性

- 计划驱动的开发流程：`/plan` → `/implement` → `/test` → `/commit`
- 常用 slash 命令：代码审查、深度调试、行为不变重构、Bug 修复、PR、文档更新、端到端收尾
- 按需加载的 skills（[Agent Skills 标准](https://agentskills.io/specification)）
- 安全扩展：危险命令拦截、受保护路径守卫（.env / 密钥 / node_modules）、提交前密钥扫描、git checkpoint、todo 管理
- 项目状态感知：每轮对话自动注入分支与工作区状态，提供 `repo-status` 工具按需查询
- 跨会话记忆：项目决策与踩坑记录自动持久化（`.codehelper/notes.md`），新会话自动加载
- 会话后总结：每轮有实际改动的任务结束，自动沉淀「目标 / 改动 / 结果」到记忆
- 成本统计：按会话累计 token 与费用（`/cost` 命令、`cost-stats` 工具、`.codehelper/costs.jsonl` 历史）
- 多模型路由：按任务类型自动选择 heavy/light 档模型（配置驱动、供应商无关）
- 定时监控：`auto-check` 一键跑校验/测试/依赖检查，生成报告，可接入 cron / launchd
- 轻量 CLI：`codehelper plan "..."`、`codehelper review` 等非交互自动化入口

## 快速开始

```bash
npm install          # 安装 pi 引擎与扩展依赖
npm run setup        # 环境体检（可选）
npm run pi           # 进入交互模式
```

也可以在项目内直接使用本地安装的 pi：

```bash
npx pi
```

首次交互运行会询问是否信任本项目；确认后才会加载 `.pi/` 下的 prompts、skills 和 extensions。

配置模型提供商（二选一）：

- 在 pi 内执行 `/login`，选择订阅登录或 API key 登录
- 或设置环境变量，例如 `export ANTHROPIC_API_KEY=sk-ant-...`

本项目默认使用 DeepSeek（`deepseek-v4-flash`），API key 已存于 pi 全局凭据目录 `~/.pi/agent/auth.json`（不在仓库内）。如需切换模型或提供商，修改 `.pi/settings.json` 中的 `defaultProvider` / `defaultModel`（可用 `deepseek-v4-pro` 处理复杂任务）。

### 切换模型供应商

多模型路由由 [.codehelper/model-routing.json](.codehelper/model-routing.json) 驱动，与具体供应商解耦：

1. 修改 `heavy` / `light` 为其他供应商的模型（`provider/model` 格式），例如 `anthropic/claude-...`、`openai/gpt-...`、`google/gemini-...`（具体模型 ID 可在 pi 内用 `/model` 查看）
2. 配置对应 API key（环境变量或 pi 内 `/login`）
3. 非交互命令会自动按档位附加 `--model`；交互模式用 Ctrl+P 在 `enabledModels` 之间循环切换

### `.codehelper/` 目录策略

- `model-routing.json`：模型路由配置，入库管理
- `notes.md`：跨会话记忆，入库管理（可随版本追踪决策与踩坑记录）
- `costs.jsonl`：运行时成本流水，已加入 `.gitignore`，不入库
- `reports/`：自动检查报告，已加入 `.gitignore`，不入库

### 定时自动检查

```bash
npm run ch -- auto-check        # 手动跑一次，报告生成到 .codehelper/reports/YYYY-MM-DD.md
```

接入系统调度（失败时退出码为 1，可用于告警）：

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

然后 `launchctl load ~/Library/LaunchAgents/com.codehelper.auto-check.plist`。

**Linux（cron）**：

```bash
0 9 * * * cd /Users/wuxuebin/CodeHelper && /usr/bin/env node scripts/auto-check.mjs
```

## CLI 用法

`node bin/codehelper.mjs` 或 `npm run ch -- <cmd>`，子命令如下：

| 命令 | 说明 |
|------|------|
| （无参数） | 进入交互模式 |
| `plan "<任务>"` | 非交互：先制定分阶段计划，不写代码 |
| `implement "<说明>"` | 非交互：按计划实施并验证 |
| `review [范围]` | 非交互：结构化代码审查 |
| `commit [message]` | 非交互：规范化提交 |
| `test [命令]` | 非交互：运行测试并修复失败 |
| `fix "<问题>"` | 非交互：定位并修复 bug |
| `debug "<问题>"` | 非交互：深度调试（复现 → 根因 → 修复 → 回归） |
| `refactor "<范围>"` | 非交互：行为不变重构（基线 → 方案 → 实施 → 回归） |
| `issue "<编号/URL>"` | 非交互：分析 GitHub issue 并输出实施计划 |
| `ci-fix "<PR>"` | 非交互：分析 CI/PR 检查失败，定位根因并给修复建议 |
| `test-gen "<目标>"` | 非交互：为函数/模块生成单元测试骨架并验证 |
| `auto-check` | 运行自动检查（配置/测试/依赖）并生成报告 |
| `pr [title]` | 非交互：创建/更新 PR |
| `docs [主题]` | 非交互：更新文档 |
| `wrap "<说明>"` | 非交互：端到端完成当前任务 |
| `setup` | 运行环境安装与体检 |
| `check` | 运行配置校验（等价于 `npm run validate`） |

非交互子命令自动携带 `--approve` 以加载项目级 .pi 资源；如需禁用可追加 `--no-approve`。

## 目录结构

```
CodeHelper/
├── AGENTS.md                 # pi 加载的项目指令（工作流约定）
├── PLAN.md                   # 分阶段开发计划
├── bin/codehelper.mjs        # CLI 包装器
├── scripts/
│   ├── setup.mjs             # 安装与体检
│   └── validate.mjs          # .pi 资源配置校验
├── .pi/
│   ├── settings.json         # 项目级设置
│   ├── APPEND_SYSTEM.md      # 追加系统提示（人格与风格）
│   ├── prompts/              # slash 命令（/plan /review ...）
│   ├── skills/               # 按需加载的技能
│   └── extensions/           # 事件钩子与自定义工具
└── docs/
    ├── architecture.md       # 架构说明
    └── workflows.md          # 自动化工作流说明
```

## 文档

- [PLAN.md](PLAN.md)：分阶段开发计划
- [docs/architecture.md](docs/architecture.md)：架构说明
- [docs/workflows.md](docs/workflows.md)：工作流说明

## 与 pi 的关系

CodeHelper 不修改 pi 源码，而是以 pi 为引擎，通过项目内配置（AGENTS.md、prompts、skills、extensions、settings）定制行为。pi 的完整文档见 [pi.dev/docs](https://pi.dev/docs/latest)。
