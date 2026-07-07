import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { getSlackService } from "../../services/slack-service.js";

const sendMessageParams = z.object({
	channelId: z.string().describe("The Slack channel ID or name"),
	text: z.string().min(1).describe("The message text to send"),
	attachments: z
		.array(
			z.object({
				filename: z.string().describe("Attachment file name."),
				content: z.string().describe("Base64-encoded file contents."),
			}),
		)
		.optional()
		.describe(
			"Files to upload. When present, `text` becomes the initial comment on the first file.",
		),
});

type SendMessageParams = z.infer<typeof sendMessageParams>;

export const sendMessageTool = {
	name: "SEND_SLACK_MESSAGE",
	description:
		"Send a message to a Slack channel, optionally with file attachments",
	parameters: sendMessageParams,
	execute: async (params: SendMessageParams) => {
		try {
			const message = await getSlackService().sendMessage(
				params.channelId,
				params.text,
				params.attachments,
			);
			return `Message sent successfully to Slack channel ${message.channelId}!\n\nMessage ID: ${message.messageId}\nContent: ${message.text}`;
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error sending message: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
