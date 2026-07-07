import { z } from "zod";
import { config } from "../lib/config.js";
import { CredentialsError } from "../lib/errors.js";
import { fetchJson } from "../lib/http.js";
import { createProxyDispatcher } from "../lib/proxy.js";

const threadsMediaSchema = z.object({
	id: z.string(),
});

const threadsPublishSchema = z.object({
	id: z.string(),
});

const threadsContainerStatusSchema = z.object({
	status: z.string(),
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
			media_url: z.string().optional(),
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
	proxyUrl?: string;
}

export class ThreadsService {
	private baseUrl = config.threads.baseUrl;
	private accessToken: string;
	private userId: string;
	private headers: Record<string, string>;
	private dispatcher?: ReturnType<typeof createProxyDispatcher>;

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
		this.dispatcher = createProxyDispatcher(credentials?.proxyUrl);
	}

	async getProfile() {
		const fields =
			"id,username,name,biography,followers_count,profile_picture_url";
		return fetchJson(
			`${this.baseUrl}/me?fields=${fields}&access_token=${this.accessToken}`,
			{ method: "GET", headers: this.headers, dispatcher: this.dispatcher },
			threadsProfileSchema,
		);
	}

	// IMAGE/VIDEO containers process asynchronously — publishing before status
	// reaches FINISHED fails the publish call, same as Instagram's identical infra.
	private async waitUntilReady(
		containerId: string,
		timeoutMs = 90_000,
	): Promise<void> {
		const start = Date.now();
		while (Date.now() - start < timeoutMs) {
			const status = await fetchJson(
				`${this.baseUrl}/${containerId}?fields=status&access_token=${this.accessToken}`,
				{ method: "GET", headers: this.headers, dispatcher: this.dispatcher },
				threadsContainerStatusSchema,
			);
			if (status.status === "FINISHED") return;
			if (status.status === "ERROR" || status.status === "EXPIRED") {
				throw new Error(
					`Threads media container failed to process (${status.status})`,
				);
			}
			await new Promise((resolve) => setTimeout(resolve, 2000));
		}
		throw new Error(
			"Timed out waiting for Threads media container to finish processing",
		);
	}

	async createPost(
		text: string,
		replyToId?: string,
		media?: { url: string; type: "IMAGE" | "VIDEO" },
	) {
		const body: Record<string, string> = {
			media_type: media?.type ?? "TEXT",
			text,
			access_token: this.accessToken,
		};
		if (replyToId) body.reply_to_id = replyToId;
		if (media?.type === "IMAGE") body.image_url = media.url;
		if (media?.type === "VIDEO") body.video_url = media.url;

		const container = await fetchJson(
			`${this.baseUrl}/${this.userId}/threads`,
			{
				method: "POST",
				headers: this.headers,
				body: JSON.stringify(body),
				dispatcher: this.dispatcher,
			},
			threadsMediaSchema,
		);

		if (media) {
			await this.waitUntilReady(container.id);
		}

		return fetchJson(
			`${this.baseUrl}/${this.userId}/threads_publish`,
			{
				method: "POST",
				headers: this.headers,
				body: JSON.stringify({
					creation_id: container.id,
					access_token: this.accessToken,
				}),
				dispatcher: this.dispatcher,
			},
			threadsPublishSchema,
		);
	}

	async getPosts(limit = 10) {
		const fields =
			"id,text,media_type,media_url,timestamp,permalink,like_count,replies_count";
		return fetchJson(
			`${this.baseUrl}/${this.userId}/threads?fields=${fields}&limit=${limit}&access_token=${this.accessToken}`,
			{ method: "GET", headers: this.headers, dispatcher: this.dispatcher },
			threadsPostsSchema,
		);
	}

	async deletePost(mediaId: string) {
		const response = await fetch(
			`${this.baseUrl}/${mediaId}?access_token=${this.accessToken}`,
			{
				method: "DELETE",
				headers: this.headers,
				dispatcher: this.dispatcher,
			} as RequestInit,
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
