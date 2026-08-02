#!/usr/bin/env node
/**
 * CodeHelper CLI
 *
 * 包装 pi coding agent，提供常用自动化工作流入口。
 *
 *   codehelper                      → 交互模式
 *   codehelper plan "任务描述"       → 非交互：制定计划
 *   codehelper review               → 非交互：代码审查
 *   codehelper setup                → 环境安装与体检
 *   codehelper check                → 配置校验
 */

import { spawn, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ROUTING_FILE = join(ROOT, ".codehelper", "model-routing.json");

/** 非交互子命令 → 对应的 prompt 模板名 */
const PROMPT_COMMANDS = new Map([
	["plan", "plan"],
	["implement", "implement"],
	["review", "review"],
	["commit", "commit"],
	["test", "test"],
	["fix", "fix"],
	["debug", "debug"],
	["refactor", "refactor"],
	["issue", "issue"],
	["ci-fix", "ci-fix"],
	["test-gen", "test-gen"],
	["pr", "pr"],
	["docs", "docs"],
	["wrap", "wrap"],
]);

const USAGE = `CodeHelper CLI

用法:
  codehelper                        进入交互模式
  codehelper <命令> [参数...]        非交互执行对应工作流
  codehelper setup                  环境安装与体检
  codehelper check                  配置校验
  codehelper --help                 显示本帮助

命令:
  plan "<任务>"      先制定分阶段计划，不写代码
  implement "[说明]" 按计划实施并验证
  review "[范围]"    结构化代码审查（默认审查未提交改动）
  commit "[message]" 规范化提交（Conventional Commits）
  test "[命令]"      运行测试并修复失败
  fix "<问题>"       定位并修复 bug
  debug "<问题>"     深度调试：复现、定位根因、修复、回归
  refactor "<范围>"  行为不变的重构：基线、方案、小步实施、回归
  issue "<编号/URL>" 分析 GitHub issue 并输出分阶段实施计划
  ci-fix "<PR>"     分析 CI/PR 检查失败：拉日志、定位根因、给修复建议
  test-gen "<目标>"  生成单元测试骨架并运行验证
  pr "[title]"       创建/更新 Pull Request
  docs "[主题]"      更新项目文档
  wrap "<说明>"      端到端完成当前任务（实现、验证、提交）
`;

function piBin() {
	const candidates =
		process.platform === "win32"
			? [join(ROOT, "node_modules", ".bin", "pi.cmd"), join(ROOT, "node_modules", ".bin", "pi")]
			: [join(ROOT, "node_modules", ".bin", "pi")];
	for (const candidate of candidates) {
		if (existsSync(candidate)) return candidate;
	}
	return "pi"; // 回退到全局安装
}

function runNodeScript(script, args = []) {
	const result = spawnSync(process.execPath, [join(ROOT, "scripts", script), ...args], {
		stdio: "inherit",
	});
	process.exit(result.status ?? 1);
}

function runInteractive() {
	spawn(piBin(), [], { stdio: "inherit", cwd: ROOT });
}

/**
 * 按命令从路由配置解析模型（provider/model 格式）。
 * 命令未配置时用 light 档；配置缺失或解析失败时返回 undefined（走 pi 默认模型）。
 */
function resolveRoutingModel(command) {
	try {
		const routing = JSON.parse(readFileSync(ROUTING_FILE, "utf8"));
		const tier = routing.commands?.[command] ?? "light";
		const model = routing[tier];
		return typeof model === "string" && model ? model : undefined;
	} catch {
		return undefined;
	}
}

function runPrompt(command, args) {
	const piArgs = ["-p", `/${command} ${args.join(" ")}`.trimEnd()];
	// 非交互模式默认信任项目，以加载 .pi 下的 prompts/skills/extensions
	if (!args.includes("--no-approve")) piArgs.push("--approve");
	// 多模型路由：按命令档位附加 --model（供应商无关，配置驱动）
	if (!args.some((arg) => arg === "--model" || arg.startsWith("--model="))) {
		const model = resolveRoutingModel(command);
		if (model) piArgs.push("--model", model);
	}
	spawn(piBin(), piArgs, { stdio: "inherit", cwd: ROOT });
}

const [,, command = "interactive", ...rest] = process.argv;

switch (command) {
	case "--help":
	case "-h":
	case "help":
		process.stdout.write(USAGE);
		break;
	case "setup":
		runNodeScript("setup.mjs");
		break;
	case "check":
	case "validate":
		runNodeScript("validate.mjs");
		break;
	case "interactive":
		runInteractive();
		break;
	default: {
		if (PROMPT_COMMANDS.has(command)) {
			runPrompt(PROMPT_COMMANDS.get(command), rest);
		} else {
			process.stderr.write(`未知命令: ${command}\n\n`);
			process.stderr.write(USAGE);
			process.exit(1);
		}
	}
}
