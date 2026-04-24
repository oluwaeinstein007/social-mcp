import { z } from "zod";
import { config } from "../lib/config.js";
import { CredentialsError } from "../lib/errors.js";
import { fetchJson } from "../lib/http.js";

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
});

const pinListSchema = z.object({
	items: z.array(pinSchema),
});

export class PinterestService {
	private baseUrl = config.pinterest.baseUrl;
	private headers: Record<string, string>;

	constructor() {
		if (!config.pinterest.accessToken) {
			throw new CredentialsError("Pinterest", ["PINTEREST_ACCESS_TOKEN"]);
		}
		this.headers = {
			"Content-Type": "application/json",
			Authorization: `Bearer ${config.pinterest.accessToken}`,
		};
	}

	async getBoards(pageSize = 25) {
		return fetchJson(
			`${this.baseUrl}/boards?page_size=${pageSize}`,
			{ method: "GET", headers: this.headers },
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
			},
			boardSchema,
		);
	}

	async createPin(
		boardId: string,
		title: string,
		description: string,
		link: string,
		imageUrl: string,
	) {
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
					media_source: { source_type: "image_url", url: imageUrl },
				}),
			},
			pinSchema,
		);
	}

	async getPin(pinId: string) {
		return fetchJson(
			`${this.baseUrl}/pins/${pinId}`,
			{ method: "GET", headers: this.headers },
			pinSchema,
		);
	}

	async getBoardPins(boardId: string, pageSize = 25) {
		return fetchJson(
			`${this.baseUrl}/boards/${boardId}/pins?page_size=${pageSize}`,
			{ method: "GET", headers: this.headers },
			pinListSchema,
		);
	}

	async deletePin(pinId: string) {
		const response = await fetch(`${this.baseUrl}/pins/${pinId}`, {
			method: "DELETE",
			headers: this.headers,
		});
		if (!response.ok) {
			const text = await response.text();
			throw new Error(`Pinterest API error: ${text}`);
		}
	}
}

let _instance: PinterestService | undefined;
export function getPinterestService(): PinterestService {
	if (!_instance) _instance = new PinterestService();
	return _instance;
}
