import { Telegraf } from "telegraf";
import { CredentialsError } from "../lib/errors.js";
import { createProxyAgent } from "../lib/proxy.js";

export interface TelegramCredentials {
	botToken: string;
	/** Routes API calls through this proxy (e.g. per-tenant IP isolation). */
	proxyUrl?: string;
}

// Telegram truncates/rejects captions over 1024 chars, so a photo/document with a
// long caption is sent without one and followed by a plain text message instead —
// otherwise the API call would fail outright rather than just dropping the caption.
const MAX_CAPTION_LENGTH = 1024;

function isHttpUrl(value: string): boolean {
	return value.startsWith("http://") || value.startsWith("https://");
}

export interface ChannelInfo {
	id: number;
	title: string;
	username?: string;
	description?: string;
	memberCount?: number;
	type: string;
}

export interface MessageInfo {
	messageId: number;
	chatId: number;
	text?: string;
	date: number;
}

export class TelegramService {
	private bot: Telegraf;

	constructor(credentials?: TelegramCredentials) {
		const botToken = credentials?.botToken ?? process.env.TELEGRAM_BOT_TOKEN;
		if (!botToken) {
			throw new CredentialsError("Telegram", ["TELEGRAM_BOT_TOKEN"]);
		}
		const agent = createProxyAgent(credentials?.proxyUrl);
		this.bot = new Telegraf(
			botToken,
			agent ? { telegram: { agent } } : undefined,
		);
	}

	// Accepts a public URL or base64-encoded bytes. Splits into photo + follow-up
	// message when the caption is too long instead of letting the API call fail.
	async sendPhoto(
		chatId: string | number,
		photo: string,
		filename?: string,
		caption?: string,
	): Promise<MessageInfo> {
		try {
			const source = isHttpUrl(photo)
				? photo
				: { source: Buffer.from(photo, "base64"), filename };
			const fitsCaption = !caption || caption.length <= MAX_CAPTION_LENGTH;
			const message = await this.bot.telegram.sendPhoto(chatId, source, {
				caption: fitsCaption ? caption : undefined,
			});
			if (caption && !fitsCaption) {
				await this.bot.telegram.sendMessage(chatId, caption, {
					reply_parameters: { message_id: message.message_id },
				});
			}
			return {
				messageId: message.message_id,
				chatId: message.chat.id,
				date: message.date,
			};
		} catch (error) {
			throw new Error(
				`Failed to send photo: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	}

	async sendDocument(
		chatId: string | number,
		document: string,
		filename?: string,
		caption?: string,
	): Promise<MessageInfo> {
		try {
			const source = isHttpUrl(document)
				? document
				: { source: Buffer.from(document, "base64"), filename };
			const fitsCaption = !caption || caption.length <= MAX_CAPTION_LENGTH;
			const message = await this.bot.telegram.sendDocument(chatId, source, {
				caption: fitsCaption ? caption : undefined,
			});
			if (caption && !fitsCaption) {
				await this.bot.telegram.sendMessage(chatId, caption, {
					reply_parameters: { message_id: message.message_id },
				});
			}
			return {
				messageId: message.message_id,
				chatId: message.chat.id,
				date: message.date,
			};
		} catch (error) {
			throw new Error(
				`Failed to send document: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	}

	async sendMessage(
		chatId: string | number,
		text: string,
	): Promise<MessageInfo> {
		try {
			const message = await this.bot.telegram.sendMessage(chatId, text);
			return {
				messageId: message.message_id,
				chatId: message.chat.id,
				text: message.text,
				date: message.date,
			};
		} catch (error) {
			throw new Error(
				`Failed to send message: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	}

	async editMessage(
		chatId: string | number,
		messageId: number,
		text: string,
	): Promise<MessageInfo> {
		try {
			const message = await this.bot.telegram.editMessageText(
				chatId,
				messageId,
				undefined,
				text,
			);
			if (typeof message === "boolean") {
				throw new Error("Edit returned unexpected boolean response");
			}
			return {
				messageId: message.message_id,
				chatId: message.chat.id,
				text: "text" in message ? message.text : undefined,
				date: message.date,
			};
		} catch (error) {
			throw new Error(
				`Failed to edit message: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	}

	async deleteMessage(
		chatId: string | number,
		messageId: number,
	): Promise<boolean> {
		try {
			await this.bot.telegram.deleteMessage(chatId, messageId);
			return true;
		} catch (error) {
			throw new Error(
				`Failed to delete message: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	}

	async getChannelInfo(channelId: string | number): Promise<ChannelInfo> {
		try {
			const chat = await this.bot.telegram.getChat(channelId);
			const memberCount =
				await this.bot.telegram.getChatMembersCount(channelId);
			return {
				id: chat.id,
				title: "title" in chat ? chat.title : "Private Chat",
				username: "username" in chat ? chat.username : undefined,
				description: "description" in chat ? chat.description : undefined,
				memberCount,
				type: chat.type,
			};
		} catch (error) {
			throw new Error(
				`Failed to get channel info: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	}

	async forwardMessage(
		fromChatId: string | number,
		toChatId: string | number,
		messageId: number,
	): Promise<MessageInfo> {
		try {
			const message = await this.bot.telegram.forwardMessage(
				toChatId,
				fromChatId,
				messageId,
			);
			return {
				messageId: message.message_id,
				chatId: message.chat.id,
				date: message.date,
			};
		} catch (error) {
			throw new Error(
				`Failed to forward message: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	}

	async pinMessage(
		chatId: string | number,
		messageId: number,
	): Promise<boolean> {
		try {
			await this.bot.telegram.pinChatMessage(chatId, messageId);
			return true;
		} catch (error) {
			throw new Error(
				`Failed to pin message: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	}

	async getChannelMembers(
		channelId: string | number,
		limit = 10,
	): Promise<
		Array<{
			userId: number;
			username?: string;
			firstName?: string;
			lastName?: string;
			status: string;
		}>
	> {
		try {
			const administrators =
				await this.bot.telegram.getChatAdministrators(channelId);
			return administrators.slice(0, limit).map((member) => ({
				userId: member.user.id,
				username: member.user.username,
				firstName: member.user.first_name,
				lastName: member.user.last_name,
				status: member.status,
			}));
		} catch (error) {
			throw new Error(
				`Failed to get channel members: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	}
}

let _instance: TelegramService | undefined;
export function getTelegramService(): TelegramService {
	if (!_instance) _instance = new TelegramService();
	return _instance;
}
