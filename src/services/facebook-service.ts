import { z } from "zod";
import { config } from "../lib/config.js";
import { CredentialsError } from "../lib/errors.js";
import { fetchJson } from "../lib/http.js";

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
}

export class FacebookService {
	private baseUrl = config.facebook.baseUrl;
	private headers: Record<string, string>;

	constructor(credentials?: FacebookCredentials) {
		const accessToken = credentials?.accessToken ?? config.facebook.accessToken;
		if (!accessToken) {
			throw new CredentialsError("Facebook", ["FACEBOOK_ACCESS_TOKEN"]);
		}
		this.headers = {
			"Content-Type": "application/json",
			Authorization: `Bearer ${accessToken}`,
		};
	}

	async createPost(pageId: string, message: string) {
		return fetchJson(
			`${this.baseUrl}/${pageId}/feed`,
			{
				method: "POST",
				headers: this.headers,
				body: JSON.stringify({ message }),
			},
			facebookPostSchema,
		);
	}

	async getPosts(pageId: string, limit = 10) {
		return fetchJson(
			`${this.baseUrl}/${pageId}/posts?fields=id,message,created_time&limit=${limit}`,
			{
				method: "GET",
				headers: this.headers,
			},
			facebookPostsResponseSchema,
		);
	}
}

let _instance: FacebookService | undefined;
export function getFacebookService(): FacebookService {
	if (!_instance) _instance = new FacebookService();
	return _instance;
}
