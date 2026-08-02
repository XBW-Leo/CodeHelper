/**
 * Memory Extension
 *
 * 跨会话记忆：把项目决策、踩坑经验、用户偏好持久化到 `.codehelper/notes.md`，
 * 新会话首次对话时自动加载摘要，供 agent 跨会话复用。
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { StringEnum } from "@earendil-works/pi-ai";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

const NOTES_RELATIVE = ".codehelper/notes.md";
const NOTES_HEADER = "# CodeHelper 项目笔记\n\n> 跨会话记忆：由 memory 工具自动维护。项目决策、踩坑经验、用户偏好都记在这里。";
const MAX_INJECT_CHARS = 2000;
const MAX_LIST_CHARS = 6000;

function notesFile(cwd: string): string {
	return resolve(cwd, NOTES_RELATIVE);
}

function todayHeader(): string {
	return `## ${new Date().toISOString().slice(0, 10)}`;
}

function readNotes(file: string): string {
	if (!existsSync(file)) return "";
	return readFileSync(file, "utf8");
}

function appendNote(file: string, text: string): void {
	mkdirSync(dirname(file), { recursive: true });
	const header = todayHeader();
	let content = existsSync(file) ? readFileSync(file, "utf8").trimEnd() : NOTES_HEADER;
	if (!content.includes(header)) {
		content = `${content}\n\n${header}`;
	}
	writeFileSync(file, `${content}\n- ${text}\n`, "utf8");
}

/** 注入摘要：只取最近一段，控制 token 开销 */
function summary(content: string): string {
	const trimmed = content.trimEnd();
	const tail = trimmed.slice(-MAX_INJECT_CHARS);
	const prefix = trimmed.length > MAX_INJECT_CHARS ? "（历史记录较长，以下为最近摘要，可用 memory 工具查看全部）\n" : "";
	return `[memory] 项目笔记\n${prefix}${tail}`;
}

function searchNotes(content: string, keyword: string): string {
	const kw = keyword.toLowerCase();
	const lines = content.split("\n");
	const hits: string[] = [];
	for (let i = 0; i < lines.length; i++) {
		if (lines[i].toLowerCase().includes(kw)) {
			hits.push(`${i + 1}: ${lines[i].trim()}`);
		}
	}
	return hits.length ? hits.join("\n") : `未找到包含 "${keyword}" 的记录`;
}

const MemoryParams = Type.Object({
	action: StringEnum(["add", "list", "search"] as const),
	text: Type.Optional(Type.String({ description: "要记录的内容（add 必填）" })),
	keyword: Type.Optional(Type.String({ description: "搜索关键词（search 必填）" })),
});

export default function (pi: ExtensionAPI) {
	// 每个会话只自动注入一次
	let injected = false;
	pi.on("session_start", () => {
		injected = false;
	});
	pi.on("session_tree", () => {
		injected = false;
	});

	pi.on("context", async (event, ctx) => {
		if (injected) return;
		injected = true;

		const content = readNotes(notesFile(ctx.cwd));
		if (!content.trim()) return;

		return {
			messages: [
				...event.messages,
				{
					role: "user",
					content: summary(content),
					timestamp: Date.now(),
				},
			],
		};
	});

	pi.registerTool({
		name: "memory",
		label: "Memory",
		description:
			"跨会话记忆：add 记录一条项目决策/经验/偏好，list 查看全部，search 按关键词检索。需要记录或查询项目历史结论时使用。",
		parameters: MemoryParams,

		async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
			const file = notesFile(ctx.cwd);

			switch (params.action) {
				case "add": {
					if (!params.text) {
						return {
							content: [{ type: "text", text: "Error: add 需要 text 参数" }],
							details: {},
						};
					}
					appendNote(file, params.text);
					return {
						content: [{ type: "text", text: `已记录到项目笔记：${params.text}` }],
						details: {},
					};
				}

				case "list": {
					const content = readNotes(file);
					if (!content.trim()) {
						return {
							content: [{ type: "text", text: "项目笔记为空。可以用 memory add 记录第一条。" }],
							details: {},
						};
					}
					return {
						content: [{ type: "text", text: content.slice(-MAX_LIST_CHARS) }],
						details: {},
					};
				}

				case "search": {
					if (!params.keyword) {
						return {
							content: [{ type: "text", text: "Error: search 需要 keyword 参数" }],
							details: {},
						};
					}
					return {
						content: [{ type: "text", text: searchNotes(readNotes(file), params.keyword) }],
						details: {},
					};
				}

				default:
					return {
						content: [{ type: "text", text: `未知操作: ${params.action}` }],
						details: {},
					};
			}
		},
	});
}
