import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { getSlackService } from "../../services/slack-service.js";

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
		try {
			const message = await getSlackService().sendMessage(
				params.channelId,
				params.text,
			);
			return `Message sent successfully to Slack channel ${message.channelId}!\n\nMessage ID: ${message.messageId}\nContent: ${message.text}`;
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error sending message: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
