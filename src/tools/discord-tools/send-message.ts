import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { getDiscordService } from "../../services/discord-service.js";

const sendMessageParams = z.object({
	channelId: z.string().describe("The ID of the Discord channel"),
	content: z.string().min(1).describe("The message content to send"),
});

type SendMessageParams = z.infer<typeof sendMessageParams>;

export const sendMessageTool = {
	name: "SEND_DISCORD_MESSAGE",
	description: "Send a message to a Discord channel",
	parameters: sendMessageParams,
	execute: async (params: SendMessageParams) => {
		try {
			const message = await getDiscordService().sendMessage(
				params.channelId,
				params.content,
			);
			return `Message sent successfully to Discord channel ${message.channel_id}!\n\nMessage ID: ${message.id}\nContent: ${message.content}\nTimestamp: ${message.timestamp}`;
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error sending message: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
