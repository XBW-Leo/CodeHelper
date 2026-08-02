/**
 * Repo Status Extension
 *
 * 每轮对话自动注入 git 状态摘要（分支、未提交改动、最近提交），
 * 并提供 `repo-status` 工具供 agent 按需查询完整状态。
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

/** 收集当前仓库状态；非 git 仓库返回 undefined */
async function collectStatus(pi: ExtensionAPI): Promise<string | undefined> {
	const branch = await pi.exec("git", ["branch", "--show-current"]);
	if (branch.code !== 0) return undefined;

	const branchName = branch.stdout.trim() || "(detached HEAD)";
	const status = await pi.exec("git", ["status", "--short"]);
	const statusLines = status.code === 0 ? status.stdout.trim().split("\n").filter(Boolean) : [];
	const log = await pi.exec("git", ["log", "--oneline", "-5"]);

	const parts: string[] = [];
	parts.push(`分支: ${branchName}`);
	parts.push(`未提交改动: ${statusLines.length} 个文件`);
	if (statusLines.length > 0) {
		const shown = statusLines.slice(0, 20);
		parts.push(`改动摘要:\n${shown.join("\n")}${statusLines.length > 20 ? `\n... 其余 ${statusLines.length - 20} 条` : ""}`);
	}
	if (log.code === 0 && log.stdout.trim()) {
		parts.push(`最近提交:\n${log.stdout.trim()}`);
	}

	return `[repo-status] 当前仓库状态\n${parts.join("\n")}`;
}

export default function (pi: ExtensionAPI) {
	// 去重：只在本轮出现新用户消息时注入一次
	let lastInjectedCount = -1;

	const resetInjection = () => {
		lastInjectedCount = -1;
	};
	pi.on("session_start", resetInjection);
	pi.on("session_tree", resetInjection);

	pi.on("context", async (event, _ctx) => {
		if (event.messages.length <= lastInjectedCount) return;
		const last = event.messages[event.messages.length - 1];
		if (!last || last.role !== "user") return;

		lastInjectedCount = event.messages.length;
		const status = await collectStatus(pi);
		if (!status) return;

		return {
			messages: [
				...event.messages,
				{
					role: "user",
					content: status,
					timestamp: Date.now(),
				},
			],
		};
	});

	// 按需查询工具
	pi.registerTool({
		name: "repo-status",
		label: "Repo Status",
		description: "返回当前仓库的状态：分支、未提交改动、最近提交。需要了解仓库现状时使用。",
		parameters: Type.Object({}),

		async execute(_toolCallId, _params, _signal, _onUpdate, _ctx) {
			const status = await collectStatus(pi);
			return {
				content: [{ type: "text", text: status ?? "当前目录不是 git 仓库" }],
				details: {},
			};
		},
	});
}
