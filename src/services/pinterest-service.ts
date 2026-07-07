import { z } from "zod";
import { config } from "../lib/config.js";
import { CredentialsError } from "../lib/errors.js";
import { fetchJson } from "../lib/http.js";
import { createProxyDispatcher } from "../lib/proxy.js";

const boardSchema = z.object({
	id: z.string(),
	name: z.string(),
	description: z.string().optional(),
	pin_count: z.number().optional(),
	created_at: z.string().optional(),
});

const boardListSchema = z.object({
	items: z.array(boardSchema),
});

const pinSchema = z.object({
	id: z.string(),
	title: z.string().optional(),
	description: z.string().optional(),
	link: z.string().optional(),
	board_id: z.string().optional(),
	created_at: z.string().optional(),
	media: z
		.object({
			images: z.record(z.string(), z.object({ url: z.string() })).optional(),
		})
		.optional(),
});

const pinListSchema = z.object({
	items: z.array(pinSchema),
});

export interface PinterestCredentials {
	accessToken: string;
	proxyUrl?: string;
}

export interface PinterestImage {
	/** A public image URL, or base64-encoded image bytes. */
	image: string;
	/** Required when `image` is base64-encoded bytes, e.g. "image/jpeg". */
	contentType?: string;
}

export class PinterestService {
	private baseUrl = config.pinterest.baseUrl;
	private headers: Record<string, string>;
	private dispatcher?: ReturnType<typeof createProxyDispatcher>;

	constructor(credentials?: PinterestCredentials) {
		const accessToken =
			credentials?.accessToken ?? config.pinterest.accessToken;
		if (!accessToken) {
			throw new CredentialsError("Pinterest", ["PINTEREST_ACCESS_TOKEN"]);
		}
		this.headers = {
			"Content-Type": "application/json",
			Authorization: `Bearer ${accessToken}`,
		};
		this.dispatcher = createProxyDispatcher(credentials?.proxyUrl);
	}

	async getBoards(pageSize = 25) {
		return fetchJson(
			`${this.baseUrl}/boards?page_size=${pageSize}`,
			{ method: "GET", headers: this.headers, dispatcher: this.dispatcher },
			boardListSchema,
		);
	}

	async createBoard(name: string, description?: string) {
		return fetchJson(
			`${this.baseUrl}/boards`,
			{
				method: "POST",
				headers: this.headers,
				body: JSON.stringify({ name, description }),
				dispatcher: this.dispatcher,
			},
			boardSchema,
		);
	}

	async createPin(
		boardId: string,
		title: string,
		description: string,
		link: string,
		image: PinterestImage,
	) {
		// Pinterest's v5 API accepts base64 image bytes directly in the pin body —
		// no separate upload step or asset registration needed, unlike most platforms.
		const mediaSource = isHttpUrl(image.image)
			? { source_type: "image_url", url: image.image }
			: {
					source_type: "image_base64",
					content_type: image.contentType ?? "image/jpeg",
					data: image.image,
				};

		return fetchJson(
			`${this.baseUrl}/pins`,
			{
				method: "POST",
				headers: this.headers,
				body: JSON.stringify({
					board_id: boardId,
					title,
					description,
					link,
					media_source: mediaSource,
				}),
				dispatcher: this.dispatcher,
			},
			pinSchema,
		);
	}

	async getPin(pinId: string) {
		return fetchJson(
			`${this.baseUrl}/pins/${pinId}`,
			{ method: "GET", headers: this.headers, dispatcher: this.dispatcher },
			pinSchema,
		);
	}

	async getBoardPins(boardId: string, pageSize = 25) {
		return fetchJson(
			`${this.baseUrl}/boards/${boardId}/pins?page_size=${pageSize}`,
			{ method: "GET", headers: this.headers, dispatcher: this.dispatcher },
			pinListSchema,
		);
	}

	async deletePin(pinId: string) {
		const response = await fetch(`${this.baseUrl}/pins/${pinId}`, {
			method: "DELETE",
			headers: this.headers,
			dispatcher: this.dispatcher,
		} as RequestInit);
		if (!response.ok) {
			const text = await response.text();
			throw new Error(`Pinterest API error: ${text}`);
		}
	}
}

function isHttpUrl(value: string): boolean {
	return value.startsWith("http://") || value.startsWith("https://");
}

let _instance: PinterestService | undefined;
export function getPinterestService(): PinterestService {
	if (!_instance) _instance = new PinterestService();
	return _instance;
}
