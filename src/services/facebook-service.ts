import { z } from "zod";
import { config } from "../lib/config.js";
import { CredentialsError } from "../lib/errors.js";
import { fetchJson } from "../lib/http.js";
import { createProxyDispatcher } from "../lib/proxy.js";

const facebookPostSchema = z.object({
	id: z.string(),
	post_id: z.string().optional(),
});

const facebookPostDetailSchema = z.object({
	id: z.string(),
	message: z.string().optional(),
	created_time: z.string(),
});

const facebookPostsResponseSchema = z.object({
	data: z.array(facebookPostDetailSchema),
});

export interface FacebookCredentials {
	accessToken: string;
	proxyUrl?: string;
}

export interface FacebookImage {
	/** Public image URL, or base64-encoded image bytes. */
	image: string;
	filename?: string;
}

export interface FacebookVideo {
	/** Public video URL, or base64-encoded video bytes. */
	video: string;
	filename?: string;
}

export class FacebookService {
	private baseUrl = config.facebook.baseUrl;
	private headers: Record<string, string>;
	private dispatcher?: ReturnType<typeof createProxyDispatcher>;

	constructor(credentials?: FacebookCredentials) {
		const accessToken = credentials?.accessToken ?? config.facebook.accessToken;
		if (!accessToken) {
			throw new CredentialsError("Facebook", ["FACEBOOK_ACCESS_TOKEN"]);
		}
		this.headers = {
			"Content-Type": "application/json",
			Authorization: `Bearer ${accessToken}`,
		};
		this.dispatcher = createProxyDispatcher(credentials?.proxyUrl);
	}

	async createPost(pageId: string, message: string, image?: FacebookImage) {
		if (!image) {
			return fetchJson(
				`${this.baseUrl}/${pageId}/feed`,
				{
					method: "POST",
					headers: this.headers,
					body: JSON.stringify({ message }),
					dispatcher: this.dispatcher,
				},
				facebookPostSchema,
			);
		}

		// The Graph API's /photos endpoint accepts either a `url` it fetches itself,
		// or a real multipart upload via `source` — same endpoint, two input shapes.
		if (isHttpUrl(image.image)) {
			return fetchJson(
				`${this.baseUrl}/${pageId}/photos`,
				{
					method: "POST",
					headers: this.headers,
					body: JSON.stringify({ url: image.image, caption: message }),
					dispatcher: this.dispatcher,
				},
				facebookPostSchema,
			);
		}

		const formData = new FormData();
		formData.append("caption", message);
		const buffer = Buffer.from(image.image, "base64");
		formData.append(
			"source",
			new Blob([buffer]),
			image.filename ?? "photo.jpg",
		);

		const response = await fetch(`${this.baseUrl}/${pageId}/photos`, {
			method: "POST",
			headers: { Authorization: this.headers.Authorization ?? "" },
			body: formData,
			dispatcher: this.dispatcher,
		} as RequestInit);
		if (!response.ok) {
			throw new Error(
				`Facebook API error (${response.status}): ${await response.text()}`,
			);
		}
		return facebookPostSchema.parse(await response.json());
	}

	async createVideoPost(
		pageId: string,
		description: string,
		video: FacebookVideo,
	) {
		if (isHttpUrl(video.video)) {
			return fetchJson(
				`${this.baseUrl}/${pageId}/videos`,
				{
					method: "POST",
					headers: this.headers,
					body: JSON.stringify({ file_url: video.video, description }),
					dispatcher: this.dispatcher,
				},
				facebookPostSchema,
			);
		}

		const formData = new FormData();
		formData.append("description", description);
		const buffer = Buffer.from(video.video, "base64");
		formData.append(
			"source",
			new Blob([buffer]),
			video.filename ?? "video.mp4",
		);

		const response = await fetch(`${this.baseUrl}/${pageId}/videos`, {
			method: "POST",
			headers: { Authorization: this.headers.Authorization ?? "" },
			body: formData,
			dispatcher: this.dispatcher,
		} as RequestInit);
		if (!response.ok) {
			throw new Error(
				`Facebook API error (${response.status}): ${await response.text()}`,
			);
		}
		return facebookPostSchema.parse(await response.json());
	}

	async getPosts(pageId: string, limit = 10) {
		return fetchJson(
			`${this.baseUrl}/${pageId}/posts?fields=id,message,created_time&limit=${limit}`,
			{
				method: "GET",
				headers: this.headers,
				dispatcher: this.dispatcher,
			},
			facebookPostsResponseSchema,
		);
	}
}

function isHttpUrl(value: string): boolean {
	return value.startsWith("http://") || value.startsWith("https://");
}

let _instance: FacebookService | undefined;
export function getFacebookService(): FacebookService {
	if (!_instance) _instance = new FacebookService();
	return _instance;
}
