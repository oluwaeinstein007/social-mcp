import { z } from "zod";
import { config } from "../lib/config.js";
import { CredentialsError } from "../lib/errors.js";
import { fetchJson } from "../lib/http.js";
import { createProxyDispatcher } from "../lib/proxy.js";

const instagramMediaSchema = z.object({
	id: z.string(),
});

const instagramMediaDetailSchema = z.object({
	id: z.string(),
	caption: z.string().optional(),
	media_type: z.string(),
	media_url: z.string().optional(),
	permalink: z.string().optional(),
	timestamp: z.string(),
});

const instagramMediaListSchema = z.object({
	data: z.array(instagramMediaDetailSchema),
});

const containerStatusSchema = z.object({
	status_code: z.string(),
});

export interface InstagramCredentials {
	accessToken: string;
	proxyUrl?: string;
}

export class InstagramService {
	private baseUrl = config.instagram.baseUrl;
	private headers: Record<string, string>;
	private dispatcher?: ReturnType<typeof createProxyDispatcher>;

	constructor(credentials?: InstagramCredentials) {
		const accessToken =
			credentials?.accessToken ?? config.instagram.accessToken;
		if (!accessToken) {
			throw new CredentialsError("Instagram", ["INSTAGRAM_ACCESS_TOKEN"]);
		}
		this.headers = {
			"Content-Type": "application/json",
			Authorization: `Bearer ${accessToken}`,
		};
		this.dispatcher = createProxyDispatcher(credentials?.proxyUrl);
	}

	// Video/Reels containers process asynchronously — publishing before status_code
	// reaches FINISHED fails the publish call outright rather than just being slow.
	private async waitUntilReady(
		containerId: string,
		timeoutMs = 90_000,
	): Promise<void> {
		const start = Date.now();
		while (Date.now() - start < timeoutMs) {
			const status = await fetchJson(
				`${this.baseUrl}/${containerId}?fields=status_code`,
				{ method: "GET", headers: this.headers, dispatcher: this.dispatcher },
				containerStatusSchema,
			);
			if (status.status_code === "FINISHED") return;
			if (status.status_code === "ERROR" || status.status_code === "EXPIRED") {
				throw new Error(
					`Instagram media container failed to process (${status.status_code})`,
				);
			}
			await new Promise((resolve) => setTimeout(resolve, 2000));
		}
		throw new Error(
			"Timed out waiting for Instagram media container to finish processing",
		);
	}

	async createPost(
		userId: string,
		mediaUrl: string,
		caption: string,
		mediaType: "IMAGE" | "VIDEO" | "REELS" = "IMAGE",
	) {
		const body: Record<string, unknown> = { caption };
		if (mediaType === "IMAGE") {
			body.image_url = mediaUrl;
		} else {
			body.media_type = mediaType;
			body.video_url = mediaUrl;
		}

		const containerResponse = await fetchJson(
			`${this.baseUrl}/${userId}/media`,
			{
				method: "POST",
				headers: this.headers,
				body: JSON.stringify(body),
				dispatcher: this.dispatcher,
			},
			z.object({ id: z.string() }),
		);

		if (mediaType !== "IMAGE") {
			await this.waitUntilReady(containerResponse.id);
		}

		return fetchJson(
			`${this.baseUrl}/${userId}/media_publish`,
			{
				method: "POST",
				headers: this.headers,
				body: JSON.stringify({ creation_id: containerResponse.id }),
				dispatcher: this.dispatcher,
			},
			instagramMediaSchema,
		);
	}

	async getPosts(userId: string, limit = 10) {
		return fetchJson(
			`${this.baseUrl}/${userId}/media?fields=id,caption,media_type,media_url,permalink,timestamp&limit=${limit}`,
			{
				method: "GET",
				headers: this.headers,
				dispatcher: this.dispatcher,
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
