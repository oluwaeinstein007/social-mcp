import { z } from "zod";
import { config } from "../lib/config.js";
import { CredentialsError } from "../lib/errors.js";
import { fetchJson } from "../lib/http.js";

const channelSchema = z.object({
	items: z
		.array(
			z.object({
				id: z.string().optional(),
				snippet: z
					.object({
						title: z.string().optional(),
						description: z.string().optional(),
						customUrl: z.string().optional(),
						publishedAt: z.string().optional(),
						country: z.string().optional(),
						thumbnails: z
							.object({
								default: z.object({ url: z.string() }).optional(),
							})
							.optional(),
					})
					.optional(),
				statistics: z
					.object({
						viewCount: z.string().optional(),
						subscriberCount: z.string().optional(),
						videoCount: z.string().optional(),
					})
					.optional(),
			}),
		)
		.optional(),
});

const searchSchema = z.object({
	items: z
		.array(
			z.object({
				id: z
					.object({
						videoId: z.string().optional(),
						channelId: z.string().optional(),
					})
					.optional(),
				snippet: z
					.object({
						publishedAt: z.string().optional(),
						channelId: z.string().optional(),
						title: z.string().optional(),
						description: z.string().optional(),
						channelTitle: z.string().optional(),
					})
					.optional(),
			}),
		)
		.optional(),
	nextPageToken: z.string().optional(),
	pageInfo: z
		.object({
			totalResults: z.number().optional(),
		})
		.optional(),
});

const videoSchema = z.object({
	items: z
		.array(
			z.object({
				id: z.string().optional(),
				snippet: z
					.object({
						publishedAt: z.string().optional(),
						channelId: z.string().optional(),
						title: z.string().optional(),
						description: z.string().optional(),
						channelTitle: z.string().optional(),
						tags: z.array(z.string()).optional(),
						categoryId: z.string().optional(),
					})
					.optional(),
				statistics: z
					.object({
						viewCount: z.string().optional(),
						likeCount: z.string().optional(),
						commentCount: z.string().optional(),
					})
					.optional(),
				status: z
					.object({
						privacyStatus: z.string().optional(),
					})
					.optional(),
			}),
		)
		.optional(),
});

const commentThreadSchema = z.object({
	items: z
		.array(
			z.object({
				id: z.string().optional(),
				snippet: z
					.object({
						topLevelComment: z
							.object({
								id: z.string().optional(),
								snippet: z
									.object({
										textDisplay: z.string().optional(),
										authorDisplayName: z.string().optional(),
										likeCount: z.number().optional(),
										publishedAt: z.string().optional(),
									})
									.optional(),
							})
							.optional(),
						totalReplyCount: z.number().optional(),
					})
					.optional(),
			}),
		)
		.optional(),
	nextPageToken: z.string().optional(),
});

const commentInsertSchema = z.object({
	id: z.string().optional(),
	snippet: z
		.object({
			topLevelComment: z
				.object({
					snippet: z
						.object({
							textDisplay: z.string().optional(),
						})
						.optional(),
				})
				.optional(),
		})
		.optional(),
});

const videoUpdateSchema = z.object({
	id: z.string().optional(),
	snippet: z
		.object({
			title: z.string().optional(),
			description: z.string().optional(),
			tags: z.array(z.string()).optional(),
		})
		.optional(),
});

export class YouTubeService {
	private baseUrl = config.youtube.baseUrl;
	private headers: Record<string, string>;

	constructor() {
		if (!config.youtube.accessToken) {
			throw new CredentialsError("YouTube", ["YOUTUBE_ACCESS_TOKEN"]);
		}
		this.headers = {
			"Content-Type": "application/json",
			Authorization: `Bearer ${config.youtube.accessToken}`,
		};
	}

	async getChannelInfo(channelId?: string) {
		const params = new URLSearchParams({
			part: "snippet,statistics",
			...(channelId ? { id: channelId } : { mine: "true" }),
		});
		return fetchJson(
			`${this.baseUrl}/channels?${params}`,
			{ method: "GET", headers: this.headers },
			channelSchema,
		);
	}

	async searchVideos(query: string, maxResults = 10, pageToken?: string) {
		const params = new URLSearchParams({
			part: "snippet",
			q: query,
			type: "video",
			maxResults: String(maxResults),
			...(pageToken ? { pageToken } : {}),
		});
		return fetchJson(
			`${this.baseUrl}/search?${params}`,
			{ method: "GET", headers: this.headers },
			searchSchema,
		);
	}

	async getVideoInfo(videoId: string) {
		const params = new URLSearchParams({
			part: "snippet,statistics,status",
			id: videoId,
		});
		return fetchJson(
			`${this.baseUrl}/videos?${params}`,
			{ method: "GET", headers: this.headers },
			videoSchema,
		);
	}

	async listChannelVideos(channelId: string, maxResults = 10, pageToken?: string) {
		const params = new URLSearchParams({
			part: "snippet",
			channelId,
			type: "video",
			order: "date",
			maxResults: String(maxResults),
			...(pageToken ? { pageToken } : {}),
		});
		return fetchJson(
			`${this.baseUrl}/search?${params}`,
			{ method: "GET", headers: this.headers },
			searchSchema,
		);
	}

	async getComments(videoId: string, maxResults = 20) {
		const params = new URLSearchParams({
			part: "snippet",
			videoId,
			maxResults: String(maxResults),
			order: "relevance",
		});
		return fetchJson(
			`${this.baseUrl}/commentThreads?${params}`,
			{ method: "GET", headers: this.headers },
			commentThreadSchema,
		);
	}

	async postComment(videoId: string, text: string) {
		const body = {
			snippet: {
				videoId,
				topLevelComment: {
					snippet: { textOriginal: text },
				},
			},
		};
		const params = new URLSearchParams({ part: "snippet" });
		return fetchJson(
			`${this.baseUrl}/commentThreads?${params}`,
			{ method: "POST", headers: this.headers, body: JSON.stringify(body) },
			commentInsertSchema,
		);
	}

	async updateVideo(
		videoId: string,
		title: string,
		description: string,
		tags?: string[],
		categoryId = "22",
	) {
		const body = {
			id: videoId,
			snippet: {
				title,
				description,
				categoryId,
				...(tags ? { tags } : {}),
			},
		};
		const params = new URLSearchParams({ part: "snippet" });
		return fetchJson(
			`${this.baseUrl}/videos?${params}`,
			{ method: "PUT", headers: this.headers, body: JSON.stringify(body) },
			videoUpdateSchema,
		);
	}
}

let _instance: YouTubeService | undefined;
export function getYouTubeService(): YouTubeService {
	if (!_instance) _instance = new YouTubeService();
	return _instance;
}
