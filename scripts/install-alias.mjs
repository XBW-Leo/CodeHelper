#!/usr/bin/env node
/**
 * CodeHelper alias 安装脚本
 *
 * 往 ~/.zshrc 追加 CodeHelper 快捷 alias（幂等，带标记块，可整体移除）。
 * 默认 dry-run 只预览；--apply 才写入；--remove 移除已安装的块。
 *
 * 用法:
 *   node scripts/install-alias.mjs            # 预览（dry-run）
 *   node scripts/install-alias.mjs --apply    # 写入 ~/.zshrc
 *   node scripts/install-alias.mjs --remove   # 移除已安装的块
 *   node scripts/install-alias.mjs --file ~/.config/zsh/.zshrc   # 指定文件
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const MARKER_BEGIN = "# >>> CodeHelper aliases >>>";
const MARKER_END = "# <<< CodeHelper aliases <<<";

function shellQuote(path) {
	return `'${path.replace(/'/g, `'\\''`)}'`;
}

function buildBlock() {
	const root = shellQuote(ROOT);
	return [
		MARKER_BEGIN,
		"# CodeHelper CLI 快捷方式（由 scripts/install-alias.mjs 管理）",
		`ch() { cd ${root} && npm run ch -- "$@"; }`,
		`chpi() { cd ${root} && npm run pi "$@"; }`,
		MARKER_END,
	].join("\n");
}

function parseArgs(argv) {
	const mode = argv.includes("--apply") ? "apply" : argv.includes("--remove") ? "remove" : "dry-run";
	const fileIdx = argv.indexOf("--file");
	const file = fileIdx !== -1 && argv[fileIdx + 1] ? argv[fileIdx + 1] : join(homedir(), ".zshrc");
	return { mode, file };
}

function readShellFile(file) {
	return existsSync(file) ? readFileSync(file, "utf8") : "";
}

function extractBlock(content) {
	const start = content.indexOf(MARKER_BEGIN);
	const end = content.indexOf(MARKER_END);
	if (start === -1 || end === -1 || end < start) return null;
	return { start, end: end + MARKER_END.length };
}

const { mode, file } = parseArgs(process.argv.slice(2));
const block = buildBlock();
const content = readShellFile(file);
const existing = extractBlock(content);

if (mode === "apply") {
	if (existing) {
		process.stdout.write(`已安装（幂等）：${file}\n`);
		process.exit(0);
	}
	const next = `${content.trimEnd()}\n\n${block}\n`;
	writeFileSync(file, next, "utf8");
	process.stdout.write(`已写入 ${file}\n`);
	process.stdout.write(`新开终端后生效：\n  ch --version\n  chpi\n`);
} else if (mode === "remove") {
	if (!existing) {
		process.stdout.write(`未发现 CodeHelper alias 块：${file}\n`);
		process.exit(0);
	}
	const next = `${content.slice(0, existing.start).trimEnd()}\n${content.slice(existing.end).trimStart()}\n`;
	writeFileSync(file, next, "utf8");
	process.stdout.write(`已从 ${file} 移除 CodeHelper alias 块\n`);
} else {
	process.stdout.write(`[dry-run] 目标文件：${file}\n`);
	process.stdout.write(existing ? "[dry-run] 已安装，无需重复写入\n" : `[dry-run] 将追加以下内容：\n\n${block}\n`);
	process.stdout.write('确认无误后执行：node scripts/install-alias.mjs --apply\n');
}
