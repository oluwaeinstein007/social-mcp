import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { getTelegramService } from "../../services/telegram-service.js";

const sendMessageParams = z.object({
	chatId: z
		.union([z.string(), z.number()])
		.describe(
			"The chat ID or channel username (e.g., @channelname or -1001234567890)",
		),
	text: z.string().min(1).describe("The message text to send"),
});

type SendMessageParams = z.infer<typeof sendMessageParams>;

export const sendMessageTool = {
	name: "TELEGRAM_SEND_MESSAGE",
	description: "Send a message to a Telegram chat or channel",
	parameters: sendMessageParams,
	execute: async (params: SendMessageParams) => {
		try {
			const messageInfo = await getTelegramService().sendMessage(
				params.chatId,
				params.text,
			);
			return `Message sent successfully!\n\nMessage ID: ${messageInfo.messageId}\nChat ID: ${messageInfo.chatId}\nSent at: ${new Date(messageInfo.date * 1000).toISOString()}\nText: ${messageInfo.text ?? "N/A"}`;
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error sending message: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
