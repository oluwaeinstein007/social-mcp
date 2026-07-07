import { z } from "zod";
import { config } from "../lib/config.js";
import { CredentialsError } from "../lib/errors.js";
import { createProxyDispatcher } from "../lib/proxy.js";

const mediaLeaseSchema = z.object({
	args: z.object({
		action: z.string(),
		fields: z.array(z.object({ name: z.string(), value: z.string() })),
	}),
	asset: z.object({ asset_id: z.string() }),
});

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
	// Password grant — required together, RedditService authenticates itself.
	clientId?: string;
	clientSecret?: string;
	username?: string;
	password?: string;
	// Alternative to the password grant above: a pre-obtained OAuth 2.0 access token
	// (e.g. from an authorization-code flow managed elsewhere), used as-is with no
	// authentication call and no refresh handling — the caller owns keeping it fresh.
	accessToken?: string;
	userAgent?: string;
	proxyUrl?: string;
}

export interface RedditMedia {
	/** Base64-encoded image/video bytes. */
	content: string;
	filename: string;
	mimeType: string;
}

export class RedditService {
	private baseUrl = config.reddit.baseUrl;
	private userAgent: string;
	private clientId?: string;
	private clientSecret?: string;
	private username?: string;
	private password?: string;
	private _accessToken: string | null;
	private dispatcher?: ReturnType<typeof createProxyDispatcher>;

	constructor(credentials?: RedditCredentials) {
		if (credentials?.accessToken) {
			this._accessToken = credentials.accessToken;
		} else {
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
					"(or an accessToken)",
				]);
			}
			this.clientId = clientId;
			this.clientSecret = clientSecret;
			this.username = username;
			this.password = password;
			this._accessToken = null;
		}
		this.userAgent = credentials?.userAgent ?? config.reddit.userAgent;
		this.dispatcher = createProxyDispatcher(credentials?.proxyUrl);
	}

	private async authenticate(): Promise<string> {
		if (this._accessToken) return this._accessToken;
		// Only reachable when the constructor took the password-grant branch, which
		// validates these are all set — guaranteed non-null here, TS just can't see it.
		if (
			!this.clientId ||
			!this.clientSecret ||
			!this.username ||
			!this.password
		) {
			throw new Error("Reddit password-grant credentials are missing");
		}
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
			dispatcher: this.dispatcher,
		} as RequestInit);
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

	// Reddit's own upload endpoint is a two-step lease-then-S3-PUT flow: ask for a
	// signed upload slot, POST the bytes there with the fields it gave you verbatim,
	// then the asset is reachable at the conventional i.redd.it/<asset_id> URL.
	async uploadMedia(media: RedditMedia): Promise<string> {
		const headers = await this.headers();
		const leaseRes = await fetch(`${this.baseUrl}/api/media/asset.json`, {
			method: "POST",
			headers,
			body: new URLSearchParams({
				filepath: media.filename,
				mimetype: media.mimeType,
			}),
			dispatcher: this.dispatcher,
		} as RequestInit);
		if (!leaseRes.ok) {
			throw new Error(
				`Reddit media lease failed: ${leaseRes.status} ${await leaseRes.text()}`,
			);
		}
		const lease = mediaLeaseSchema.parse(await leaseRes.json());

		const formData = new FormData();
		for (const field of lease.args.fields) {
			formData.append(field.name, field.value);
		}
		const buffer = Buffer.from(media.content, "base64");
		formData.append(
			"file",
			new Blob([buffer], { type: media.mimeType }),
			media.filename,
		);

		const uploadUrl = lease.args.action.startsWith("//")
			? `https:${lease.args.action}`
			: lease.args.action;
		const uploadRes = await fetch(uploadUrl, {
			method: "POST",
			body: formData,
			dispatcher: this.dispatcher,
		} as RequestInit);
		if (!uploadRes.ok) {
			throw new Error(
				`Reddit media upload failed: ${uploadRes.status} ${await uploadRes.text()}`,
			);
		}

		return `https://i.redd.it/${lease.asset.asset_id}`;
	}

	async submitPost(
		subreddit: string,
		title: string,
		kind: "self" | "link" | "image",
		text?: string,
		url?: string,
		media?: RedditMedia,
	) {
		const headers = await this.headers();
		const mediaUrl =
			kind === "image" && media ? await this.uploadMedia(media) : url;
		const body = new URLSearchParams({ sr: subreddit, title, kind });
		if (kind === "self" && text) body.set("text", text);
		if ((kind === "link" || kind === "image") && mediaUrl)
			body.set("url", mediaUrl);
		const response = await fetch(`${this.baseUrl}/api/submit`, {
			method: "POST",
			headers,
			body,
			dispatcher: this.dispatcher,
		} as RequestInit);
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
			{ method: "GET", headers, dispatcher: this.dispatcher } as RequestInit,
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
			dispatcher: this.dispatcher,
		} as RequestInit);
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
			dispatcher: this.dispatcher,
		} as RequestInit);
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
		const response = await fetch(base, {
			method: "GET",
			headers,
			dispatcher: this.dispatcher,
		} as RequestInit);
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
			dispatcher: this.dispatcher,
		} as RequestInit);
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
