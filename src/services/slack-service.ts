import { WebClient } from "@slack/web-api";
import { CredentialsError } from "../lib/errors.js";
import { createProxyAgent } from "../lib/proxy.js";

export interface SlackFileAttachment {
	filename: string;
	/** Base64-encoded file contents. */
	content: string;
}

export interface SlackCredentials {
	botToken: string;
	/** Routes API calls through this proxy (e.g. per-tenant IP isolation). */
	proxyUrl?: string;
}

export class SlackService {
	private web: WebClient;

	constructor(credentials?: SlackCredentials) {
		const token = credentials?.botToken ?? process.env.SLACK_BOT_TOKEN;
		if (!token) {
			throw new CredentialsError("Slack", ["SLACK_BOT_TOKEN"]);
		}
		this.web = new WebClient(token, {
			agent: createProxyAgent(credentials?.proxyUrl),
		});
	}

	async sendMessage(
		channelId: string,
		text: string,
		attachments?: SlackFileAttachment[],
		options?: {
			/** Block Kit layout blocks — see https://api.slack.com/block-kit. `text` is still sent as the fallback/notification text. Validated server-side by Slack. */
			blocks?: Record<string, unknown>[];
			/** Reply in-thread under this parent message's ts, instead of posting a new top-level message. */
			threadTs?: string;
		},
	) {
		if (attachments && attachments.length > 0) {
			const [first, ...rest] = attachments as [
				SlackFileAttachment,
				...SlackFileAttachment[],
			];
			const uploaded = await this.web.filesUploadV2({
				channel_id: channelId,
				file: Buffer.from(first.content, "base64"),
				filename: first.filename,
				initial_comment: text,
				thread_ts: options?.threadTs,
			} as never);
			for (const attachment of rest) {
				await this.web.filesUploadV2({
					channel_id: channelId,
					file: Buffer.from(attachment.content, "base64"),
					filename: attachment.filename,
					thread_ts: options?.threadTs,
				} as never);
			}
			return { messageId: undefined, channelId, text, files: uploaded.files };
		}

		const result = await this.web.chat.postMessage({
			channel: channelId,
			text,
			blocks: options?.blocks as never,
			thread_ts: options?.threadTs,
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
