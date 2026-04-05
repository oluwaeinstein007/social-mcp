import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { getSlackService } from "../../services/slack-service.js";

const getMessagesParams = z.object({
	channelId: z.string().describe("The Slack channel ID"),
	limit: z
		.number()
		.int()
		.min(1)
		.max(999)
		.default(50)
		.describe("Number of messages to retrieve (1-999)"),
});

type GetMessagesParams = z.infer<typeof getMessagesParams>;

export const getMessagesTool = {
	name: "GET_SLACK_MESSAGES",
	description: "Retrieve recent messages from a Slack channel",
	parameters: getMessagesParams,
	execute: async (params: GetMessagesParams) => {
		try {
			const messages = await getSlackService().getMessages(
				params.channelId,
				params.limit,
			);
			if (messages.length === 0) {
				return "No messages found in this channel.";
			}
			const list = messages
				.map((m) => `[${m.ts}] ${m.userId ?? "unknown"}: ${m.text ?? ""}`)
				.join("\n");
			return `Retrieved ${messages.length} message(s) from channel ${params.channelId}:\n\n${list}`;
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error retrieving messages: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
