/**
 * Post Session Summary Extension
 *
 * 每轮有实际文件改动（write / edit）的任务结束后，自动在 `.codehelper/notes.md`
 * 追加一条「目标 / 改动 / 结果」总结，跨会话沉淀经验。
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { appendNote, notesFile, timeInTimeZone } from "./lib/notes.ts";

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
	return singleLine(goal, 120);
}

/** 提取结果：最后一条 assistant 消息文本 */
function findResult(messages: SummaryMessage[]): string {
	for (let i = messages.length - 1; i >= 0; i--) {
		if (messages[i].role === "assistant") {
			return singleLine(textContent(messages[i].content), 200);
		}
	}
	return "";
}

/** 压缩为单行：notes 记录要求"一句话一条"，避免多行 markdown 破坏格式 */
function singleLine(text: string, max: number): string {
	return text.replace(/\s+/g, " ").trim().slice(0, max);
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
		const time = timeInTimeZone();

		appendNote(notesFile(ctx.cwd), `[总结 ${time}] 目标：${goal}；改动：${files}；结果：${result}`);
		turnFiles = new Set<string>();
	});
}
