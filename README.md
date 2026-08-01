# CodeHelper

基于 [pi](https://github.com/earendil-works/pi) 框架的个人 coding agent（类 Claude Code），把常用工程流程变成 AI 可自动执行的工作流。

## 特性

- 计划驱动的开发流程：`/plan` → `/implement` → `/test` → `/commit`
- 常用 slash 命令：代码审查、Bug 修复、PR、文档更新、端到端收尾
- 按需加载的 skills（[Agent Skills 标准](https://agentskills.io/specification)）
- 安全扩展：危险命令拦截、git checkpoint、todo 管理
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
