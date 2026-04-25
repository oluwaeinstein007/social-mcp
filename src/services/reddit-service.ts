import { z } from "zod";
import { config } from "../lib/config.js";
import { CredentialsError } from "../lib/errors.js";

const redditTokenSchema = z.object({
	access_token: z.string(),
	token_type: z.string(),
	expires_in: z.number().optional(),
});

const redditPostSchema = z.object({
	json: z.object({
		errors: z.array(z.unknown()),
		data: z
			.object({
				name: z.string().optional(),
				url: z.string().optional(),
				id: z.string().optional(),
			})
			.optional(),
	}),
});

const redditListingSchema = z.object({
	data: z.object({
		children: z.array(
			z.object({
				data: z.object({
					id: z.string(),
					name: z.string(),
					title: z.string().optional(),
					selftext: z.string().optional(),
					url: z.string().optional(),
					score: z.number().optional(),
					author: z.string().optional(),
					created_utc: z.number().optional(),
					num_comments: z.number().optional(),
					subreddit: z.string().optional(),
					permalink: z.string().optional(),
					body: z.string().optional(),
				}),
			}),
		),
		after: z.string().nullable().optional(),
	}),
});

const redditUserSchema = z.object({
	data: z.object({
		name: z.string(),
		id: z.string(),
		icon_img: z.string().optional(),
		link_karma: z.number().optional(),
		comment_karma: z.number().optional(),
		created_utc: z.number().optional(),
		is_gold: z.boolean().optional(),
		subreddit: z
			.object({
				title: z.string().optional(),
				public_description: z.string().optional(),
			})
			.optional(),
	}),
});

export interface RedditCredentials {
	clientId: string;
	clientSecret: string;
	username: string;
	password: string;
	userAgent?: string;
}

export class RedditService {
	private baseUrl = config.reddit.baseUrl;
	private userAgent: string;
	private clientId: string;
	private clientSecret: string;
	private username: string;
	private password: string;
	private _accessToken: string | null = null;

	constructor(credentials?: RedditCredentials) {
		const clientId = credentials?.clientId ?? config.reddit.clientId;
		const clientSecret =
			credentials?.clientSecret ?? config.reddit.clientSecret;
		const username = credentials?.username ?? config.reddit.username;
		const password = credentials?.password ?? config.reddit.password;
		if (!clientId || !clientSecret || !username || !password) {
			throw new CredentialsError("Reddit", [
				"REDDIT_CLIENT_ID",
				"REDDIT_CLIENT_SECRET",
				"REDDIT_USERNAME",
				"REDDIT_PASSWORD",
			]);
		}
		this.clientId = clientId;
		this.clientSecret = clientSecret;
		this.username = username;
		this.password = password;
		this.userAgent = credentials?.userAgent ?? config.reddit.userAgent;
	}

	private async authenticate(): Promise<string> {
		if (this._accessToken) return this._accessToken;
		const encoded = Buffer.from(
			`${this.clientId}:${this.clientSecret}`,
		).toString("base64");
		const response = await fetch("https://www.reddit.com/api/v1/access_token", {
			method: "POST",
			headers: {
				Authorization: `Basic ${encoded}`,
				"Content-Type": "application/x-www-form-urlencoded",
				"User-Agent": this.userAgent,
			},
			body: new URLSearchParams({
				grant_type: "password",
				username: this.username,
				password: this.password,
			}),
		});
		if (!response.ok) {
			throw new Error(
				`Reddit auth failed: ${response.status} ${await response.text()}`,
			);
		}
		const data = redditTokenSchema.parse(await response.json());
		this._accessToken = data.access_token;
		return this._accessToken;
	}

	private async headers(): Promise<Record<string, string>> {
		const token = await this.authenticate();
		return {
			Authorization: `Bearer ${token}`,
			"User-Agent": this.userAgent,
			"Content-Type": "application/x-www-form-urlencoded",
		};
	}

	async submitPost(
		subreddit: string,
		title: string,
		kind: "self" | "link",
		text?: string,
		url?: string,
	) {
		const headers = await this.headers();
		const body = new URLSearchParams({ sr: subreddit, title, kind });
		if (kind === "self" && text) body.set("text", text);
		if (kind === "link" && url) body.set("url", url);
		const response = await fetch(`${this.baseUrl}/api/submit`, {
			method: "POST",
			headers,
			body,
		});
		if (!response.ok) {
			throw new Error(
				`Reddit API error ${response.status}: ${await response.text()}`,
			);
		}
		return redditPostSchema.parse(await response.json());
	}

	async getPosts(
		subreddit: string,
		sort: "hot" | "new" | "top" | "rising" = "hot",
		limit = 10,
	) {
		const headers = await this.headers();
		const response = await fetch(
			`${this.baseUrl}/r/${subreddit}/${sort}?limit=${limit}`,
			{ method: "GET", headers },
		);
		if (!response.ok) {
			throw new Error(
				`Reddit API error ${response.status}: ${await response.text()}`,
			);
		}
		return redditListingSchema.parse(await response.json());
	}

	async comment(parentId: string, text: string) {
		const headers = await this.headers();
		const body = new URLSearchParams({ thing_id: parentId, text });
		const response = await fetch(`${this.baseUrl}/api/comment`, {
			method: "POST",
			headers,
			body,
		});
		if (!response.ok) {
			throw new Error(
				`Reddit API error ${response.status}: ${await response.text()}`,
			);
		}
		return redditPostSchema.parse(await response.json());
	}

	async vote(id: string, dir: 1 | 0 | -1) {
		const headers = await this.headers();
		const body = new URLSearchParams({ id, dir: String(dir) });
		const response = await fetch(`${this.baseUrl}/api/vote`, {
			method: "POST",
			headers,
			body,
		});
		if (!response.ok) {
			throw new Error(
				`Reddit API error ${response.status}: ${await response.text()}`,
			);
		}
	}

	async search(
		query: string,
		subreddit?: string,
		sort: "relevance" | "new" | "top" = "relevance",
		limit = 10,
	) {
		const headers = await this.headers();
		const params = new URLSearchParams({
			q: query,
			sort,
			limit: String(limit),
		});
		const base = subreddit
			? `${this.baseUrl}/r/${subreddit}/search?${params}&restrict_sr=1`
			: `${this.baseUrl}/search?${params}`;
		const response = await fetch(base, { method: "GET", headers });
		if (!response.ok) {
			throw new Error(
				`Reddit API error ${response.status}: ${await response.text()}`,
			);
		}
		return redditListingSchema.parse(await response.json());
	}

	async getUserInfo(username: string) {
		const headers = await this.headers();
		const response = await fetch(`${this.baseUrl}/user/${username}/about`, {
			method: "GET",
			headers,
		});
		if (!response.ok) {
			throw new Error(
				`Reddit API error ${response.status}: ${await response.text()}`,
			);
		}
		return redditUserSchema.parse(await response.json());
	}
}

let _instance: RedditService | undefined;
export function getRedditService(): RedditService {
	if (!_instance) _instance = new RedditService();
	return _instance;
}
