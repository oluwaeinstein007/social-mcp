import { z } from "zod";
import { config } from "../lib/config.js";
import { CredentialsError } from "../lib/errors.js";
import { fetchJson } from "../lib/http.js";
import { createProxyDispatcher } from "../lib/proxy.js";

const articleSchema = z.object({
	id: z.number(),
	title: z.string(),
	description: z.string().optional(),
	url: z.string().optional(),
	slug: z.string().optional(),
	published: z.boolean().optional(),
	published_at: z.string().nullable().optional(),
	tag_list: z.union([z.string(), z.array(z.string())]).optional(),
	tags: z.array(z.string()).optional(),
	reading_time_minutes: z.number().optional(),
	comments_count: z.number().optional(),
	positive_reactions_count: z.number().optional(),
	page_views_count: z.number().optional(),
	body_markdown: z.string().optional(),
});

const articleResponseSchema = z.object({
	id: z.number(),
	title: z.string(),
	description: z.string().optional(),
	url: z.string().optional(),
	slug: z.string().optional(),
	published: z.boolean().optional(),
	published_at: z.string().nullable().optional(),
	tag_list: z.union([z.string(), z.array(z.string())]).optional(),
	tags: z.array(z.string()).optional(),
	reading_time_minutes: z.number().optional(),
	comments_count: z.number().optional(),
	positive_reactions_count: z.number().optional(),
	page_views_count: z.number().optional(),
	body_markdown: z.string().optional(),
});

export type DevToArticle = z.infer<typeof articleSchema>;

export interface DevToCredentials {
	apiKey: string;
	proxyUrl?: string;
}

export class DevToService {
	private baseUrl = config.devto.baseUrl;
	private headers: Record<string, string>;
	private dispatcher?: ReturnType<typeof createProxyDispatcher>;

	constructor(credentials?: DevToCredentials) {
		const apiKey = credentials?.apiKey ?? config.devto.apiKey;
		if (!apiKey) {
			throw new CredentialsError("Dev.to", ["DEVTO_API_KEY"]);
		}
		this.headers = {
			"api-key": apiKey,
			"Content-Type": "application/json",
			Accept: "application/vnd.forem.api-v1+json",
		};
		this.dispatcher = createProxyDispatcher(credentials?.proxyUrl);
	}

	async getMyArticles(page = 1, perPage = 30) {
		return fetchJson(
			`${this.baseUrl}/articles/me?page=${page}&per_page=${perPage}`,
			{ method: "GET", headers: this.headers, dispatcher: this.dispatcher },
			z.array(articleSchema),
		);
	}

	async getArticle(id: number) {
		return fetchJson(
			`${this.baseUrl}/articles/${id}`,
			{ method: "GET", headers: this.headers, dispatcher: this.dispatcher },
			articleResponseSchema,
		);
	}

	async createArticle(
		title: string,
		bodyMarkdown: string,
		tags: string[] = [],
		published = false,
		description?: string,
		canonicalUrl?: string,
		series?: string,
		mainImage?: string,
	) {
		const article: Record<string, unknown> = {
			title,
			body_markdown: bodyMarkdown,
			published,
			tags,
		};
		if (description) article.description = description;
		if (canonicalUrl) article.canonical_url = canonicalUrl;
		if (series) article.series = series;
		if (mainImage) article.main_image = mainImage;

		return fetchJson(
			`${this.baseUrl}/articles`,
			{
				method: "POST",
				headers: this.headers,
				body: JSON.stringify({ article }),
				dispatcher: this.dispatcher,
			},
			articleResponseSchema,
		);
	}

	async updateArticle(
		id: number,
		updates: {
			title?: string;
			body_markdown?: string;
			published?: boolean;
			tags?: string[];
			description?: string;
			canonical_url?: string;
		},
	) {
		return fetchJson(
			`${this.baseUrl}/articles/${id}`,
			{
				method: "PUT",
				headers: this.headers,
				body: JSON.stringify({ article: updates }),
				dispatcher: this.dispatcher,
			},
			articleResponseSchema,
		);
	}
}

let _instance: DevToService | undefined;
export function getDevToService(): DevToService {
	if (!_instance) _instance = new DevToService();
	return _instance;
}
