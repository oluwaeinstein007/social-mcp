import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { getWhatsappService } from "../../services/whatsapp-service.js";

const sendMessageParams = z.object({
	to: z
		.string()
		.describe("Recipient phone number in E.164 format (e.g. +2348012345678)"),
	text: z.string().min(1).describe("The message text to send"),
});

type SendMessageParams = z.infer<typeof sendMessageParams>;

export const sendMessageTool = {
	name: "SEND_WHATSAPP_MESSAGE",
	description: "Send a WhatsApp message to a phone number",
	parameters: sendMessageParams,
	execute: async (params: SendMessageParams) => {
		try {
			const message = await getWhatsappService().sendMessage(
				params.to,
				params.text,
			);
			return `Message sent successfully via WhatsApp!\n\nMessage ID: ${message.messages[0].id}\nRecipient: ${message.contacts[0].input}`;
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error sending message: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
