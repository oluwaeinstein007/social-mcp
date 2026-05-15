import { z } from "zod";
import { config } from "../lib/config.js";
import { CredentialsError } from "../lib/errors.js";
import { fetchJson } from "../lib/http.js";

const postSchema = z.object({
	id: z.string(),
	title: z.string().optional(),
	subtitle: z.string().optional(),
	status: z.string().optional(),
	publish_date: z.number().nullable().optional(),
	displayed_date: z.number().nullable().optional(),
	web_url: z.string().optional(),
	slug: z.string().optional(),
	audience: z.string().optional(),
	email_sent_to_count: z.number().nullable().optional(),
	stats: z.object({
		email: z.object({
			recipients: z.number().optional(),
			open_rate: z.number().optional(),
			click_rate: z.number().optional(),
		}).optional(),
	}).optional(),
});

const postsResponseSchema = z.object({
	data: z.array(postSchema),
	limit: z.number().optional(),
	page: z.number().optional(),
	total_results: z.number().optional(),
});

const createPostResponseSchema = z.object({
	data: postSchema,
});

const subscriberSchema = z.object({
	id: z.string(),
	email: z.string().optional(),
	status: z.string().optional(),
	created: z.number().optional(),
	subscription_premium_tier_names: z.array(z.string()).optional(),
});

const subscribersResponseSchema = z.object({
	data: z.array(subscriberSchema),
	limit: z.number().optional(),
	page: z.number().optional(),
	total_results: z.number().optional(),
});

export interface BeehiivCredentials {
	apiKey: string;
	publicationId?: string;
}

export class BeehiivService {
	private baseUrl = config.beehiiv.baseUrl;
	private headers: Record<string, string>;
	private publicationId: string;

	constructor(credentials?: BeehiivCredentials) {
		const apiKey = credentials?.apiKey ?? config.beehiiv.apiKey;
		if (!apiKey) {
			throw new CredentialsError("Beehiiv", ["BEEHIIV_API_KEY"]);
		}
		this.publicationId = credentials?.publicationId ?? config.beehiiv.publicationId;
		this.headers = {
			Authorization: `Bearer ${apiKey}`,
			"Content-Type": "application/json",
			Accept: "application/json",
		};
	}

	private getPublicationId(override?: string): string {
		const id = override ?? this.publicationId;
		if (!id) throw new Error("publicationId is required. Set BEEHIIV_PUBLICATION_ID or pass it explicitly.");
		return id;
	}

	async getPosts(publicationId?: string, page = 1, limit = 10) {
		const id = this.getPublicationId(publicationId);
		return fetchJson(
			`${this.baseUrl}/publications/${id}/posts?page=${page}&limit=${limit}&expand[]=stats`,
			{ method: "GET", headers: this.headers },
			postsResponseSchema,
		);
	}

	async createPost(
		publicationId: string | undefined,
		title: string,
		bodyHtml: string,
		subtitle?: string,
		status: "draft" | "confirmed" = "draft",
		audience: "free" | "premium" | "all" = "free",
		sendAt?: number,
	) {
		const id = this.getPublicationId(publicationId);
		const body: Record<string, unknown> = {
			subject_line: title,
			content: { type: "html", value: bodyHtml },
			status,
			audience,
		};
		if (subtitle) body.preview_text = subtitle;
		if (sendAt) body.send_at = sendAt;

		return fetchJson(
			`${this.baseUrl}/publications/${id}/posts`,
			{ method: "POST", headers: this.headers, body: JSON.stringify(body) },
			createPostResponseSchema,
		);
	}

	async getSubscribers(publicationId?: string, page = 1, limit = 10) {
		const id = this.getPublicationId(publicationId);
		return fetchJson(
			`${this.baseUrl}/publications/${id}/subscriptions?page=${page}&limit=${limit}`,
			{ method: "GET", headers: this.headers },
			subscribersResponseSchema,
		);
	}
}

let _instance: BeehiivService | undefined;
export function getBeehiivService(): BeehiivService {
	if (!_instance) _instance = new BeehiivService();
	return _instance;
}
