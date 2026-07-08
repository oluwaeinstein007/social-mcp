import { z } from "zod";
import { config } from "../lib/config.js";
import { CredentialsError } from "../lib/errors.js";
import { fetchJson } from "../lib/http.js";
import { createProxyDispatcher } from "../lib/proxy.js";

const discordAttachmentSchema = z.object({
	id: z.string(),
	filename: z.string(),
	url: z.string(),
	content_type: z.string().optional(),
	size: z.number().optional(),
});

const discordMessageSchema = z.object({
	id: z.string(),
	channel_id: z.string(),
	content: z.string(),
	timestamp: z.string(),
	attachments: z.array(discordAttachmentSchema).optional(),
});

const discordMessagesSchema = z.array(discordMessageSchema);

export interface DiscordFileAttachment {
	filename: string;
	/** Base64-encoded file contents. */
	content: string;
	contentType?: string;
}

/** Discord's rich embed object — https://discord.com/developers/docs/resources/channel#embed-object */
export interface DiscordEmbed {
	title?: string;
	description?: string;
	url?: string;
	/** Decimal color value, e.g. 0xff5733. */
	color?: number;
	fields?: Array<{ name: string; value: string; inline?: boolean }>;
	image?: { url: string };
	thumbnail?: { url: string };
	footer?: { text: string; icon_url?: string };
	author?: { name: string; url?: string; icon_url?: string };
}

export interface DiscordCredentials {
	botToken: string;
	/** Routes API calls through this proxy (e.g. per-tenant IP isolation). */
	proxyUrl?: string;
}

export class DiscordService {
	private baseUrl = config.discord.baseUrl;
	private headers: Record<string, string>;
	private dispatcher?: ReturnType<typeof createProxyDispatcher>;

	constructor(credentials?: DiscordCredentials) {
		const botToken = credentials?.botToken ?? config.discord.botToken;
		if (!botToken) {
			throw new CredentialsError("Discord", ["DISCORD_BOT_TOKEN"]);
		}
		this.headers = {
			"Content-Type": "application/json",
			Authorization: `Bot ${botToken}`,
		};
		this.dispatcher = createProxyDispatcher(credentials?.proxyUrl);
	}

	async sendMessage(
		channelId: string,
		content: string,
		attachments?: DiscordFileAttachment[],
		embeds?: DiscordEmbed[],
	) {
		if (!attachments?.length) {
			return fetchJson(
				`${this.baseUrl}/channels/${channelId}/messages`,
				{
					method: "POST",
					headers: this.headers,
					body: JSON.stringify({ content, ...(embeds?.length ? { embeds } : {}) }),
					dispatcher: this.dispatcher,
				},
				discordMessageSchema,
			);
		}

		// Attachments require multipart/form-data — a JSON body can't carry file bytes.
		// payload_json + files[n] is Discord's documented shape for this.
		const formData = new FormData();
		formData.append(
			"payload_json",
			JSON.stringify({
				content,
				...(embeds?.length ? { embeds } : {}),
				attachments: attachments.map((attachment, index) => ({
					id: index,
					filename: attachment.filename,
				})),
			}),
		);
		attachments.forEach((attachment, index) => {
			const buffer = Buffer.from(attachment.content, "base64");
			formData.append(
				`files[${index}]`,
				new Blob([buffer], {
					type: attachment.contentType || "application/octet-stream",
				}),
				attachment.filename,
			);
		});

		const response = await fetch(
			`${this.baseUrl}/channels/${channelId}/messages`,
			{
				method: "POST",
				headers: { Authorization: this.headers.Authorization ?? "" },
				body: formData,
				dispatcher: this.dispatcher,
			} as RequestInit,
		);
		if (!response.ok) {
			throw new Error(
				`Discord API error (${response.status}): ${await response.text()}`,
			);
		}
		return discordMessageSchema.parse(await response.json());
	}

	async getMessages(channelId: string, limit = 50) {
		return fetchJson(
			`${this.baseUrl}/channels/${channelId}/messages?limit=${limit}`,
			{
				method: "GET",
				headers: this.headers,
				dispatcher: this.dispatcher,
			},
			discordMessagesSchema,
		);
	}
}

let _instance: DiscordService | undefined;
export function getDiscordService(): DiscordService {
	if (!_instance) _instance = new DiscordService();
	return _instance;
}
