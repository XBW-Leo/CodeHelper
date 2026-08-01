/**
 * Safety Guard Extension
 *
 * 拦截高风险 bash 命令：rm -rf、git reset --hard、git checkout .、git clean、force push、sudo。
 * 交互模式弹窗确认，非交互模式直接拒绝。
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const DANGEROUS_PATTERNS: { pattern: RegExp; reason: string }[] = [
	{ pattern: /\brm\s+(-[a-z]*r[a-z]*f|-[a-z]*f[a-z]*r)\b/, reason: "rm -rf 递归删除" },
	{ pattern: /\bgit\s+reset\s+--hard\b/, reason: "git reset --hard 会丢弃改动" },
	{ pattern: /\bgit\s+checkout\s+\.\s*$/, reason: "git checkout . 会丢弃改动" },
	{ pattern: /\bgit\s+clean\s+-[a-z]*f[a-z]*d?/, reason: "git clean 会删除未跟踪文件" },
	{ pattern: /\bgit\s+push\b.*(--force|-f\b)/, reason: "force push 会覆盖远端历史" },
	{ pattern: /\bsudo\b/, reason: "sudo 提权操作" },
];

export default function (pi: ExtensionAPI) {
	pi.on("tool_call", async (event, ctx) => {
		if (event.toolName !== "bash") return;
		const command = event.input.command as string | undefined;
		if (!command) return;

		for (const { pattern, reason } of DANGEROUS_PATTERNS) {
			if (!pattern.test(command)) continue;

			if (ctx.hasUI) {
				const ok = await ctx.ui.confirm("危险操作", `检测到 ${reason}：\n\n${command}\n\n是否允许执行？`);
				if (ok) return;
			}

			return {
				block: true,
				reason: `已拦截：${reason}。如需执行请明确授权。`,
			};
		}
	});
}
