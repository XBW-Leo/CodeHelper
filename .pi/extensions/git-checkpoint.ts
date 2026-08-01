/**
 * Git Checkpoint Extension
 *
 * 在每一轮 turn 开始时创建 git stash checkpoint，/fork 时可选择恢复当时的代码状态。
 * 基于 pi 官方示例扩展（MIT）：packages/coding-agent/examples/extensions/git-checkpoint.ts
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function (pi: ExtensionAPI) {
	const checkpoints = new Map<string, string>();
	let currentEntryId: string | undefined;

	// 跟踪当前用户消息对应的 entry ID
	pi.on("tool_result", async (_event, ctx) => {
		const leaf = ctx.sessionManager.getLeafEntry();
		if (leaf) currentEntryId = leaf.id;
	});

	// LLM 开始修改前创建代码快照（stash create 不改变工作区）
	pi.on("turn_start", async () => {
		const { stdout } = await pi.exec("git", ["stash", "create"]);
		const ref = stdout.trim();
		if (ref && currentEntryId) {
			checkpoints.set(currentEntryId, ref);
		}
	});

	// fork 到某个历史点时，询问是否恢复当时的代码状态
	pi.on("session_before_fork", async (event, ctx) => {
		const ref = checkpoints.get(event.entryId);
		if (!ref) return;
		if (!ctx.hasUI) return; // 非交互模式不自动恢复

		const choice = await ctx.ui.select("Restore code state?", [
			"Yes, restore code to that point",
			"No, keep current code",
		]);

		if (choice?.startsWith("Yes")) {
			await pi.exec("git", ["stash", "apply", ref]);
			ctx.ui.notify("Code restored to checkpoint", "info");
		}
	});

	// agent 完成一轮后清理 checkpoint
	pi.on("agent_end", async () => {
		checkpoints.clear();
	});
}
