import { z } from "zod";
import { config } from "../lib/config.js";
import { CredentialsError } from "../lib/errors.js";
import { fetchJson } from "../lib/http.js";

const whatsappMessageSchema = z.object({
	messaging_product: z.string(),
	contacts: z.array(z.object({ input: z.string(), wa_id: z.string() })),
	messages: z.array(z.object({ id: z.string() })),
});

export class WhatsappService {
	private baseUrl = config.whatsapp.baseUrl;
	private phoneNumberId = config.whatsapp.phoneNumberId;
	private headers: Record<string, string>;

	constructor() {
		const missing: string[] = [];
		if (!config.whatsapp.accessToken) missing.push("WHATSAPP_ACCESS_TOKEN");
		if (!config.whatsapp.phoneNumberId) missing.push("WHATSAPP_PHONE_NUMBER_ID");
		if (missing.length > 0) {
			throw new CredentialsError("WhatsApp", missing);
		}
		this.headers = {
			"Content-Type": "application/json",
			Authorization: `Bearer ${config.whatsapp.accessToken}`,
		};
	}

	async sendMessage(to: string, text: string) {
		if (!to || !text) {
			throw new Error("Both 'to' and 'text' parameters are required");
		}
		if (!/^\+?[1-9]\d{1,14}$/.test(to)) {
			throw new Error("Invalid phone number format");
		}
		const body = {
			messaging_product: "whatsapp",
			to,
			type: "text",
			text: { body: text },
		};
		return fetchJson(
			`${this.baseUrl}/${this.phoneNumberId}/messages`,
			{
				method: "POST",
				headers: this.headers,
				body: JSON.stringify(body),
			},
			whatsappMessageSchema,
		);
	}
}

let _instance: WhatsappService | undefined;
export function getWhatsappService(): WhatsappService {
	if (!_instance) _instance = new WhatsappService();
	return _instance;
}
