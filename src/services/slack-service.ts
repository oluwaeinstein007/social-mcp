import { WebClient } from "@slack/web-api";

export class SlackService {
	private web: WebClient;

	constructor() {
		const token = process.env.SLACK_BOT_TOKEN;
		if (!token) {
			throw new Error(
				"SLACK_BOT_TOKEN is not configured. Please set the SLACK_BOT_TOKEN environment variable.",
			);
		}
		this.web = new WebClient(token);
	}

	async sendMessage(channelId: string, text: string) {
		const result = await this.web.chat.postMessage({
			channel: channelId,
			text: text,
		});

		return {
			messageId: result.ts,
			channelId: result.channel,
			text: text,
		};
	}
}
