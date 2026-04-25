import { z } from "zod";
import { config } from "../lib/config.js";
import { CredentialsError } from "../lib/errors.js";
import { fetchJson } from "../lib/http.js";

const linkedInProfileSchema = z.object({
	id: z.string(),
	localizedFirstName: z.string().optional(),
	localizedLastName: z.string().optional(),
	localizedHeadline: z.string().optional(),
});

const linkedInUGCPostSchema = z.object({
	id: z.string(),
});

const linkedInShareSchema = z.object({
	id: z.string(),
	activity: z.string().optional(),
});

const linkedInPostsResponseSchema = z.object({
	elements: z.array(
		z.object({
			id: z.string(),
			created: z
				.object({
					time: z.number(),
				})
				.optional(),
			specificContent: z
				.object({
					"com.linkedin.ugc.ShareContent": z
						.object({
							shareCommentary: z
								.object({
									text: z.string(),
								})
								.optional(),
						})
						.optional(),
				})
				.optional(),
		}),
	),
});

const linkedInSearchResponseSchema = z.object({
	elements: z.array(
		z.object({
			targetUrn: z.string().optional(),
			"*profileActions": z.string().optional(),
		}),
	),
	metadata: z
		.object({
			nextDecoratedCursor: z.string().optional(),
		})
		.optional(),
});

export interface LinkedInCredentials {
	accessToken: string;
}

export class LinkedInService {
	private baseUrl = config.linkedin.baseUrl;
	private headers: Record<string, string>;

	constructor(credentials?: LinkedInCredentials) {
		const accessToken = credentials?.accessToken ?? config.linkedin.accessToken;
		if (!accessToken) {
			throw new CredentialsError("LinkedIn", ["LINKEDIN_ACCESS_TOKEN"]);
		}
		this.headers = {
			"Content-Type": "application/json",
			Authorization: `Bearer ${accessToken}`,
			"X-Restli-Protocol-Version": "2.0.0",
		};
	}

	async getProfile() {
		return fetchJson(
			`${this.baseUrl}/me`,
			{ method: "GET", headers: this.headers },
			linkedInProfileSchema,
		);
	}

	async createPost(authorUrn: string, text: string, visibility = "PUBLIC") {
		const body = {
			author: authorUrn,
			lifecycleState: "PUBLISHED",
			specificContent: {
				"com.linkedin.ugc.ShareContent": {
					shareCommentary: { text },
					shareMediaCategory: "NONE",
				},
			},
			visibility: {
				"com.linkedin.ugc.MemberNetworkVisibility": visibility,
			},
		};
		return fetchJson(
			`${this.baseUrl}/ugcPosts`,
			{
				method: "POST",
				headers: this.headers,
				body: JSON.stringify(body),
			},
			linkedInUGCPostSchema,
		);
	}

	async getPosts(authorUrn: string, count = 10) {
		const encoded = encodeURIComponent(authorUrn);
		return fetchJson(
			`${this.baseUrl}/ugcPosts?q=authors&authors=List(${encoded})&count=${count}`,
			{ method: "GET", headers: this.headers },
			linkedInPostsResponseSchema,
		);
	}

	async likePost(actorUrn: string, ugcPostUrn: string) {
		const encoded = encodeURIComponent(ugcPostUrn);
		const body = {
			actor: actorUrn,
			object: ugcPostUrn,
		};
		return fetchJson(
			`${this.baseUrl}/socialActions/${encoded}/likes`,
			{
				method: "POST",
				headers: this.headers,
				body: JSON.stringify(body),
			},
			linkedInShareSchema,
		);
	}

	async addComment(actorUrn: string, ugcPostUrn: string, text: string) {
		const encoded = encodeURIComponent(ugcPostUrn);
		const body = {
			actor: actorUrn,
			object: ugcPostUrn,
			message: { text },
		};
		return fetchJson(
			`${this.baseUrl}/socialActions/${encoded}/comments`,
			{
				method: "POST",
				headers: this.headers,
				body: JSON.stringify(body),
			},
			linkedInShareSchema,
		);
	}

	async deletePost(ugcPostUrn: string) {
		const encoded = encodeURIComponent(ugcPostUrn);
		const response = await fetch(`${this.baseUrl}/ugcPosts/${encoded}`, {
			method: "DELETE",
			headers: this.headers,
		});
		if (!response.ok) {
			throw new Error(
				`LinkedIn API error ${response.status}: ${await response.text()}`,
			);
		}
	}

	async searchPeople(keywords: string, count = 10) {
		const params = new URLSearchParams({
			q: "people",
			keywords,
			count: String(count),
		});
		return fetchJson(
			`${this.baseUrl}/search?${params}`,
			{ method: "GET", headers: this.headers },
			linkedInSearchResponseSchema,
		);
	}
}

let _instance: LinkedInService | undefined;
export function getLinkedInService(): LinkedInService {
	if (!_instance) _instance = new LinkedInService();
	return _instance;
}
