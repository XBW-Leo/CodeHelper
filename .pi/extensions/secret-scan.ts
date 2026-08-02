/**
 * Secret Scan Extension
 *
 * 在 git commit 前扫描 staged diff，检测密钥 / token / 私钥泄露；发现则阻止提交。
 * 交互模式弹窗确认，非交互模式直接拒绝。
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

// 匹配 `git commit`、`git -C <dir> commit`、`git --no-pager commit` 等
const COMMIT_RE = /\bgit\b(\s+(-C\s+\S+|-c\s+\S+=\S+|--[a-z-]+(=\S+)?))*(?:\s+commit)\b/;
const HELP_RE = /\bcommit\b[^\n;&|]*\s(-h|--help)\b/;

/** 从 `git -C <dir> commit` 中提取目标仓库目录 */
function commitRepoDir(command: string): string | undefined {
	const match = /-C\s*(\S+)/.exec(command);
	return match?.[1];
}

const SECRET_PATTERNS: { name: string; re: RegExp }[] = [
	{ name: "私钥块", re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
	{ name: "GitHub token", re: /\bgh[pousr]_[A-Za-z0-9]{20,}\b/ },
	{ name: "OpenAI/Anthropic 风格密钥", re: /\bsk-[A-Za-z0-9]{20,}\b/ },
	{ name: "AWS Access Key", re: /\bAKIA[0-9A-Z]{16}\b/ },
	{ name: "Google API key", re: /\bAIza[0-9A-Za-z_-]{35}\b/ },
	{ name: "Slack token", re: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/ },
	{
		name: "通用密钥赋值",
		re: /(?:API[_-]?KEY|SECRET|TOKEN|PASSWORD|PASSWD)\s*[:=]\s*["']?[A-Za-z0-9_\-./+]{12,}/i,
	},
];

/** 截断匹配内容，避免回显完整密钥 */
function truncate(value: string): string {
	return value.length <= 12 ? value : `${value.slice(0, 8)}…${value.slice(-4)}`;
}

/** 扫描一次 diff 输出，返回 `文件: 规则（片段）` 列表 */
function scanDiff(diff: string): string[] {
	const findings: string[] = [];
	let currentFile = "?";

	for (const line of diff.split("\n")) {
		if (line.startsWith("+++ ")) {
			currentFile = line.slice(4).trim().replace(/^b\//, "");
			continue;
		}
		if (!line.startsWith("+") || line.startsWith("+++")) continue;

		const content = line.slice(1);
		for (const { name, re } of SECRET_PATTERNS) {
			const match = re.exec(content);
			if (match) {
				findings.push(`${currentFile}: ${name}（${truncate(match[0])}）`);
				break;
			}
		}
	}

	return findings;
}

export default function (pi: ExtensionAPI) {
	pi.on("tool_call", async (event, ctx) => {
		if (event.toolName !== "bash") return;

		const command = (event.input as { command?: string }).command ?? "";
		if (!COMMIT_RE.test(command) || HELP_RE.test(command)) return;

		// `git -C <dir>` 时扫描目标仓库，而不是 pi 当前工作目录
		const repoDir = commitRepoDir(command);
		const execOptions = repoDir ? { cwd: repoDir } : undefined;

		// 只读扫描：暂存区
		const cached = await pi.exec("git", ["diff", "--cached", "-U0", "--no-color"], execOptions);
		const findings = cached.code === 0 ? scanDiff(cached.stdout) : [];

		// `git commit -a` 会把未暂存的改动一并提交，需额外扫描工作区
		if (command.includes(" -a") || command.includes(" -am") || command.includes(" --all")) {
			const unstaged = await pi.exec("git", ["diff", "-U0", "--no-color"], execOptions);
			if (unstaged.code === 0) findings.push(...scanDiff(unstaged.stdout));
		}

		if (findings.length === 0) return;

		const detail = findings.join("\n");

		if (ctx.hasUI) {
			const ok = await ctx.ui.confirm(
				"密钥扫描",
				`检测到暂存内容可能包含密钥：\n${detail}\n\n仍要提交吗？`,
			);
			if (ok) return;
		}

		return {
			block: true,
			reason: `密钥扫描：已阻止提交。暂存内容可能包含密钥：\n${detail}\n\n请移除密钥后再提交，或明确授权。`,
		};
	});
}
