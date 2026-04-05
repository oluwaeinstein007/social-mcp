import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { getTelegramService } from "../../services/telegram-service.js";

const forwardMessageParams = z.object({
	fromChatId: z
		.union([z.string(), z.number()])
		.describe("Source chat ID or username"),
	toChatId: z
		.union([z.string(), z.number()])
		.describe("Destination chat ID or username"),
	messageId: z.number().describe("ID of the message to forward"),
});

type ForwardMessageParams = z.infer<typeof forwardMessageParams>;

export const forwardMessageTool = {
	name: "TELEGRAM_FORWARD_MESSAGE",
	description: "Forward a message from one Telegram chat to another",
	parameters: forwardMessageParams,
	execute: async (params: ForwardMessageParams) => {
		try {
			const info = await getTelegramService().forwardMessage(
				params.fromChatId,
				params.toChatId,
				params.messageId,
			);
			return `Message forwarded successfully!\n\nNew Message ID: ${info.messageId}\nDestination Chat ID: ${info.chatId}\nForwarded at: ${new Date(info.date * 1000).toISOString()}`;
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error forwarding message: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
