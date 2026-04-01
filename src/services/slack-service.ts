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
		try {
			const result = await this.web.chat.postMessage({
				channel: channelId,
				text: text,
			});
			// The result object from Slack's API has a 'ts' field which is the message timestamp (ID)
			// and 'channel' field which is the channel ID.
			return {
				messageId: result.ts,
				channelId: result.channel,
				text: text,
			};
		} catch (error) {
			console.error("Error sending Slack message:", error);
			throw error; // Re-throw to be caught by the tool's execute function
		}
	}

	// Add other Slack methods here as needed (e.g., getUserInfo, etc.)
}
