import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { getDiscordService } from "../../services/discord-service.js";

const getMessagesParams = z.object({
	channelId: z.string().describe("The ID of the Discord channel"),
	limit: z
		.number()
		.int()
		.min(1)
		.max(100)
		.default(50)
		.describe("Number of messages to retrieve (1-100)"),
});

type GetMessagesParams = z.infer<typeof getMessagesParams>;

export const getMessagesTool = {
	name: "GET_DISCORD_MESSAGES",
	description: "Retrieve recent messages from a Discord channel",
	parameters: getMessagesParams,
	execute: async (params: GetMessagesParams) => {
		try {
			const messages = await getDiscordService().getMessages(
				params.channelId,
				params.limit,
			);
			if (messages.length === 0) {
				return "No messages found in this channel.";
			}
			const list = messages
				.map((m) => `[${m.timestamp}] ID: ${m.id}\n${m.content}`)
				.join("\n\n");
			return `Retrieved ${messages.length} message(s) from channel ${params.channelId}:\n\n${list}`;
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error retrieving messages: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
