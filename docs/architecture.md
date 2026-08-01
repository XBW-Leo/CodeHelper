# CodeHelper 架构说明

## 设计思路

CodeHelper 不 fork 也不修改 pi 源码，而是把 pi 当作"引擎"，用项目内的配置文件定义 agent 的行为。这样做的好处：

- 引擎升级零成本：`npm update @earendil-works/pi-coding-agent` 即可
- 行为完全可审计：所有定制都在本仓库，diff 可见、可 review
- 分层清晰：指令 / 命令 / 技能 / 扩展各司其职

## 分层结构

```
┌──────────────────────────────────────────────────────┐
│ 用户入口                                              │
│   bin/codehelper.mjs（CLI 包装器）                    │
│   npm scripts（npm run pi、npm run ch:*）             │
├──────────────────────────────────────────────────────┤
│ pi coding agent 引擎                                 │
│   会话管理 / 工具调用循环 / 多提供商模型接入            │
├──────────────────────────────────────────────────────┤
│ 行为定义层                                            │
│   AGENTS.md          项目指令：工作方式、Git 约定、校验 │
│   .pi/APPEND_SYSTEM.md  追加系统提示：人格、语言、安全   │
│   .pi/settings.json     运行参数：thinking、compaction │
├──────────────────────────────────────────────────────┤
│ 自动化层                                              │
│   .pi/prompts/*.md    slash 命令：/plan /review ...    │
│   .pi/skills/*/SKILL.md 按需加载的技能（渐进式披露）     │
├──────────────────────────────────────────────────────┤
│ 增强层                                                │
│   .pi/extensions/*.ts  事件钩子与自定义工具             │
│     git-checkpoint   每轮快照，fork 可恢复              │
│     safety-guard     危险命令拦截                      │
│     todo             todo 工具 + /todos 命令           │
├──────────────────────────────────────────────────────┤
│ 支撑脚本                                              │
│   scripts/setup.mjs    环境体检与安装                  │
│   scripts/validate.mjs .pi 资源校验（CI 可用）          │
└──────────────────────────────────────────────────────┘
```

## 各层职责

### 行为定义层（回答"agent 应该怎么做事"）

| 文件 | 作用 | 加载时机 |
|------|------|----------|
| `AGENTS.md` | 项目级指令：先规划后实施、小步验证、Git 规则、校验命令 | 每次启动 |
| `.pi/APPEND_SYSTEM.md` | 追加到系统提示：CodeHelper 人格、语言偏好、安全边界 | 每次启动 |
| `.pi/settings.json` | thinking level、技能命令开关、compaction 参数 | 每次启动 |

### 自动化层（回答"常见流程怎么执行"）

**Prompts（slash 命令）**：交互式输入 `/plan ...` 会展开为一段指令，把工作流固化成可复用模板。本项目的命令：

| 命令 | 用途 |
|------|------|
| `/plan` | 制定分阶段计划，不写代码 |
| `/implement` | 按计划实施并验证 |
| `/review` | 结构化代码审查 |
| `/commit` | 规范化提交 |
| `/test` | 跑测试并修复 |
| `/fix` | 定位并修复 bug |
| `/pr` | 创建/更新 PR |
| `/docs` | 更新文档 |
| `/wrap` | 端到端收尾（实现、验证、提交） |

**Skills（按需加载）**：系统提示只放名称与描述，模型在任务匹配时才用 `read` 加载完整 `SKILL.md`，节省上下文。

| Skill | 用途 |
|-------|------|
| `plan-driven-dev` | 计划驱动开发全流程 |
| `git-workflow` | 安全 Git 操作与 Conventional Commits |
| `code-review` | 结构化代码审查清单 |

### 增强层（回答"引擎缺什么能力"）

扩展通过事件钩子介入引擎生命周期：

- `tool_call`：在 bash 工具执行前拦截危险命令（safety-guard）
- `turn_start` / `tool_result` / `session_before_fork`：git 快照与恢复（git-checkpoint）
- `session_start` / `session_tree`：从会话历史重建 todo 状态（todo）

扩展还能注册自定义工具（`todo`）和自定义命令（`/todos`），并可通过 `pi.exec` 调用系统命令。

## 非交互模式说明

`bin/codehelper.mjs` 把 slash 命令直接传给 `pi -p "/<command> <args>"`。pi 的非交互模式默认不加载项目级 `.pi` 资源，因此包装器自动附加 `--approve` 信任项目，保证 prompts / skills / extensions 生效；需要时可用 `--no-approve` 关闭。

## 扩展新能力的路径

1. **新流程**：`.pi/prompts/<name>.md`（带 `description` frontmatter）
2. **新技能**：`.pi/skills/<name>/SKILL.md`（Agent Skills 标准）
3. **新工具/钩子**：`.pi/extensions/<name>.ts`（默认导出工厂函数）
4. 修改后运行 `npm run validate`，并更新 `docs/workflows.md` 与 `README.md`

