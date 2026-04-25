import { WebClient } from "@slack/web-api";
import { CredentialsError } from "../lib/errors.js";

export interface SlackCredentials {
	botToken: string;
}

export class SlackService {
	private web: WebClient;

	constructor(credentials?: SlackCredentials) {
		const token = credentials?.botToken ?? process.env.SLACK_BOT_TOKEN;
		if (!token) {
			throw new CredentialsError("Slack", ["SLACK_BOT_TOKEN"]);
		}
		this.web = new WebClient(token);
	}

	async sendMessage(channelId: string, text: string) {
		const result = await this.web.chat.postMessage({
			channel: channelId,
			text,
		});
		if (!result.ok) {
			throw new Error(`Slack API error: ${result.error ?? "unknown error"}`);
		}
		return {
			messageId: result.ts,
			channelId: result.channel,
			text,
		};
	}

	async getMessages(channelId: string, limit = 50) {
		const result = await this.web.conversations.history({
			channel: channelId,
			limit,
		});
		if (!result.ok) {
			throw new Error(`Slack API error: ${result.error ?? "unknown error"}`);
		}
		return (result.messages ?? []).map((msg) => ({
			ts: msg.ts,
			userId: msg.user,
			text: msg.text,
		}));
	}

	async listChannels(limit = 100) {
		const result = await this.web.conversations.list({ limit });
		if (!result.ok) {
			throw new Error(`Slack API error: ${result.error ?? "unknown error"}`);
		}
		return (result.channels ?? []).map((ch) => ({
			id: ch.id,
			name: ch.name,
			isPrivate: ch.is_private,
			memberCount: ch.num_members,
		}));
	}
}

let _instance: SlackService | undefined;
export function getSlackService(): SlackService {
	if (!_instance) _instance = new SlackService();
	return _instance;
}
