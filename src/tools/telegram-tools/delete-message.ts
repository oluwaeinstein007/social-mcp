import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { getTelegramService } from "../../services/telegram-service.js";

const deleteMessageParams = z.object({
	chatId: z
		.union([z.string(), z.number()])
		.describe("The chat ID or channel username"),
	messageId: z.number().describe("ID of the message to delete"),
});

type DeleteMessageParams = z.infer<typeof deleteMessageParams>;

export const deleteMessageTool = {
	name: "TELEGRAM_DELETE_MESSAGE",
	description: "Delete a message in a Telegram chat or channel",
	parameters: deleteMessageParams,
	execute: async (params: DeleteMessageParams) => {
		try {
			await getTelegramService().deleteMessage(params.chatId, params.messageId);
			return `Message ${params.messageId} deleted successfully from chat ${params.chatId}.`;
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error deleting message: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
