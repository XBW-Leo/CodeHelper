/**
 * Cost Tracker Extension
 *
 * 按会话统计 token 与费用：从会话分支直接计算 usage（幂等），
 * 每次 agent_end 把本次增量追加到 `.codehelper/costs.jsonl`（按 sessionId 求和即真实总费用）；
 * 提供 `/cost` 命令与 `cost-stats` 工具实时查询。
 */

import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

const COSTS_RELATIVE = ".codehelper/costs.jsonl";

interface UsageLike {
	input?: number;
	output?: number;
	cacheRead?: number;
	cacheWrite?: number;
	totalTokens?: number;
	cost?: {
		input?: number;
		output?: number;
		cacheRead?: number;
		cacheWrite?: number;
		total?: number;
	};
}

interface CostMessage {
	role: string;
	usage?: UsageLike;
}

interface SessionEntryLike {
	type: string;
	message?: CostMessage;
}

interface CostTotals {
	input: number;
	output: number;
	cacheRead: number;
	cacheWrite: number;
	totalTokens: number;
	cost: number;
}

function emptyTotals(): CostTotals {
	return { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, totalTokens: 0, cost: 0 };
}

function sumUsage(messages: CostMessage[], totals: CostTotals): void {
	for (const message of messages) {
		if (message.role !== "assistant" || !message.usage) continue;
		const usage = message.usage;
		totals.input += usage.input ?? 0;
		totals.output += usage.output ?? 0;
		totals.cacheRead += usage.cacheRead ?? 0;
		totals.cacheWrite += usage.cacheWrite ?? 0;
		totals.totalTokens += usage.totalTokens ?? 0;
		totals.cost += usage.cost?.total ?? 0;
	}
}

function costsFile(cwd: string): string {
	return resolve(cwd, COSTS_RELATIVE);
}

function appendCostRecord(cwd: string, sessionId: string, totals: CostTotals): void {
	const file = costsFile(cwd);
	mkdirSync(dirname(file), { recursive: true });
	const record = { timestamp: new Date().toISOString(), sessionId, ...totals };
	appendFileSync(file, `${JSON.stringify(record)}\n`, "utf8");
}

/**
 * 汇总某 session 已写入 costs.jsonl 的增量，作为上次写入的累计基线。
 * 进程重启后基线仍正确（增量求和 = 累计值），避免重复计数。
 */
function sumCostRecords(cwd: string, sessionId: string): CostTotals {
	const totals = emptyTotals();
	const file = costsFile(cwd);
	if (!existsSync(file)) return totals;
	for (const line of readFileSync(file, "utf8").split("\n")) {
		const record = line.trim() ? parseCostRecord(line) : null;
		if (!record || record.sessionId !== sessionId) continue;
		totals.input += record.input;
		totals.output += record.output;
		totals.cacheRead += record.cacheRead;
		totals.cacheWrite += record.cacheWrite;
		totals.totalTokens += record.totalTokens;
		totals.cost += record.cost;
	}
	return totals;
}

interface CostRecord extends CostTotals {
	sessionId: string;
}

function parseCostRecord(line: string): CostRecord | null {
	try {
		const rec = JSON.parse(line) as Partial<CostRecord>;
		if (typeof rec !== "object" || rec === null) return null;
		return {
			sessionId: typeof rec.sessionId === "string" ? rec.sessionId : "",
			input: rec.input ?? 0,
			output: rec.output ?? 0,
			cacheRead: rec.cacheRead ?? 0,
			cacheWrite: rec.cacheWrite ?? 0,
			totalTokens: rec.totalTokens ?? 0,
			cost: rec.cost ?? 0,
		};
	} catch {
		return null;
	}
}

function formatTotals(totals: CostTotals): string {
	return [
		`输入 tokens: ${totals.input}`,
		`输出 tokens: ${totals.output}`,
		`缓存读/写: ${totals.cacheRead} / ${totals.cacheWrite}`,
		`总 tokens: ${totals.totalTokens}`,
		`估算费用: $${totals.cost.toFixed(6)}`,
	].join("\n");
}

export default function (pi: ExtensionAPI) {
	/** 从当前会话分支计算累计用量（幂等，可随时调用） */
	const computeSessionTotals = (ctx: { sessionManager: { getBranch(): SessionEntryLike[] } }): CostTotals => {
		const totals = emptyTotals();
		for (const entry of ctx.sessionManager.getBranch()) {
			if (entry.type !== "message" || !entry.message) continue;
			if (entry.message.role === "assistant") {
				sumUsage([entry.message], totals);
			}
		}
		return totals;
	};

	pi.on("agent_end", async (_event, ctx) => {
		const sessionId = ctx.sessionManager.getSessionId();
		const current = computeSessionTotals(ctx);
		const previous = sumCostRecords(ctx.cwd, sessionId);
		const delta: CostTotals = {
			input: current.input - previous.input,
			output: current.output - previous.output,
			cacheRead: current.cacheRead - previous.cacheRead,
			cacheWrite: current.cacheWrite - previous.cacheWrite,
			totalTokens: current.totalTokens - previous.totalTokens,
			cost: current.cost - previous.cost,
		};
		appendCostRecord(ctx.cwd, sessionId, delta);
	});

	pi.registerCommand("cost", {
		description: "显示当前会话的 token 与费用统计",
		handler: async (_args, ctx) => {
			ctx.ui.notify(formatTotals(computeSessionTotals(ctx)), "info");
		},
	});

	pi.registerTool({
		name: "cost-stats",
		label: "Cost Stats",
		description: "返回当前会话的 token 与费用统计：输入/输出/缓存 tokens、总 tokens、估算费用。",
		parameters: Type.Object({}),

		async execute(_toolCallId, _params, _signal, _onUpdate, _ctx) {
			const totals = computeSessionTotals(_ctx);
			return {
				content: [{ type: "text", text: formatTotals(totals) }],
				details: { ...totals },
			};
		},
	});
}
