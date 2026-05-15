import { z } from "zod";
import { config } from "../lib/config.js";
import { CredentialsError } from "../lib/errors.js";
import { fetchJson } from "../lib/http.js";

const mediumUserSchema = z.object({
	id: z.string(),
	username: z.string(),
	name: z.string(),
	url: z.string().optional(),
	imageUrl: z.string().optional(),
});

const mediumPostSchema = z.object({
	id: z.string(),
	title: z.string(),
	authorId: z.string(),
	url: z.string(),
	canonicalUrl: z.string().optional(),
	publishStatus: z.string(),
	publishedAt: z.number().optional(),
	tags: z.array(z.string()).optional(),
});

const mediumUserResponseSchema = z.object({
	data: mediumUserSchema,
});

const mediumPostResponseSchema = z.object({
	data: mediumPostSchema,
});

export interface MediumCredentials {
	accessToken: string;
}

export class MediumService {
	private baseUrl = config.medium.baseUrl;
	private headers: Record<string, string>;

	constructor(credentials?: MediumCredentials) {
		const accessToken = credentials?.accessToken ?? config.medium.accessToken;
		if (!accessToken) {
			throw new CredentialsError("Medium", ["MEDIUM_ACCESS_TOKEN"]);
		}
		this.headers = {
			"Content-Type": "application/json",
			Authorization: `Bearer ${accessToken}`,
			Accept: "application/json",
		};
	}

	async getUser() {
		return fetchJson(
			`${this.baseUrl}/me`,
			{ method: "GET", headers: this.headers },
			mediumUserResponseSchema,
		);
	}

	async createPost(
		authorId: string,
		title: string,
		content: string,
		tags: string[] = [],
		publishStatus: "public" | "draft" | "unlisted" = "public",
		canonicalUrl?: string,
	) {
		const body: Record<string, unknown> = {
			title,
			contentFormat: "markdown",
			content,
			tags: tags.slice(0, 5),
			publishStatus,
		};
		if (canonicalUrl) body["canonicalUrl"] = canonicalUrl;

		return fetchJson(
			`${this.baseUrl}/users/${authorId}/posts`,
			{
				method: "POST",
				headers: this.headers,
				body: JSON.stringify(body),
			},
			mediumPostResponseSchema,
		);
	}
}

let _instance: MediumService | undefined;
export function getMediumService(): MediumService {
	if (!_instance) _instance = new MediumService();
	return _instance;
}
