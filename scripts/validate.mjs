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

/**
 * 发现扩展入口：与 pi 扩展加载器规则一致——
 * 顶层 *.ts/*.js 直接加载；子目录需含 index.ts/index.js（如 lib/ 这类纯模块目录会被排除）。
 */
function discoverExtensions(dir) {
	const found = [];
	if (!existsSafe(dir)) return found;
	for (const name of readdirSync(dir)) {
		const entry = join(dir, name);
		if (statSync(entry).isFile() && /\.(ts|js)$/.test(name)) {
			found.push(entry);
		} else if (statSync(entry).isDirectory()) {
			for (const indexName of ["index.ts", "index.js"]) {
				if (existsSafe(join(entry, indexName))) {
					found.push(join(entry, indexName));
					break;
				}
			}
		}
	}
	return found;
}

// 1. 根文件
check(existsSafe(join(ROOT, "AGENTS.md")), "存在 AGENTS.md");
check(existsSafe(join(ROOT, "package.json")), "存在 package.json");

// 2. .pi/settings.json
const settingsPath = join(ROOT, ".pi", "settings.json");
let settings = null;
if (existsSafe(settingsPath)) {
	try {
		settings = JSON.parse(readFileSync(settingsPath, "utf8"));
		check(typeof settings === "object" && settings !== null, ".pi/settings.json 是合法 JSON");
	} catch (err) {
		check(false, `.pi/settings.json 解析失败: ${err.message}`);
	}
} else {
	check(false, "存在 .pi/settings.json");
}

if (settings) {
	if (Array.isArray(settings.enabledModels)) {
		const badFmt = settings.enabledModels.filter(
			(m) => typeof m !== "string" || !/^[^/]+\/[^/]+$/.test(m),
		);
		check(
			badFmt.length === 0,
			`settings: enabledModels 使用 provider/model 格式（非法项: ${badFmt.join(", ") || "无"}）`,
		);
	}
}

// 2.1 .codehelper/model-routing.json
const routingPath = join(ROOT, ".codehelper", "model-routing.json");
let routing = null;
if (existsSafe(routingPath)) {
	try {
		routing = JSON.parse(readFileSync(routingPath, "utf8"));
		check(typeof routing.heavy === "string", "model-routing.json: heavy 为字符串（可留空走默认模型）");
		check(typeof routing.light === "string", "model-routing.json: light 为字符串（可留空走默认模型）");
		for (const tier of ["heavy", "light"]) {
			if (typeof routing[tier] === "string" && routing[tier]) {
				check(
					/^[^/]+\/[^/]+$/.test(routing[tier]),
					`model-routing.json: ${tier} 使用 provider/model 格式（当前: ${routing[tier]}）`,
				);
			}
		}
		const tiers = ["heavy", "light"];
		const bad = Object.entries(routing.commands ?? {}).filter(([, v]) => !tiers.includes(v));
		check(bad.length === 0, `model-routing.json: commands 档位合法（非法: ${bad.map(([k]) => k).join(", ") || "无"}）`);
	} catch (err) {
		check(false, `.codehelper/model-routing.json 解析失败: ${err.message}`);
	}
} else {
	check(false, "存在 .codehelper/model-routing.json");
}

if (settings && Array.isArray(settings.enabledModels) && routing) {
	const routedModels = [routing.heavy, routing.light].filter(Boolean);
	const missing = routedModels.filter((m) => !settings.enabledModels?.includes(m));
	check(
		missing.length === 0,
		`model-routing: 路由模型均在 settings.enabledModels 中（缺失: ${missing.join(", ") || "无"}）`,
	);
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
	const tier = frontmatter?.["model-tier"];
	check(tier === "heavy" || tier === "light", `prompt /${name}: model-tier 为 heavy/light（当前: ${tier ?? "无"}）`);
	const expectedTier = routing?.commands?.[name] ?? "light";
	check(
		!tier || tier === expectedTier,
		`prompt /${name}: model-tier 与 model-routing 一致（期望 ${expectedTier}）`,
	);
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
const extFiles = discoverExtensions(join(ROOT, ".pi", "extensions"));
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
