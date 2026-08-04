#!/usr/bin/env node
/**
 * CodeHelper 自动检查
 *
 * 依次运行：配置校验、项目测试、依赖检查，输出结构化报告到
 * `.codehelper/reports/YYYY-MM-DD.md`，供人工或定时任务（crontab / launchd）使用。
 * 退出码：0 = 无失败；1 = 存在失败项。
 */

import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const REPORTS_DIR = join(ROOT, ".codehelper", "reports");

function run(cmd, args) {
	const result = spawnSync(cmd, args, { cwd: ROOT, encoding: "utf8", timeout: 10 * 60 * 1000 });
	return {
		code: result.status,
		stdout: (result.stdout ?? "").trim(),
		stderr: (result.stderr ?? "").trim(),
	};
}

function hasScript(name) {
	try {
		const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
		return Boolean(pkg.scripts?.[name]);
	} catch {
		return false;
	}
}

function today() {
	const parts = new Intl.DateTimeFormat("en-US", {
		timeZone: "Asia/Shanghai",
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).formatToParts(new Date());
	const get = (type) => parts.find((p) => p.type === type)?.value ?? "";
	return `${get("year")}-${get("month")}-${get("day")}`;
}

const results = [];
let hasFailure = false;
let hasWarning = false;

// 1. 配置校验（必需项）
{
	const r = run("npm", ["run", "validate"]);
	const ok = r.code === 0;
	results.push({
		name: "配置校验（npm run validate）",
		status: ok ? "通过" : "失败",
		output: r.stdout || r.stderr || "（无输出）",
	});
	if (!ok) hasFailure = true;
}

// 2. 项目测试（存在 test 脚本时运行）
if (hasScript("test")) {
	const r = run("npm", ["test"]);
	const ok = r.code === 0;
	results.push({
		name: "项目测试（npm test）",
		status: ok ? "通过" : "失败",
		output: r.stdout || r.stderr || "（无输出）",
	});
	if (!ok) hasFailure = true;
} else {
	results.push({
		name: "项目测试（npm test）",
		status: "跳过",
		output: "package.json 未定义 test 脚本",
	});
}

// 3. 依赖过期检查（警告级）
{
	const r = run("npm", ["outdated", "--json"]);
	if (r.code === 0) {
		results.push({ name: "依赖过期检查（npm outdated）", status: "通过", output: "所有依赖均为最新" });
	} else if (r.code === 1 && r.stdout) {
		hasWarning = true;
		let outdatedCount = 0;
		try {
			outdatedCount = Object.keys(JSON.parse(r.stdout)).length;
		} catch {
			outdatedCount = r.stdout.split("\n").filter((line) => line.trim()).length;
		}
		results.push({
			name: "依赖过期检查（npm outdated）",
			status: "警告",
			output: `存在过期依赖（共 ${outdatedCount} 个）:\n${r.stdout.slice(0, 1500)}`,
		});
	} else {
		hasWarning = true;
		results.push({
			name: "依赖过期检查（npm outdated）",
			status: "警告",
			output: r.stderr || "检查失败（可能是网络或 registry 问题）",
		});
	}
}

// 4. 依赖安全审计（警告级）
{
	const r = run("npm", ["audit", "--omit=dev", "--json"]);
	let output = r.stdout || r.stderr || "（无输出）";
	let vulns = null;
	try {
		vulns = JSON.parse(r.stdout)?.metadata?.vulnerabilities ?? null;
	} catch {
		vulns = null;
	}
	if (vulns) {
		const total = vulns.total ?? 0;
		if (total === 0) {
			results.push({ name: "依赖安全审计（npm audit）", status: "通过", output: "未发现已知漏洞" });
		} else {
			hasWarning = true;
			results.push({
				name: "依赖安全审计（npm audit）",
				status: "警告",
				output: `漏洞总数: ${total}（high: ${vulns.high ?? 0}, critical: ${vulns.critical ?? 0}）\n${output.slice(0, 1200)}`,
			});
		}
	} else {
		hasWarning = true;
		results.push({
			name: "依赖安全审计（npm audit）",
			status: "警告",
			output: output.slice(0, 1200) || "审计失败（可能是网络或 registry 问题）",
		});
	}
}

// 汇总
const overall = hasFailure ? "❌ 有失败" : hasWarning ? "⚠️ 有警告" : "✅ 全部通过";
const lines = [
	"# CodeHelper 自动检查报告",
	"",
	`- 时间：${new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}`,
	`- 总体状态：${overall}`,
	"",
	"## 检查项",
	"",
];

results.forEach((item, index) => {
	lines.push(`### ${index + 1}. ${item.name} — ${item.status}`, "");
	lines.push("```", (item.output ?? "").slice(0, 2000), "```", "");
});

mkdirSync(REPORTS_DIR, { recursive: true });
const reportFile = join(REPORTS_DIR, `${today()}.md`);
writeFileSync(reportFile, `${lines.join("\n").trimEnd()}\n`, "utf8");

process.stdout.write(`总体状态：${overall}\n报告已生成：${reportFile}\n`);
process.exit(hasFailure ? 1 : 0);
