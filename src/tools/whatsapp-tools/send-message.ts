import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { getWhatsappService } from "../../services/whatsapp-service.js";

const sendMessageParams = z.object({
	to: z
		.string()
		.describe("Recipient phone number in E.164 format (e.g. +2348012345678)"),
	text: z
		.string()
		.optional()
		.describe("The message text, or caption when media is attached."),
	media: z
		.string()
		.optional()
		.describe("A public media URL, or base64-encoded bytes."),
	mediaKind: z
		.enum(["image", "video", "document"])
		.optional()
		.default("image")
		.describe("Media type, used when `media` is set."),
	mediaContentType: z
		.string()
		.optional()
		.describe("MIME type, required when `media` is base64-encoded bytes."),
	mediaFilename: z
		.string()
		.optional()
		.describe("Filename, used for document messages or base64 uploads."),
});

type SendMessageParams = z.infer<typeof sendMessageParams>;

export const sendMessageTool = {
	name: "SEND_WHATSAPP_MESSAGE",
	description:
		"Send a WhatsApp message to a phone number, optionally with an image, video, or document",
	parameters: sendMessageParams,
	execute: async (params: SendMessageParams) => {
		try {
			const message = await getWhatsappService().sendMessage(
				params.to,
				params.text ?? "",
				params.media
					? {
							media: params.media,
							contentType: params.mediaContentType,
							filename: params.mediaFilename,
						}
					: undefined,
				params.mediaKind,
			);
			return `Message sent successfully via WhatsApp!\n\nMessage ID: ${message.messages[0].id}\nRecipient: ${message.contacts[0].input}`;
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error sending message: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
