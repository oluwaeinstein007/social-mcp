import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { getTelegramService } from "../../services/telegram-service.js";

const pinMessageParams = z.object({
	chatId: z
		.union([z.string(), z.number()])
		.describe("The chat ID or channel username"),
	messageId: z.number().describe("ID of the message to pin"),
	disableNotification: z.boolean().optional().describe("Pin message silently"),
});

type PinMessageParams = z.infer<typeof pinMessageParams>;

export const pinMessageTool = {
	name: "TELEGRAM_PIN_MESSAGE",
	description: "Pin a message in a Telegram chat or channel",
	parameters: pinMessageParams,
	execute: async (params: PinMessageParams) => {
		try {
			await getTelegramService().pinMessage(params.chatId, params.messageId);
			return `Message pinned successfully!\n\nChat ID: ${params.chatId}\nMessage ID: ${params.messageId}\nSilent: ${params.disableNotification ? "Yes" : "No"}`;
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error pinning message: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
