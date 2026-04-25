import { z } from "zod";
import { config } from "../lib/config.js";
import { CredentialsError } from "../lib/errors.js";
import { fetchJson } from "../lib/http.js";

const mastodonAccountSchema = z.object({
	id: z.string(),
	username: z.string(),
	acct: z.string(),
	display_name: z.string(),
	note: z.string().optional(),
	followers_count: z.number().optional(),
	following_count: z.number().optional(),
	statuses_count: z.number().optional(),
	url: z.string().optional(),
});

const mastodonStatusSchema = z.object({
	id: z.string(),
	content: z.string(),
	url: z.string().optional(),
	created_at: z.string().optional(),
	favourites_count: z.number().optional(),
	reblogs_count: z.number().optional(),
	replies_count: z.number().optional(),
});

const mastodonSearchSchema = z.object({
	statuses: z.array(mastodonStatusSchema),
});

export interface MastodonCredentials {
	accessToken: string;
	instanceUrl?: string;
}

export class MastodonService {
	private baseUrl: string;
	private headers: Record<string, string>;

	constructor(credentials?: MastodonCredentials) {
		const accessToken = credentials?.accessToken ?? config.mastodon.accessToken;
		const instanceUrl = credentials?.instanceUrl ?? config.mastodon.instanceUrl;
		if (!accessToken) {
			throw new CredentialsError("Mastodon", ["MASTODON_ACCESS_TOKEN"]);
		}
		this.baseUrl = `${instanceUrl}/api/v1`;
		this.headers = {
			"Content-Type": "application/json",
			Authorization: `Bearer ${accessToken}`,
		};
	}

	async getProfile() {
		return fetchJson(
			`${this.baseUrl}/accounts/verify_credentials`,
			{ method: "GET", headers: this.headers },
			mastodonAccountSchema,
		);
	}

	async createPost(
		status: string,
		visibility: "public" | "unlisted" | "private" | "direct" = "public",
	) {
		return fetchJson(
			`${this.baseUrl}/statuses`,
			{
				method: "POST",
				headers: this.headers,
				body: JSON.stringify({ status, visibility }),
			},
			mastodonStatusSchema,
		);
	}

	async replyToPost(
		status: string,
		inReplyToId: string,
		visibility: "public" | "unlisted" | "private" | "direct" = "public",
	) {
		return fetchJson(
			`${this.baseUrl}/statuses`,
			{
				method: "POST",
				headers: this.headers,
				body: JSON.stringify({
					status,
					in_reply_to_id: inReplyToId,
					visibility,
				}),
			},
			mastodonStatusSchema,
		);
	}

	async deletePost(statusId: string) {
		const response = await fetch(`${this.baseUrl}/statuses/${statusId}`, {
			method: "DELETE",
			headers: this.headers,
		});
		if (!response.ok) {
			throw new Error(
				`Mastodon API error ${response.status}: ${await response.text()}`,
			);
		}
	}

	async boostPost(statusId: string) {
		return fetchJson(
			`${this.baseUrl}/statuses/${statusId}/reblog`,
			{ method: "POST", headers: this.headers },
			mastodonStatusSchema,
		);
	}

	async favouritePost(statusId: string) {
		return fetchJson(
			`${this.baseUrl}/statuses/${statusId}/favourite`,
			{ method: "POST", headers: this.headers },
			mastodonStatusSchema,
		);
	}

	async searchPosts(query: string, limit = 10) {
		const params = new URLSearchParams({
			q: query,
			type: "statuses",
			limit: String(limit),
		});
		return fetchJson(
			`${this.baseUrl}/search?${params}`,
			{ method: "GET", headers: this.headers },
			mastodonSearchSchema,
		);
	}
}

let _instance: MastodonService | undefined;
export function getMastodonService(): MastodonService {
	if (!_instance) _instance = new MastodonService();
	return _instance;
}
