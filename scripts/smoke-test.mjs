#!/usr/bin/env node
/**
 * CodeHelper smoke test（npm test）
 *
 * 依次验证：
 * 1. CLI --version 与 package.json 版本一致
 * 2. bin/ 与 scripts/ 下所有脚本语法通过
 * 3. npm run validate 全绿（settings/prompts/skills/extensions/routing/tsc）
 * 4. install-alias 脚本 dry-run 正常
 */

import { spawnSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];

function run(cmd, args, opts = {}) {
	return spawnSync(cmd, args, { cwd: ROOT, encoding: "utf8", ...opts });
}

function check(ok, message) {
	process.stdout.write(`${ok ? "✔" : "✘"} ${message}\n`);
	if (!ok) failures.push(message);
}

// 1. 版本一致性
const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
const version = run(process.execPath, [join(ROOT, "bin", "codehelper.mjs"), "--version"]);
check(
	version.status === 0 && version.stdout.trim() === pkg.version,
	`CLI --version 与 package.json 一致（${pkg.version}）`,
);

// 2. 脚本语法检查
const scripts = [
	"bin/codehelper.mjs",
	...readdirSync(join(ROOT, "scripts"))
		.filter((name) => name.endsWith(".mjs"))
		.map((name) => join("scripts", name)),
];
for (const script of scripts) {
	const result = run(process.execPath, ["--check", join(ROOT, script)]);
	check(result.status === 0, `语法检查 ${script}`);
}

// 3. 配置校验
const validate = run("npm", ["run", "validate"], { timeout: 120_000 });
check(validate.status === 0, "npm run validate 全绿");

// 4. alias 脚本 dry-run（不写入任何文件）
const alias = run(process.execPath, [join(ROOT, "scripts", "install-alias.mjs"), "--dry-run", "--file", join(ROOT, ".smoke-zshrc")]);
check(alias.status === 0 && alias.stdout.includes("CodeHelper aliases"), "install-alias 脚本 dry-run 正常");

process.stdout.write(failures.length ? `\n${failures.length} 项失败，请修复后重试。\n` : "\n全部通过 ✔\n");
process.exit(failures.length ? 1 : 0);
