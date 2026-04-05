import { z } from "zod";
import { config } from "../lib/config.js";
import { CredentialsError } from "../lib/errors.js";
import { fetchJson } from "../lib/http.js";

const instagramMediaSchema = z.object({
	id: z.string(),
});

const instagramMediaDetailSchema = z.object({
	id: z.string(),
	caption: z.string().optional(),
	media_type: z.string(),
	timestamp: z.string(),
});

const instagramMediaListSchema = z.object({
	data: z.array(instagramMediaDetailSchema),
});

export class InstagramService {
	private baseUrl = config.instagram.baseUrl;
	private headers: Record<string, string>;

	constructor() {
		if (!config.instagram.accessToken) {
			throw new CredentialsError("Instagram", ["INSTAGRAM_ACCESS_TOKEN"]);
		}
		this.headers = {
			"Content-Type": "application/json",
			Authorization: `Bearer ${config.instagram.accessToken}`,
		};
	}

	async createPost(userId: string, imageUrl: string, caption: string) {
		const containerResponse = await fetchJson(
			`${this.baseUrl}/${userId}/media`,
			{
				method: "POST",
				headers: this.headers,
				body: JSON.stringify({ image_url: imageUrl, caption }),
			},
			z.object({ id: z.string() }),
		);
		return fetchJson(
			`${this.baseUrl}/${userId}/media_publish`,
			{
				method: "POST",
				headers: this.headers,
				body: JSON.stringify({ creation_id: containerResponse.id }),
			},
			instagramMediaSchema,
		);
	}

	async getPosts(userId: string, limit = 10) {
		return fetchJson(
			`${this.baseUrl}/${userId}/media?fields=id,caption,media_type,timestamp&limit=${limit}`,
			{
				method: "GET",
				headers: this.headers,
			},
			instagramMediaListSchema,
		);
	}
}

let _instance: InstagramService | undefined;
export function getInstagramService(): InstagramService {
	if (!_instance) _instance = new InstagramService();
	return _instance;
}
