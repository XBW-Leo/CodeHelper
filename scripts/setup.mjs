#!/usr/bin/env node
/**
 * CodeHelper 环境安装与体检
 *
 * 1. 检查 Node 版本（pi 要求 >= 22.19.0）
 * 2. 检查/安装项目依赖（node_modules/.bin/pi）
 * 3. 检查模型提供商凭据
 * 4. 输出下一步指引
 */

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const MIN_NODE = [22, 19, 0];

function log(prefix, message) {
	process.stdout.write(`${prefix} ${message}\n`);
}

function run(cmd, args, opts = {}) {
	return spawnSync(cmd, args, { stdio: "inherit", ...opts });
}

function checkNode() {
	const [major, minor, patch] = process.versions.node.split(".").map(Number);
	const ok = major > MIN_NODE[0] || (major === MIN_NODE[0] && (minor > MIN_NODE[1] || (minor === MIN_NODE[1] && patch >= MIN_NODE[2])));
	if (ok) {
		log("✔", `Node ${process.versions.node} 满足要求 (>= ${MIN_NODE.join(".")})`);
	} else {
		log("✘", `Node ${process.versions.node} 过低，需要 >= ${MIN_NODE.join(".")}，请升级后重试`);
		process.exit(1);
	}
}

function checkDeps() {
	const localPi = join(ROOT, "node_modules", ".bin", "pi");
	if (existsSync(localPi)) {
		log("✔", "pi 已在项目内安装 (node_modules/.bin/pi)");
		return;
	}
	log("…", "未找到项目内 pi，执行 npm install ...");
	const result = run("npm", ["install"], { cwd: ROOT });
	if (result.status !== 0) {
		log("✘", "npm install 失败，请检查网络或 npm 配置后重试");
		process.exit(1);
	}
	if (existsSync(localPi)) {
		log("✔", "pi 安装成功");
	} else {
		log("✘", "安装完成但未找到 pi 可执行文件，请检查 package.json");
		process.exit(1);
	}
}

function checkProvider() {
	const keys = ["DEEPSEEK_API_KEY", "ANTHROPIC_API_KEY", "OPENAI_API_KEY", "GEMINI_API_KEY", "GROQ_API_KEY"];
	const found = keys.some((key) => process.env[key]);
	if (found) {
		const detected = keys.filter((key) => process.env[key]);
		log("✔", `检测到模型提供商 API key 环境变量（${detected.join(", ")}）`);
	} else {
		log("…", "未检测到 API key 环境变量；可在 pi 内执行 /login 完成登录");
	}
}

log("", "CodeHelper 环境体检\n");
checkNode();
checkDeps();
checkProvider();

log("", "下一步:");
log(" ", "1. 运行 npm run pi 进入交互模式，首次会询问是否信任本项目，选择信任");
log(" ", "2. 在 pi 内执行 /login 选择模型提供商，或先设置 API key 环境变量");
log(" ", "3. 运行 npm run validate 校验 .pi 配置");
log(" ", "4. 试一个工作流：codehelper plan \"你的任务\"");
