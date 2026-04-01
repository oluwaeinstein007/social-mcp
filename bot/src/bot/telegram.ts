import { Telegraf } from "telegraf";
import { GeminiAgent } from "../llm/gemini.js";
import type { FunctionDeclaration } from "@google/genai";
import type { ToolExecutor } from "../types.js";

const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes of inactivity

type ChatType = "private" | "group" | "supergroup" | "channel";

export class TelegramBot {
	private bot: Telegraf;
	/** Key: chat ID (groups) or user ID (DMs) → agent */
	private sessions = new Map<number, GeminiAgent>();
	private sessionTimers = new Map<number, NodeJS.Timeout>();
	private geminiApiKey: string;
	private tools: FunctionDeclaration[];
	private toolExecutor: ToolExecutor;

	constructor(
		token: string,
		geminiApiKey: string,
		tools: FunctionDeclaration[],
		toolExecutor: ToolExecutor,
	) {
		this.bot = new Telegraf(token);
		this.geminiApiKey = geminiApiKey;
		this.tools = tools;
		this.toolExecutor = toolExecutor;
		this.setupHandlers();
	}

	// ── Session management ────────────────────────────────────────────────────

	/**
	 * Groups share one session (keyed by chat ID).
	 * DMs get a per-user session (keyed by user ID).
	 */
	private sessionKey(
		chatType: ChatType,
		chatId: number,
		userId: number,
	): number {
		return chatType === "group" || chatType === "supergroup"
			? chatId
			: userId;
	}

	private getOrCreateSession(key: number): GeminiAgent {
		if (!this.sessions.has(key)) {
			this.sessions.set(
				key,
				new GeminiAgent(this.geminiApiKey, this.tools, this.toolExecutor),
			);
		}

		// Reset inactivity timer
		const existing = this.sessionTimers.get(key);
		if (existing) clearTimeout(existing);

		this.sessionTimers.set(
			key,
			setTimeout(() => {
				this.sessions.delete(key);
				this.sessionTimers.delete(key);
			}, SESSION_TTL_MS),
		);

		return this.sessions.get(key) as GeminiAgent;
	}

	private clearSession(key: number): void {
		this.sessions.delete(key);
		const timer = this.sessionTimers.get(key);
		if (timer) {
			clearTimeout(timer);
			this.sessionTimers.delete(key);
		}
	}

	// ── Message helpers ───────────────────────────────────────────────────────

	/** Remove @botname mention from anywhere in the message. */
	private stripMention(text: string, botUsername: string): string {
		return text
			.replace(new RegExp(`@${botUsername}`, "gi"), "")
			.trim();
	}

	/**
	 * In a group the bot only responds when:
	 *  1. It is @mentioned, OR
	 *  2. The message is a direct reply to one of the bot's messages.
	 *
	 * In private chat it always responds.
	 */
	private shouldRespond(
		chatType: ChatType,
		text: string,
		botUsername: string,
		replyToUserId: number | undefined,
		botId: number,
	): boolean {
		if (chatType === "private") return true;
		const mentioned = text
			.toLowerCase()
			.includes(`@${botUsername.toLowerCase()}`);
		const replyToBot = replyToUserId === botId;
		return mentioned || replyToBot;
	}

	// ── Handlers ──────────────────────────────────────────────────────────────

	private groupIntro(mention: string): string {
		return (
			`👋 I'm your Social Media Assistant powered by Gemini.\n` +
			`Tag me (${mention}) or reply to any of my messages to chat!\n\n` +
			`I can help with weather, Twitter/X, Discord, Slack, WhatsApp, Facebook, Instagram, and more.`
		);
	}

	private setupHandlers(): void {
		// ── Auto-greet when bot is added to a group ──────────────────────────
		this.bot.on("new_chat_members", (ctx) => {
			const botId = ctx.botInfo?.id;
			const added = ctx.message.new_chat_members.some((m) => m.id === botId);
			if (!added) return;

			const mention = ctx.botInfo?.username
				? `@${ctx.botInfo.username}`
				: "me";
			ctx.reply(this.groupIntro(mention));
		});

		// ── /start: DM intro or group reminder ───────────────────────────────
		this.bot.start((ctx) => {
			const name = ctx.from?.first_name ?? "there";
			const isGroup = ctx.chat?.type !== "private";
			const mention = ctx.botInfo?.username
				? `@${ctx.botInfo.username}`
				: "me";

			if (isGroup) {
				ctx.reply(this.groupIntro(mention));
			} else {
				ctx.reply(
					`👋 Hello ${name}! I'm your Social Media Assistant powered by Gemini.\n\n` +
						`I can help you:\n` +
						`🐦 Post & search on Twitter/X\n` +
						`💬 Send messages on Telegram, Discord, Slack, WhatsApp\n` +
						`📘 Create posts on Facebook & Instagram\n` +
						`🌤 Get weather for any city\n\n` +
						`Just send me a message to get started. Use /clear to reset our conversation.`,
				);
			}
		});

		this.bot.command("clear", (ctx) => {
			const chatType = ctx.chat?.type as ChatType;
			const chatId = ctx.chat?.id;
			const userId = ctx.from?.id;
			if (!chatId || !userId) return;

			const key = this.sessionKey(chatType, chatId, userId);
			this.clearSession(key);

			const scope =
				chatType === "group" || chatType === "supergroup"
					? "group conversation"
					: "conversation";
			ctx.reply(`✅ ${scope[0].toUpperCase() + scope.slice(1)} cleared! Start fresh with your next message.`);
		});

		this.bot.command("help", (ctx) => {
			const isGroup = ctx.chat?.type !== "private";
			const mention = ctx.botInfo?.username
				? `@${ctx.botInfo.username}`
				: "me";
			ctx.reply(
				`*Commands:*\n` +
					`/clear — Reset conversation history\n` +
					`/help  — Show this help\n\n` +
					(isGroup ? `*Usage:* Tag ${mention} or reply to my messages.\n\n` : "") +
					`*Examples:*\n` +
					`• "What's the weather in Lagos?"\n` +
					`• "Send a tweet: Hello world!"\n` +
					`• "Send a message to Discord channel 123 saying hello"\n` +
					`• "Post on my Facebook page 456: New product launch!"\n` +
					`• "Search Twitter for AI news"`,
				{ parse_mode: "Markdown" },
			);
		});

		this.bot.on("text", async (ctx) => {
			const chatType = ctx.chat?.type as ChatType;
			const chatId = ctx.chat?.id;
			const userId = ctx.from?.id;
			if (!chatId || !userId) return;

			const botUsername = ctx.botInfo?.username ?? "";
			const botId = ctx.botInfo?.id ?? 0;
			const rawText = ctx.message.text;
			const replyToUserId = ctx.message.reply_to_message?.from?.id;

			// In groups, only respond when @mentioned or replied to
			if (
				!this.shouldRespond(
					chatType,
					rawText,
					botUsername,
					replyToUserId,
					botId,
				)
			) {
				return;
			}

			// Strip @mention so Gemini sees a clean request
			const userMessage = this.stripMention(rawText, botUsername);
			if (!userMessage) return;

			// In groups prefix with sender name so Gemini knows who's talking
			const isGroup = chatType === "group" || chatType === "supergroup";
			const senderName = ctx.from?.first_name ?? "User";
			const messageForAgent = isGroup
				? `[${senderName}]: ${userMessage}`
				: userMessage;

			const key = this.sessionKey(chatType, chatId, userId);

			try {
				await ctx.sendChatAction("typing");

				const agent = this.getOrCreateSession(key);
				const reply = await agent.sendMessage(messageForAgent);

				// Try Markdown, fall back to plain text on parse error
				try {
					await ctx.reply(reply, { parse_mode: "Markdown" });
				} catch {
					await ctx.reply(reply);
				}
			} catch (error) {
				console.error(
					`[Telegram] Error (chat ${chatId}, user ${userId}):`,
					error,
				);
				const errMsg =
					error instanceof Error ? error.message : "Unknown error";
				await ctx.reply(
					`❌ Something went wrong: ${errMsg}\n\nTry /clear to reset.`,
				);
			}
		});
	}

	// ── Lifecycle ─────────────────────────────────────────────────────────────

	async start(): Promise<void> {
		console.log(`🤖 Starting Telegram bot (PID: ${process.pid})...`);
		// dropPendingUpdates: discard any messages that arrived while the bot was offline
		await this.bot.launch({ dropPendingUpdates: true });
		const username = this.bot.botInfo?.username;
		console.log(`✅ Bot @${username ?? "unknown"} running (PID: ${process.pid})`);
		console.log(`   DMs    : always responds`);
		console.log(`   Groups : responds when @${username ?? "mentioned"} or replied to`);
		console.log(`   If you see duplicate replies, kill other instances: pkill -f "index.js"`);
	}

	stop(): void {
		this.bot.stop("SIGINT");
	}
}
