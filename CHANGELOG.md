# Changelog

CodeHelper 版本变更记录。格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)。

## [Unreleased]

### Added

- `npm test` smoke：版本一致性、脚本语法、validate、alias dry-run
- GitHub Actions CI：push/PR 自动运行 `npm ci` + `npm test`
- CLI `--help` 标注 `pr --draft`；README FAQ 补充 GitHub 推送故障排查

### Fixed

- auto-check：过期依赖计数改为解析 JSON（此前把 JSON 行数当包数）；报告日期统一 Asia/Shanghai
- setup：环境体检支持检测 `DEEPSEEK_API_KEY`
- notes：清理历史畸形条目（会话总结已单行化，后续不再产生）

## [0.2.0] - 2026-08-04

### Added

- Shell 快捷命令：`npm run ch:alias` 安装 `ch` / `chpi`（幂等、可移除，`--dry-run` 预览）
- CLI 版本参数：`--version` / `-V` / `version`（PR #1）
- CHANGELOG 与版本化（0.1.0 → 0.2.0）

### Changed

- docs/workflows.md 补充 issue / ci-fix / test-gen / auto-check 流程章节
- README 同步开发进度与 FAQ

### Fixed

- `/pr` 支持 `--draft` 创建草稿 PR
- 会话总结压缩为单行，避免多行 markdown 污染笔记

## [0.1.0] - 2026-08-01

### Added

- 基于 pi 0.83.0 的 CodeHelper 框架：CLI、AGENTS.md、14 个 prompts、8 个 skills、9 个 extensions
- 计划驱动开发流程：/plan → /implement → /test → /commit
- 核心功能：/debug、/refactor、安全护栏（危险命令拦截、路径保护、提交前密钥扫描）、repo-status
- 进阶功能：跨会话记忆、会话后总结、成本统计、多模型路由、/issue、/ci-fix、/test-gen
- 定时监控：auto-check（可接入 cron / launchd）
- 质量加固：tsc 类型校验、model-tier frontmatter、notes 公共模块、模型 ID 格式统一
- Phase 5 端到端演练验收（交互首启 + 全链路 + PR #1 合入）
