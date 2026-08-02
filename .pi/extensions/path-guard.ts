/**
 * Path Guard Extension
 *
 * 禁止 write / edit 工具触碰受保护路径（.env、密钥文件、node_modules、生产配置），
 * 并对 bash 中明显的重定向写入、tee、rm 目标做拦截。
 * 交互模式弹窗确认，非交互模式直接拒绝。
 */

import { basename, resolve, sep } from "node:path";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

/** 受保护文件名模式（匹配 basename） */
const SECRET_FILE_PATTERNS = [
	/^\.env($|\.)/i, // .env, .env.local, .env.production ...
	/\.(pem|key|p8|pfx|jks)$/i, // 私钥与证书
	/^id_(rsa|ed25519|dsa|ecdsa)$/, // ssh 私钥
	/^credentials\.json$/i,
	/^client_secret.+\.json$/i,
	/^secrets\.(json|ya?ml|toml|env)$/i,
	/^\.npmrc$/, // 可能含 registry token
	/^\.netrc$/,
	/^\.git-credentials$/,
	/^hosts\.ya?ml$/i, // gh 等工具凭据
];

/** 受保护目录段（路径中任意一级命中即拦截） */
const PROTECTED_SEGMENTS = new Set(["node_modules", "deploy"]);

function protectedReason(target: string): string | undefined {
	const abs = resolve(target);
	const segments = abs.split(sep).filter(Boolean);
	const name = basename(abs);

	for (const pattern of SECRET_FILE_PATTERNS) {
		if (pattern.test(name)) {
			return `受保护文件类型：${name}`;
		}
	}

	for (const segment of segments) {
		if (PROTECTED_SEGMENTS.has(segment)) {
			return `受保护目录：${segment}/`;
		}
	}

	// 生产配置目录：config/production*
	for (let i = 0; i < segments.length - 1; i++) {
		if (segments[i] === "config" && segments[i + 1].startsWith("production")) {
			return `受保护生产配置目录：config/${segments[i + 1]}`;
		}
	}

	return undefined;
}

/** 从 bash 命令中提取可能的写入目标（重定向、tee、rm） */
function bashWriteTargets(command: string): string[] {
	const targets: string[] = [];

	// > file / >> file / 2> file
	const redirectRe = /(?:^|[^>])(>|>>)\s*["']?([^\s|;&"'<>]+)/g;
	let match: RegExpExecArray | null;
	while ((match = redirectRe.exec(command)) !== null) {
		targets.push(match[2]);
	}

	// tee file
	const teeRe = /\btee\s+["']?([^\s|;&"'<>]+)/g;
	while ((match = teeRe.exec(command)) !== null) {
		targets.push(match[1]);
	}

	// rm 目标（删除密钥/配置同样敏感）
	const rmRe = /\brm\s+[^|;&]*?(["']([^"']+)["']|([^\s|;&"'<>]+))/g;
	while ((match = rmRe.exec(command)) !== null) {
		targets.push(match[2] ?? match[3]);
	}

	return targets.filter(Boolean);
}

export default function (pi: ExtensionAPI) {
	pi.on("tool_call", async (event, ctx) => {
		const toolName = event.toolName;
		if (toolName !== "write" && toolName !== "edit" && toolName !== "bash") return;

		const input = event.input as Record<string, unknown>;
		const targets: string[] = [];

		if (toolName === "write" || toolName === "edit") {
			if (typeof input.path === "string") targets.push(input.path);
		} else if (typeof input.command === "string") {
			targets.push(...bashWriteTargets(input.command));
		}

		const hits = targets
			.map((target) => ({ target, reason: protectedReason(target) }))
			.filter((hit): hit is { target: string; reason: string } => hit.reason !== undefined);
		if (hits.length === 0) return;

		const detail = hits.map((hit) => `${hit.target}（${hit.reason}）`).join("; ");

		if (ctx.hasUI) {
			const ok = await ctx.ui.confirm("路径保护", `检测到对受保护路径的写入：${detail}\n\n是否允许执行？`);
			if (ok) return;
		}

		return {
			block: true,
			reason: `路径保护：已拦截对受保护路径的写入（${detail}）。如需操作请明确授权。`,
		};
	});
}
