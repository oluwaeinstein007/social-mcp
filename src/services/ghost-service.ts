import { createHmac } from "node:crypto";
import { z } from "zod";
import { config } from "../lib/config.js";
import { CredentialsError } from "../lib/errors.js";
import { fetchJson } from "../lib/http.js";

const postSchema = z.object({
	id: z.string(),
	title: z.string().optional(),
	slug: z.string().optional(),
	status: z.string().optional(),
	url: z.string().optional(),
	published_at: z.string().nullable().optional(),
	updated_at: z.string().nullable().optional(),
	excerpt: z.string().nullable().optional(),
	tags: z.array(z.object({ id: z.string(), name: z.string(), slug: z.string() })).optional(),
});

const postsResponseSchema = z.object({
	posts: z.array(postSchema),
	meta: z.object({
		pagination: z.object({
			page: z.number(),
			limit: z.number(),
			pages: z.number(),
			total: z.number(),
		}).optional(),
	}).optional(),
});

const singlePostResponseSchema = z.object({
	posts: z.array(postSchema),
});

export interface GhostCredentials {
	siteUrl: string;
	adminApiKey: string;
}

export class GhostService {
	private siteUrl: string;
	private keyId: string;
	private keySecret: string;

	constructor(credentials?: GhostCredentials) {
		const siteUrl = credentials?.siteUrl ?? config.ghost.siteUrl;
		const adminApiKey = credentials?.adminApiKey ?? config.ghost.adminApiKey;

		if (!siteUrl || !adminApiKey) {
			throw new CredentialsError("Ghost", ["GHOST_SITE_URL", "GHOST_ADMIN_API_KEY"]);
		}

		const parts = adminApiKey.split(":");
		if (parts.length !== 2) {
			throw new Error("GHOST_ADMIN_API_KEY must be in the format 'id:secret'");
		}

		this.siteUrl = siteUrl.replace(/\/$/, "");
		this.keyId = parts[0];
		this.keySecret = parts[1];
	}

	private generateJwt(): string {
		const now = Math.floor(Date.now() / 1000);
		const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT", kid: this.keyId })).toString("base64url");
		const payload = Buffer.from(JSON.stringify({ iat: now, exp: now + 300, aud: "/admin/" })).toString("base64url");
		const signing = `${header}.${payload}`;
		const signature = createHmac("sha256", Buffer.from(this.keySecret, "hex"))
			.update(signing)
			.digest("base64url");
		return `${signing}.${signature}`;
	}

	private get headers(): Record<string, string> {
		return {
			Authorization: `Ghost ${this.generateJwt()}`,
			"Content-Type": "application/json",
			"Accept-Version": "v5.0",
		};
	}

	private get adminBase(): string {
		return `${this.siteUrl}/ghost/api/admin`;
	}

	async getPosts(page = 1, limit = 10, status: "all" | "published" | "draft" = "all") {
		const params = new URLSearchParams({ page: String(page), limit: String(limit), filter: `status:${status}` });
		if (status === "all") params.delete("filter");
		else params.set("filter", `status:${status}`);
		return fetchJson(
			`${this.adminBase}/posts?${params}`,
			{ method: "GET", headers: this.headers },
			postsResponseSchema,
		);
	}

	async createPost(
		title: string,
		html?: string,
		lexical?: string,
		status: "draft" | "published" | "scheduled" = "draft",
		tags: string[] = [],
		excerpt?: string,
		publishedAt?: string,
	) {
		const post: Record<string, unknown> = {
			title,
			status,
			tags: tags.map((name) => ({ name })),
		};
		if (html) post.html = html;
		if (lexical) post.lexical = lexical;
		if (excerpt) post.custom_excerpt = excerpt;
		if (publishedAt) post.published_at = publishedAt;

		return fetchJson(
			`${this.adminBase}/posts`,
			{
				method: "POST",
				headers: this.headers,
				body: JSON.stringify({ posts: [post] }),
			},
			singlePostResponseSchema,
		);
	}

	async updatePost(
		id: string,
		updatedAt: string,
		updates: {
			title?: string;
			html?: string;
			status?: "draft" | "published";
			tags?: string[];
			custom_excerpt?: string;
		},
	) {
		const body: Record<string, unknown> = { ...updates, updated_at: updatedAt };
		if (updates.tags) body.tags = updates.tags.map((name) => ({ name }));

		return fetchJson(
			`${this.adminBase}/posts/${id}`,
			{
				method: "PUT",
				headers: this.headers,
				body: JSON.stringify({ posts: [body] }),
			},
			singlePostResponseSchema,
		);
	}

	async deletePost(id: string) {
		const response = await fetch(`${this.adminBase}/posts/${id}`, {
			method: "DELETE",
			headers: this.headers,
		});
		if (!response.ok) {
			throw new Error(`Ghost API error ${response.status}: ${response.statusText}`);
		}
	}
}

let _instance: GhostService | undefined;
export function getGhostService(): GhostService {
	if (!_instance) _instance = new GhostService();
	return _instance;
}
