import { z } from "zod";
import { config } from "../lib/config.js";
import { CredentialsError } from "../lib/errors.js";
import { fetchJson } from "../lib/http.js";

const blogInfoSchema = z.object({
	response: z.object({
		blog: z.object({
			name: z.string(),
			title: z.string().optional(),
			description: z.string().optional(),
			url: z.string().optional(),
			posts: z.number().optional(),
			followers: z.number().optional(),
			is_nsfw: z.boolean().optional(),
			updated: z.number().optional(),
		}),
	}),
});

const npfContentBlock = z.object({
	type: z.string(),
	text: z.string().optional(),
	subtype: z.string().optional(),
	url: z.string().optional(),
	media: z.array(z.object({ url: z.string(), type: z.string().optional() })).optional(),
});

const postSchema = z.object({
	id: z.union([z.string(), z.number()]),
	id_string: z.string().optional(),
	blog_name: z.string().optional(),
	post_url: z.string().optional(),
	type: z.string().optional(),
	timestamp: z.number().optional(),
	date: z.string().optional(),
	format: z.string().optional(),
	tags: z.array(z.string()).optional(),
	note_count: z.number().optional(),
	content: z.array(npfContentBlock).optional(),
	summary: z.string().optional(),
	title: z.string().optional(),
	body: z.string().optional(),
});

const postsResponseSchema = z.object({
	response: z.object({
		posts: z.array(postSchema),
		total_posts: z.number().optional(),
	}),
});

const createPostResponseSchema = z.object({
	meta: z.object({ status: z.number(), msg: z.string() }).optional(),
	response: z.object({
		id: z.union([z.string(), z.number()]),
		id_string: z.string().optional(),
		state: z.string().optional(),
		post_url: z.string().optional(),
	}),
});

export interface TumblrCredentials {
	accessToken: string;
	blogIdentifier?: string;
}

export class TumblrService {
	private baseUrl = config.tumblr.baseUrl;
	private headers: Record<string, string>;
	private blogIdentifier: string;

	constructor(credentials?: TumblrCredentials) {
		const accessToken = credentials?.accessToken ?? config.tumblr.accessToken;
		if (!accessToken) {
			throw new CredentialsError("Tumblr", ["TUMBLR_ACCESS_TOKEN"]);
		}
		this.blogIdentifier = credentials?.blogIdentifier ?? config.tumblr.blogIdentifier;
		this.headers = {
			Authorization: `Bearer ${accessToken}`,
			"Content-Type": "application/json",
		};
	}

	private getBlog(override?: string): string {
		const blog = override ?? this.blogIdentifier;
		if (!blog) throw new Error("blogIdentifier is required. Set TUMBLR_BLOG_IDENTIFIER or pass it explicitly.");
		return blog;
	}

	async getBlogInfo(blogIdentifier?: string) {
		const blog = this.getBlog(blogIdentifier);
		return fetchJson(
			`${this.baseUrl}/blog/${blog}/info`,
			{ method: "GET", headers: this.headers },
			blogInfoSchema,
		);
	}

	async getPosts(blogIdentifier?: string, type?: string, offset = 0, limit = 10) {
		const blog = this.getBlog(blogIdentifier);
		const params = new URLSearchParams({ offset: String(offset), limit: String(limit), npf: "false" });
		if (type) params.set("type", type);
		return fetchJson(
			`${this.baseUrl}/blog/${blog}/posts?${params}`,
			{ method: "GET", headers: this.headers },
			postsResponseSchema,
		);
	}

	async createPost(
		blogIdentifier: string | undefined,
		content: Array<{ type: string; text?: string; subtype?: string }>,
		tags: string[] = [],
		state: "published" | "draft" | "queue" | "private" = "published",
		title?: string,
		nativeInlineImages = false,
	) {
		const blog = this.getBlog(blogIdentifier);
		const body: Record<string, unknown> = { content, tags, state, native_inline_images: nativeInlineImages };
		if (title) body.title = title;

		return fetchJson(
			`${this.baseUrl}/blog/${blog}/posts`,
			{ method: "POST", headers: this.headers, body: JSON.stringify(body) },
			createPostResponseSchema,
		);
	}

	async deletePost(postId: string, blogIdentifier?: string) {
		const blog = this.getBlog(blogIdentifier);
		const response = await fetch(`${this.baseUrl}/blog/${blog}/posts/${postId}`, {
			method: "DELETE",
			headers: this.headers,
		});
		if (!response.ok) {
			throw new Error(`Tumblr API error ${response.status}: ${response.statusText}`);
		}
	}
}

let _instance: TumblrService | undefined;
export function getTumblrService(): TumblrService {
	if (!_instance) _instance = new TumblrService();
	return _instance;
}
