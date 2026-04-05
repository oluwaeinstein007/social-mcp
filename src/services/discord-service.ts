import { z } from "zod";
import { config } from "../lib/config.js";
import { CredentialsError } from "../lib/errors.js";
import { fetchJson } from "../lib/http.js";

const discordMessageSchema = z.object({
	id: z.string(),
	channel_id: z.string(),
	content: z.string(),
	timestamp: z.string(),
});

const discordMessagesSchema = z.array(discordMessageSchema);

export class DiscordService {
	private baseUrl = config.discord.baseUrl;
	private headers: Record<string, string>;

	constructor() {
		if (!config.discord.botToken) {
			throw new CredentialsError("Discord", ["DISCORD_BOT_TOKEN"]);
		}
		this.headers = {
			"Content-Type": "application/json",
			Authorization: `Bot ${config.discord.botToken}`,
		};
	}

	async sendMessage(channelId: string, content: string) {
		return fetchJson(
			`${this.baseUrl}/channels/${channelId}/messages`,
			{
				method: "POST",
				headers: this.headers,
				body: JSON.stringify({ content }),
			},
			discordMessageSchema,
		);
	}

	async getMessages(channelId: string, limit = 50) {
		return fetchJson(
			`${this.baseUrl}/channels/${channelId}/messages?limit=${limit}`,
			{
				method: "GET",
				headers: this.headers,
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
