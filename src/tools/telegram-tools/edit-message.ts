import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { getTelegramService } from "../../services/telegram-service.js";

const editMessageParams = z.object({
	chatId: z
		.union([z.string(), z.number()])
		.describe("The chat ID or channel username"),
	messageId: z.number().describe("ID of the message to edit"),
	text: z.string().min(1).describe("The new text for the message"),
});

type EditMessageParams = z.infer<typeof editMessageParams>;

export const editMessageTool = {
	name: "TELEGRAM_EDIT_MESSAGE",
	description: "Edit the text of a Telegram message",
	parameters: editMessageParams,
	execute: async (params: EditMessageParams) => {
		try {
			const info = await getTelegramService().editMessage(
				params.chatId,
				params.messageId,
				params.text,
			);
			return `Message edited successfully!\n\nMessage ID: ${info.messageId}\nChat ID: ${info.chatId}\nNew text: ${info.text ?? "N/A"}`;
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error editing message: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
