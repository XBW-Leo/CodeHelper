/**
 * Notes 共享模块
 *
 * memory 与 post-session-summary 共用的 `.codehelper/notes.md` 读写与日期处理。
 * 统一默认时区（Asia/Shanghai），避免两个扩展各自实现导致的行为不一致。
 *
 * 注意：本文件位于 extensions/lib/ 子目录且没有 index 入口，pi 扩展加载器
 * 不会把它当作独立扩展加载；仅作为共享模块被其他扩展 import。
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

export const NOTES_RELATIVE = ".codehelper/notes.md";
export const NOTES_HEADER =
	"# CodeHelper 项目笔记\n\n> 跨会话记忆：由 memory 工具自动维护。项目决策、踩坑经验、用户偏好都记在这里。";
export const MAX_INJECT_CHARS = 2000;
export const MAX_LIST_CHARS = 6000;

export const DEFAULT_TIMEZONE = "Asia/Shanghai";

export function notesFile(cwd: string): string {
	return resolve(cwd, NOTES_RELATIVE);
}

/** 在指定时区下格式化日期为 YYYY-MM-DD（notes 的分节标题） */
export function dateInTimeZone(now: Date = new Date(), timeZone: string = DEFAULT_TIMEZONE): string {
	const parts = new Intl.DateTimeFormat("en-US", {
		timeZone,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).formatToParts(now);
	const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
	return `${get("year")}-${get("month")}-${get("day")}`;
}

/** 在指定时区下格式化时间为 HH:mm（用于总结标签） */
export function timeInTimeZone(now: Date = new Date(), timeZone: string = DEFAULT_TIMEZONE): string {
	const parts = new Intl.DateTimeFormat("en-US", {
		timeZone,
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	}).formatToParts(now);
	const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
	return `${get("hour")}:${get("minute")}`;
}

export function todayHeader(): string {
	return `## ${dateInTimeZone()}`;
}

export function readNotes(file: string): string {
	return existsSync(file) ? readFileSync(file, "utf8") : "";
}

/** 追加一条记录：按日期分节，文件不存在时先写入标题 */
export function appendNote(file: string, text: string): void {
	mkdirSync(dirname(file), { recursive: true });
	const header = todayHeader();
	let content = existsSync(file) ? readFileSync(file, "utf8").trimEnd() : NOTES_HEADER;
	if (!content.includes(header)) {
		content = `${content}\n\n${header}`;
	}
	writeFileSync(file, `${content}\n- ${text}\n`, "utf8");
}

/** 注入摘要：只取最近一段，控制 token 开销 */
export function summary(content: string): string {
	const trimmed = content.trimEnd();
	const tail = trimmed.slice(-MAX_INJECT_CHARS);
	const prefix =
		trimmed.length > MAX_INJECT_CHARS
			? "（历史记录较长，以下为最近摘要，可用 memory 工具查看全部）\n"
			: "";
	return `[memory] 项目笔记\n${prefix}${tail}`;
}
