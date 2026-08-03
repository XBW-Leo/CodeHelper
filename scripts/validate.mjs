#!/usr/bin/env node
/**
 * CodeHelper 配置校验
 *
 * 校验 .pi 下的 settings、prompts、skills、extensions 是否符合 pi 的约定。
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];
const infos = [];

function check(condition, message) {
	if (condition) {
		infos.push(`✔ ${message}`);
	} else {
		errors.push(`✘ ${message}`);
	}
}

function parseFrontmatter(file) {
	const text = readFileSync(file, "utf8");
	const match = /^---\n([\s\S]*?)\n---/.exec(text);
	if (!match) return { text, frontmatter: null, body: text };
	const frontmatter = {};
	for (const line of match[1].split("\n")) {
		const idx = line.indexOf(":");
		if (idx === -1) continue;
		frontmatter[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
	}
	return { text, frontmatter, body: text.slice(match[0].length).trim() };
}

function list(dir, predicate) {
	if (!existsSafe(dir)) return [];
	return readdirSync(dir)
		.filter((name) => predicate(name, dir))
		.map((name) => join(dir, name));
}

function existsSafe(file) {
	try {
		return statSync(file).isFile() || statSync(file).isDirectory();
	} catch {
		return false;
	}
}

// 1. 根文件
check(existsSafe(join(ROOT, "AGENTS.md")), "存在 AGENTS.md");
check(existsSafe(join(ROOT, "package.json")), "存在 package.json");

// 2. .pi/settings.json
const settingsPath = join(ROOT, ".pi", "settings.json");
if (existsSafe(settingsPath)) {
	try {
		const settings = JSON.parse(readFileSync(settingsPath, "utf8"));
		check(typeof settings === "object" && settings !== null, ".pi/settings.json 是合法 JSON");
	} catch (err) {
		check(false, `.pi/settings.json 解析失败: ${err.message}`);
	}
} else {
	check(false, "存在 .pi/settings.json");
}

// 2.1 .codehelper/model-routing.json
const routingPath = join(ROOT, ".codehelper", "model-routing.json");
if (existsSafe(routingPath)) {
	try {
		const routing = JSON.parse(readFileSync(routingPath, "utf8"));
		check(typeof routing.heavy === "string" && routing.heavy, "model-routing.json: heavy 为合法模型字符串");
		check(typeof routing.light === "string" && routing.light, "model-routing.json: light 为合法模型字符串");
		const tiers = ["heavy", "light"];
		const bad = Object.entries(routing.commands ?? {}).filter(([, v]) => !tiers.includes(v));
		check(bad.length === 0, `model-routing.json: commands 档位合法（非法: ${bad.map(([k]) => k).join(", ") || "无"}）`);
	} catch (err) {
		check(false, `.codehelper/model-routing.json 解析失败: ${err.message}`);
	}
} else {
	check(false, "存在 .codehelper/model-routing.json");
}

// 3. prompts
const promptFiles = list(join(ROOT, ".pi", "prompts"), (name) => name.endsWith(".md"));
infos.push(`  发现 ${promptFiles.length} 个 prompt 模板`);
for (const file of promptFiles) {
	const { frontmatter, body } = parseFrontmatter(file);
	const name = file.split("/").pop().replace(/\.md$/, "");
	const desc = frontmatter?.description || body.split("\n").find((line) => line.trim());
	check(Boolean(desc), `prompt /${name} 有描述`);
	check(!frontmatter?.description || frontmatter.description.length <= 1024, `prompt /${name} 描述长度合法`);
}

// 4. skills
const skillsDir = join(ROOT, ".pi", "skills");
if (existsSafe(skillsDir)) {
	const skillDirs = readdirSync(skillsDir).filter((name) =>
		existsSafe(join(skillsDir, name, "SKILL.md")),
	);
	infos.push(`  发现 ${skillDirs.length} 个 skill`);
	for (const dir of skillDirs) {
		const file = join(skillsDir, dir, "SKILL.md");
		const { frontmatter } = parseFrontmatter(file);
		const name = frontmatter?.name;
		check(Boolean(name), `skill ${dir}: frontmatter 含 name`);
		check(Boolean(frontmatter?.description), `skill ${dir}: frontmatter 含 description`);
		check(!name || /^[a-z0-9]+(-[a-z0-9]+)*$/.test(name), `skill ${dir}: name 符合规范 (${name ?? "?"})`);
		check(!name || name.length <= 64, `skill ${dir}: name 长度合法`);
		check(!frontmatter?.description || frontmatter.description.length <= 1024, `skill ${dir}: 描述长度合法`);
	}
} else {
	check(false, "存在 .pi/skills 目录");
}

// 5. extensions
const extFiles = list(join(ROOT, ".pi", "extensions"), (name) => name.endsWith(".ts"));
infos.push(`  发现 ${extFiles.length} 个扩展`);
for (const file of extFiles) {
	const text = readFileSync(file, "utf8");
	check(text.includes("export default"), `${file.split("/").pop()}: 导出默认工厂函数`);
	check(/pi\.on\(|pi\.registerTool\(|pi\.registerCommand\(/.test(text), `${file.split("/").pop()}: 调用 ExtensionAPI 方法`);
}

// 6. TypeScript 类型校验
const tscBin = join(ROOT, "node_modules", "typescript", "lib", "tsc.js");
let tscOutput = "";
if (existsSafe(tscBin)) {
	infos.push("  运行 tsc --noEmit 类型校验");
	const tscResult = spawnSync(process.execPath, [tscBin, "--noEmit"], { cwd: ROOT, encoding: "utf8" });
	tscOutput = `${tscResult.stdout || ""}${tscResult.stderr || ""}`.trim();
	check(tscResult.status === 0, "tsc --noEmit 通过");
} else {
	check(false, "未找到 typescript（请先运行 npm install）");
}

if (tscOutput) process.stdout.write(`\n${tscOutput}\n`);

process.stdout.write("\nCodeHelper 配置校验\n");
process.stdout.write(infos.map((line) => ` ${line}`).join("\n") + "\n");
if (errors.length) {
	process.stdout.write("\n" + errors.map((line) => ` ${line}`).join("\n") + "\n");
	process.stdout.write(`\n共 ${errors.length} 个问题，请修复后重试。\n`);
	process.exit(1);
}
process.stdout.write("\n全部通过 ✔\n");
