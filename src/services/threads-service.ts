import { z } from "zod";
import { config } from "../lib/config.js";
import { CredentialsError } from "../lib/errors.js";
import { fetchJson } from "../lib/http.js";

const threadsMediaSchema = z.object({
	id: z.string(),
});

const threadsPublishSchema = z.object({
	id: z.string(),
});

const threadsProfileSchema = z.object({
	id: z.string(),
	username: z.string().optional(),
	name: z.string().optional(),
	biography: z.string().optional(),
	followers_count: z.number().optional(),
	profile_picture_url: z.string().optional(),
});

const threadsPostsSchema = z.object({
	data: z.array(
		z.object({
			id: z.string(),
			text: z.string().optional(),
			media_type: z.string().optional(),
			timestamp: z.string().optional(),
			permalink: z.string().optional(),
			like_count: z.number().optional(),
			replies_count: z.number().optional(),
		}),
	),
	paging: z
		.object({
			cursors: z
				.object({ before: z.string().optional(), after: z.string().optional() })
				.optional(),
		})
		.optional(),
});

export interface ThreadsCredentials {
	accessToken: string;
	userId: string;
}

export class ThreadsService {
	private baseUrl = config.threads.baseUrl;
	private accessToken: string;
	private userId: string;
	private headers: Record<string, string>;

	constructor(credentials?: ThreadsCredentials) {
		const accessToken = credentials?.accessToken ?? config.threads.accessToken;
		const userId = credentials?.userId ?? config.threads.userId;
		if (!accessToken || !userId) {
			throw new CredentialsError("Threads", [
				"THREADS_ACCESS_TOKEN",
				"THREADS_USER_ID",
			]);
		}
		this.accessToken = accessToken;
		this.userId = userId;
		this.headers = {
			"Content-Type": "application/json",
			Authorization: `Bearer ${accessToken}`,
		};
	}

	async getProfile() {
		const fields =
			"id,username,name,biography,followers_count,profile_picture_url";
		return fetchJson(
			`${this.baseUrl}/me?fields=${fields}&access_token=${this.accessToken}`,
			{ method: "GET", headers: this.headers },
			threadsProfileSchema,
		);
	}

	async createPost(text: string, replyToId?: string) {
		const body: Record<string, string> = {
			media_type: "TEXT",
			text,
			access_token: this.accessToken,
		};
		if (replyToId) body.reply_to_id = replyToId;

		const container = await fetchJson(
			`${this.baseUrl}/${this.userId}/threads`,
			{ method: "POST", headers: this.headers, body: JSON.stringify(body) },
			threadsMediaSchema,
		);

		return fetchJson(
			`${this.baseUrl}/${this.userId}/threads_publish`,
			{
				method: "POST",
				headers: this.headers,
				body: JSON.stringify({
					creation_id: container.id,
					access_token: this.accessToken,
				}),
			},
			threadsPublishSchema,
		);
	}

	async getPosts(limit = 10) {
		const fields =
			"id,text,media_type,timestamp,permalink,like_count,replies_count";
		return fetchJson(
			`${this.baseUrl}/${this.userId}/threads?fields=${fields}&limit=${limit}&access_token=${this.accessToken}`,
			{ method: "GET", headers: this.headers },
			threadsPostsSchema,
		);
	}

	async deletePost(mediaId: string) {
		const response = await fetch(
			`${this.baseUrl}/${mediaId}?access_token=${this.accessToken}`,
			{ method: "DELETE", headers: this.headers },
		);
		if (!response.ok) {
			throw new Error(
				`Threads API error ${response.status}: ${await response.text()}`,
			);
		}
	}
}

let _instance: ThreadsService | undefined;
export function getThreadsService(): ThreadsService {
	if (!_instance) _instance = new ThreadsService();
	return _instance;
}
