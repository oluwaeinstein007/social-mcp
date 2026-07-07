import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { getTelegramService } from "../../services/telegram-service.js";

const sendPhotoParams = z.object({
	chatId: z
		.union([z.string(), z.number()])
		.describe(
			"The chat ID or channel username (e.g., @channelname or -1001234567890)",
		),
	photo: z
		.string()
		.describe("A public image URL, or base64-encoded image bytes."),
	filename: z
		.string()
		.optional()
		.describe("Filename to use when `photo` is base64-encoded bytes."),
	caption: z.string().optional().describe("Optional caption for the photo."),
});

type SendPhotoParams = z.infer<typeof sendPhotoParams>;

export const sendPhotoTool = {
	name: "TELEGRAM_SEND_PHOTO",
	description:
		"Send a photo to a Telegram chat or channel, from a public URL or base64-encoded bytes. Captions over 1024 characters are sent as a separate follow-up message.",
	parameters: sendPhotoParams,
	execute: async (params: SendPhotoParams) => {
		try {
			const messageInfo = await getTelegramService().sendPhoto(
				params.chatId,
				params.photo,
				params.filename,
				params.caption,
			);
			return `Photo sent successfully!\n\nMessage ID: ${messageInfo.messageId}\nChat ID: ${messageInfo.chatId}\nSent at: ${new Date(messageInfo.date * 1000).toISOString()}`;
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error sending photo: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
