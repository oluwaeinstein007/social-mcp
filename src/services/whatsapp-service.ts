import { z } from "zod";
import { config } from "../lib/config.js";
import { CredentialsError } from "../lib/errors.js";
import { fetchJson } from "../lib/http.js";
import { createProxyDispatcher } from "../lib/proxy.js";

const whatsappMessageSchema = z.object({
	messaging_product: z.string(),
	contacts: z.array(z.object({ input: z.string(), wa_id: z.string() })),
	messages: z.array(z.object({ id: z.string() })),
});

const whatsappMediaUploadSchema = z.object({
	id: z.string(),
});

export interface WhatsappCredentials {
	accessToken: string;
	phoneNumberId: string;
	proxyUrl?: string;
}

export interface WhatsappMedia {
	/** Public media URL, or base64-encoded bytes (uploaded first, then referenced by ID). */
	media: string;
	contentType?: string;
	filename?: string;
}

function isHttpUrl(value: string): boolean {
	return value.startsWith("http://") || value.startsWith("https://");
}

export class WhatsappService {
	private baseUrl = config.whatsapp.baseUrl;
	private phoneNumberId: string;
	private headers: Record<string, string>;
	private dispatcher?: ReturnType<typeof createProxyDispatcher>;

	constructor(credentials?: WhatsappCredentials) {
		const accessToken = credentials?.accessToken ?? config.whatsapp.accessToken;
		const phoneNumberId =
			credentials?.phoneNumberId ?? config.whatsapp.phoneNumberId;
		const missing: string[] = [];
		if (!accessToken) missing.push("WHATSAPP_ACCESS_TOKEN");
		if (!phoneNumberId) missing.push("WHATSAPP_PHONE_NUMBER_ID");
		if (missing.length > 0) {
			throw new CredentialsError("WhatsApp", missing);
		}
		this.phoneNumberId = phoneNumberId;
		this.headers = {
			"Content-Type": "application/json",
			Authorization: `Bearer ${accessToken}`,
		};
		this.dispatcher = createProxyDispatcher(credentials?.proxyUrl);
	}

	// Base64 media must be uploaded to WhatsApp's own media store first — messages
	// reference it by the returned media ID, they can't carry bytes inline.
	private async uploadMedia(
		content: string,
		contentType: string,
		filename?: string,
	): Promise<string> {
		const formData = new FormData();
		formData.append("messaging_product", "whatsapp");
		const buffer = Buffer.from(content, "base64");
		formData.append(
			"file",
			new Blob([buffer], { type: contentType }),
			filename ?? "file",
		);

		const response = await fetch(
			`${this.baseUrl}/${this.phoneNumberId}/media`,
			{
				method: "POST",
				headers: { Authorization: this.headers.Authorization ?? "" },
				body: formData,
				dispatcher: this.dispatcher,
			} as RequestInit,
		);
		if (!response.ok) {
			throw new Error(
				`WhatsApp media upload error (${response.status}): ${await response.text()}`,
			);
		}
		return whatsappMediaUploadSchema.parse(await response.json()).id;
	}

	async sendMessage(
		to: string,
		text: string,
		media?: WhatsappMedia,
		mediaKind: "image" | "video" | "document" = "image",
	) {
		if (!to) {
			throw new Error("'to' parameter is required");
		}
		if (!/^\+?[1-9]\d{1,14}$/.test(to)) {
			throw new Error("Invalid phone number format");
		}

		let body: Record<string, unknown>;
		if (media) {
			const ref = isHttpUrl(media.media)
				? { link: media.media }
				: {
						id: await this.uploadMedia(
							media.media,
							media.contentType ?? "application/octet-stream",
							media.filename,
						),
					};
			// WhatsApp truncates/rejects media captions over 1024 chars — trimmed here
			// rather than letting the send fail outright, matching how Telegram/WhatsApp's
			// own text message limit (4096) is handled by the API itself.
			const caption = text.length > 1024 ? `${text.slice(0, 1023)}…` : text;
			body = {
				messaging_product: "whatsapp",
				to,
				type: mediaKind,
				[mediaKind]: {
					...ref,
					...(mediaKind === "document"
						? { caption, filename: media.filename }
						: { caption }),
				},
			};
		} else {
			if (!text)
				throw new Error("'text' is required when no media is provided");
			body = {
				messaging_product: "whatsapp",
				to,
				type: "text",
				text: { body: text },
			};
		}

		return fetchJson(
			`${this.baseUrl}/${this.phoneNumberId}/messages`,
			{
				method: "POST",
				headers: this.headers,
				body: JSON.stringify(body),
				dispatcher: this.dispatcher,
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
