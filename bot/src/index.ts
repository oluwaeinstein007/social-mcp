#!/usr/bin/env node
import "dotenv/config";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import type { FunctionDeclaration, Schema } from "@google/genai";

import { SocialMcpClient } from "./mcp/client.js";
import { TelegramBot } from "./bot/telegram.js";
import { weatherFunctionDeclaration, getWeather } from "./tools/weather.js";
import type { ToolExecutor } from "./types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Convert MCP tool inputSchema → Gemini FunctionDeclaration ──────────────
function mcpToolToGemini(tool: {
	name: string;
	description?: string;
	inputSchema: object;
}): FunctionDeclaration {
	return {
		name: tool.name,
		description: tool.description,
		parameters: tool.inputSchema as unknown as Schema,
	};
}

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
	// Validate required env vars
	const geminiApiKey = process.env.GEMINI_API_KEY;
	const telegramToken = process.env.TELEGRAM_BOT_TOKEN;

	if (!geminiApiKey) {
		throw new Error("GEMINI_API_KEY is required — get one at https://aistudio.google.com/app/apikey");
	}
	if (!telegramToken) {
		throw new Error("TELEGRAM_BOT_TOKEN is required — create a bot via @BotFather");
	}

	// Resolve social-mcp server path
	// Default: ../dist/index.js (sibling dist folder when run from bot/)
	const rawServerPath =
		process.env.SOCIAL_MCP_SERVER_PATH ?? "../dist/index.js";
	const serverPath = resolve(__dirname, rawServerPath);

	// ── Connect to social-mcp via MCP stdio transport ──────────────────────
	const mcpClient = new SocialMcpClient();
	let mcpTools: FunctionDeclaration[] = [];

	try {
		await mcpClient.connect(serverPath);
		mcpTools = mcpClient.tools.map(mcpToolToGemini);
	} catch (err) {
		console.warn(
			`⚠️  Could not connect to social-mcp server at: ${serverPath}`,
		);
		console.warn(
			`   ${err instanceof Error ? err.message : String(err)}`,
		);
		console.warn(
			`   Run "pnpm build" in the parent social-mcp folder first.`,
		);
		console.warn(`   Social media tools will be unavailable.\n`);
	}

	// ── Combine all tools ────────────────────────────────────────────────────
	const allTools: FunctionDeclaration[] = [
		weatherFunctionDeclaration,
		...mcpTools,
	];

	console.log(
		`📦 Loaded ${allTools.length} tools: ${allTools.map((t) => t.name).join(", ")}`,
	);

	// ── Tool executor: routes get_weather locally, everything else via MCP ──
	const toolExecutor: ToolExecutor = async (name, args) => {
		if (name === "get_weather") {
			return getWeather(
				args.city as string,
				args.country_code as string | undefined,
			);
		}
		return mcpClient.callTool(name, args);
	};

	// ── Start Telegram bot ────────────────────────────────────────────────────
	const bot = new TelegramBot(telegramToken, geminiApiKey, allTools, toolExecutor);

	// Graceful shutdown
	process.once("SIGINT", async () => {
		console.log("\n🛑 Shutting down...");
		bot.stop();
		await mcpClient.disconnect();
		process.exit(0);
	});
	process.once("SIGTERM", async () => {
		bot.stop();
		await mcpClient.disconnect();
		process.exit(0);
	});

	await bot.start();
}

main().catch((err) => {
	console.error("❌ Fatal error:", err instanceof Error ? err.message : err);
	process.exit(1);
});
