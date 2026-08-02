/**
 * Post Session Summary Extension
 *
 * 每轮有实际文件改动（write / edit）的任务结束后，自动在 `.codehelper/notes.md`
 * 追加一条「目标 / 改动 / 结果」总结，跨会话沉淀经验。
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const NOTES_RELATIVE = ".codehelper/notes.md";
const NOTES_HEADER =
	"# CodeHelper 项目笔记\n\n> 跨会话记忆：由 memory 工具自动维护。项目决策、踩坑经验、用户偏好都记在这里。";

interface SummaryMessage {
	role: string;
	content: unknown;
}

function textContent(content: unknown): string {
	if (typeof content === "string") return content;
	if (!Array.isArray(content)) return "";
	return content
		.filter(
			(part): part is { type: "text"; text: string } =>
				typeof part === "object" &&
				part !== null &&
				(part as { type?: unknown }).type === "text" &&
				typeof (part as { text?: unknown }).text === "string",
		)
		.map((part) => part.text)
		.join(" ");
}

/** 提取本轮目标：最后一条真实用户消息（剔除自动注入的 repo-status / memory 内容） */
function findGoal(messages: SummaryMessage[]): string {
	let goal = "";
	for (const message of messages) {
		if (message.role !== "user") continue;
		const text = textContent(message.content);
		if (text.startsWith("[repo-status]") || text.startsWith("[memory]")) continue;
		goal = text;
	}
	return goal.slice(0, 120);
}

/** 提取结果：最后一条 assistant 消息文本 */
function findResult(messages: SummaryMessage[]): string {
	for (let i = messages.length - 1; i >= 0; i--) {
		if (messages[i].role === "assistant") {
			return textContent(messages[i].content).slice(0, 200);
		}
	}
	return "";
}

function appendSummary(cwd: string, text: string): void {
	const file = resolve(cwd, NOTES_RELATIVE);
	mkdirSync(dirname(file), { recursive: true });
	const header = `## ${new Date().toISOString().slice(0, 10)}`;
	let content = existsSync(file) ? readFileSync(file, "utf8").trimEnd() : NOTES_HEADER;
	if (!content.includes(header)) {
		content = `${content}\n\n${header}`;
	}
	writeFileSync(file, `${content}\n- ${text}\n`, "utf8");
}

export default function (pi: ExtensionAPI) {
	// 本轮实际改动过的文件
	let turnFiles = new Set<string>();

	pi.on("tool_call", (event) => {
		if (event.toolName !== "write" && event.toolName !== "edit") return;
		const input = event.input as { path?: unknown };
		if (typeof input.path === "string") {
			turnFiles.add(input.path);
		}
	});

	pi.on("agent_end", async (event, ctx) => {
		if (turnFiles.size === 0) return; // 纯问答轮次不记录

		const messages = event.messages as unknown as SummaryMessage[];
		const files = [...turnFiles].slice(0, 5).join(", ");
		const goal = findGoal(messages) || "（未识别目标）";
		const result = findResult(messages) || "（无文本输出）";
		const time = new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false });

		appendSummary(ctx.cwd, `[总结 ${time}] 目标：${goal}；改动：${files}；结果：${result}`);
		turnFiles = new Set<string>();
	});
}
