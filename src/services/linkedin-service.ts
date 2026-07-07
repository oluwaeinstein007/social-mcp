import { z } from "zod";
import { config } from "../lib/config.js";
import { CredentialsError } from "../lib/errors.js";
import { fetchJson } from "../lib/http.js";
import { createProxyDispatcher } from "../lib/proxy.js";

const registerUploadSchema = z.object({
	value: z.object({
		asset: z.string(),
		uploadMechanism: z.object({
			"com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest": z.object({
				uploadUrl: z.string(),
			}),
		}),
	}),
});

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
	proxyUrl?: string;
}

export interface LinkedInImage {
	/** Base64-encoded image bytes. */
	content: string;
	title?: string;
}

export class LinkedInService {
	private baseUrl = config.linkedin.baseUrl;
	private headers: Record<string, string>;
	private dispatcher?: ReturnType<typeof createProxyDispatcher>;

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
		this.dispatcher = createProxyDispatcher(credentials?.proxyUrl);
	}

	async getProfile() {
		return fetchJson(
			`${this.baseUrl}/me`,
			{ method: "GET", headers: this.headers, dispatcher: this.dispatcher },
			linkedInProfileSchema,
		);
	}

	// LinkedIn's UGC API has no "give me a URL" shortcut for media — every image goes
	// through: register an upload slot, PUT the bytes to it, then reference the asset
	// URN it gave you. Three round trips just to attach one picture.
	private async uploadImage(
		authorUrn: string,
		content: string,
	): Promise<string> {
		const registered = await fetchJson(
			`${this.baseUrl}/assets?action=registerUpload`,
			{
				method: "POST",
				headers: this.headers,
				body: JSON.stringify({
					registerUploadRequest: {
						recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
						owner: authorUrn,
						serviceRelationships: [
							{
								relationshipType: "OWNER",
								identifier: "urn:li:userGeneratedContent",
							},
						],
					},
				}),
				dispatcher: this.dispatcher,
			},
			registerUploadSchema,
		);

		const uploadUrl =
			registered.value.uploadMechanism[
				"com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"
			].uploadUrl;
		const uploadRes = await fetch(uploadUrl, {
			method: "PUT",
			headers: { Authorization: this.headers.Authorization ?? "" },
			body: Buffer.from(content, "base64"),
			dispatcher: this.dispatcher,
		} as RequestInit);
		if (!uploadRes.ok) {
			throw new Error(
				`LinkedIn image upload error (${uploadRes.status}): ${await uploadRes.text()}`,
			);
		}

		return registered.value.asset;
	}

	async createPost(
		authorUrn: string,
		text: string,
		visibility = "PUBLIC",
		image?: LinkedInImage,
	) {
		const shareContent: Record<string, unknown> = {
			shareCommentary: { text },
			shareMediaCategory: image ? "IMAGE" : "NONE",
		};
		if (image) {
			const asset = await this.uploadImage(authorUrn, image.content);
			shareContent.media = [
				{ status: "READY", media: asset, title: { text: image.title ?? "" } },
			];
		}

		const body = {
			author: authorUrn,
			lifecycleState: "PUBLISHED",
			specificContent: {
				"com.linkedin.ugc.ShareContent": shareContent,
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
				dispatcher: this.dispatcher,
			},
			linkedInUGCPostSchema,
		);
	}

	async getPosts(authorUrn: string, count = 10) {
		const encoded = encodeURIComponent(authorUrn);
		return fetchJson(
			`${this.baseUrl}/ugcPosts?q=authors&authors=List(${encoded})&count=${count}`,
			{ method: "GET", headers: this.headers, dispatcher: this.dispatcher },
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
				dispatcher: this.dispatcher,
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
				dispatcher: this.dispatcher,
			},
			linkedInShareSchema,
		);
	}

	async deletePost(ugcPostUrn: string) {
		const encoded = encodeURIComponent(ugcPostUrn);
		const response = await fetch(`${this.baseUrl}/ugcPosts/${encoded}`, {
			method: "DELETE",
			headers: this.headers,
			dispatcher: this.dispatcher,
		} as RequestInit);
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
			{ method: "GET", headers: this.headers, dispatcher: this.dispatcher },
			linkedInSearchResponseSchema,
		);
	}
}

let _instance: LinkedInService | undefined;
export function getLinkedInService(): LinkedInService {
	if (!_instance) _instance = new LinkedInService();
	return _instance;
}
