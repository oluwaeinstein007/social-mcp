import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { getTelegramService } from "../../services/telegram-service.js";

const sendDocumentParams = z.object({
	chatId: z
		.union([z.string(), z.number()])
		.describe(
			"The chat ID or channel username (e.g., @channelname or -1001234567890)",
		),
	document: z
		.string()
		.describe("A public file URL, or base64-encoded file bytes."),
	filename: z
		.string()
		.optional()
		.describe("Filename to use when `document` is base64-encoded bytes."),
	caption: z.string().optional().describe("Optional caption for the document."),
});

type SendDocumentParams = z.infer<typeof sendDocumentParams>;

export const sendDocumentTool = {
	name: "TELEGRAM_SEND_DOCUMENT",
	description:
		"Send a file/document to a Telegram chat or channel, from a public URL or base64-encoded bytes. Captions over 1024 characters are sent as a separate follow-up message.",
	parameters: sendDocumentParams,
	execute: async (params: SendDocumentParams) => {
		try {
			const messageInfo = await getTelegramService().sendDocument(
				params.chatId,
				params.document,
				params.filename,
				params.caption,
			);
			return `Document sent successfully!\n\nMessage ID: ${messageInfo.messageId}\nChat ID: ${messageInfo.chatId}\nSent at: ${new Date(messageInfo.date * 1000).toISOString()}`;
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error sending document: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
