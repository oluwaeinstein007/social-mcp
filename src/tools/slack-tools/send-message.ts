import dedent from "dedent";
import { z } from "zod";
import { SlackService } from "../../services/slack-service.js";

const sendMessageParams = z.object({
	channelId: z.string().describe("The Slack channel ID or name"),
	text: z.string().min(1).describe("The message text to send"),
});

type SendMessageParams = z.infer<typeof sendMessageParams>;

export const sendMessageTool = {
	name: "SEND_SLACK_MESSAGE",
	description: "Send a message to a Slack channel",
	parameters: sendMessageParams,
	execute: async (params: SendMessageParams) => {
		const slackService = new SlackService();

		try {
			const message = await slackService.sendMessage(
				params.channelId,
				params.text,
			);

			return dedent`
				Message sent successfully to Slack channel ${message.channelId}!

				Message ID: ${message.messageId}
				Content: ${message.text}
			`;
		} catch (error) {
			if (error instanceof Error) {
				if (error.message.includes("SLACK_BOT_TOKEN")) {
					return "Error: Slack bot token is not configured. Please set the SLACK_BOT_TOKEN environment variable.";
				}
				return `Error sending message: ${error.message}`;
			}
			return "An unknown error occurred while sending the message";
		}
	},
} as const;
