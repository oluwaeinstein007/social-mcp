import { TwitterApi } from "twitter-api-v2";
import { CredentialsError } from "../lib/errors.js";
import { createProxyAgent } from "../lib/proxy.js";

export interface TwitterCredentials {
	// OAuth 1.0a (4-legged) — required together, gives full v1.1 + v2 access.
	appKey?: string;
	appSecret?: string;
	accessToken?: string;
	accessSecret?: string;
	// OAuth 2.0 user-context access token (e.g. from an authorization-code+PKCE flow)
	// — an alternative to the four OAuth 1.0a fields above when that's all a caller
	// has. X accepts this bearer token on both v2 endpoints and v1.1 media upload.
	bearerToken?: string;
	/** Routes API calls through this proxy (e.g. per-tenant IP isolation). */
	proxyUrl?: string;
}

export interface TwitterMediaAttachment {
	/** Base64-encoded image/gif/video bytes. Max 4 per tweet (X's own limit). */
	content: string;
	mimeType: string;
}

export class TwitterService {
	private client: TwitterApi;

	constructor(credentials?: TwitterCredentials) {
		const bearerToken =
			credentials?.bearerToken ?? process.env.TWITTER_BEARER_TOKEN;
		const appKey = credentials?.appKey ?? process.env.TWITTER_APP_KEY;
		const appSecret = credentials?.appSecret ?? process.env.TWITTER_APP_SECRET;
		const accessToken =
			credentials?.accessToken ?? process.env.TWITTER_ACCESS_TOKEN;
		const accessSecret =
			credentials?.accessSecret ?? process.env.TWITTER_ACCESS_SECRET;

		const clientOptions = {
			httpAgent: createProxyAgent(credentials?.proxyUrl),
		};

		if (bearerToken) {
			this.client = new TwitterApi(bearerToken, clientOptions);
			return;
		}

		const missing: string[] = [];
		if (!appKey) missing.push("TWITTER_APP_KEY");
		if (!appSecret) missing.push("TWITTER_APP_SECRET");
		if (!accessToken) missing.push("TWITTER_ACCESS_TOKEN");
		if (!accessSecret) missing.push("TWITTER_ACCESS_SECRET");

		if (missing.length > 0) {
			throw new CredentialsError("Twitter", [
				...missing,
				"(or TWITTER_BEARER_TOKEN)",
			]);
		}

		this.client = new TwitterApi(
			{
				appKey: appKey as string,
				appSecret: appSecret as string,
				accessToken: accessToken as string,
				accessSecret: accessSecret as string,
			},
			clientOptions,
		);
	}

	async sendTweet(text: string, media?: TwitterMediaAttachment[]) {
		try {
			if (media?.length) {
				const mediaIds = await Promise.all(
					media.map((m) =>
						this.client.v1.uploadMedia(Buffer.from(m.content, "base64"), {
							mimeType: m.mimeType,
						}),
					),
				);
				const { data: createdTweet } = await this.client.v2.tweet(text, {
					media: { media_ids: mediaIds as [string] },
				});
				return createdTweet;
			}
			const { data: createdTweet } = await this.client.v2.tweet(text);
			return createdTweet;
		} catch (error) {
			throw new Error(
				`Failed to send tweet: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	}

	async replyToTweet(tweetId: string, text: string) {
		try {
			const { data: reply } = await this.client.v2.reply(text, tweetId);
			return reply;
		} catch (error) {
			throw new Error(
				`Failed to reply to tweet: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	}

	async likeTweet(tweetId: string) {
		try {
			const me = await this.client.v2.me();
			const result = await this.client.v2.like(me.data.id, tweetId);
			return result.data;
		} catch (error) {
			throw new Error(
				`Failed to like tweet: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	}

	async deleteTweet(tweetId: string) {
		try {
			const result = await this.client.v2.deleteTweet(tweetId);
			return result.data;
		} catch (error) {
			throw new Error(
				`Failed to delete tweet: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	}

	async getUserInfo(username: string) {
		try {
			const { data: user } = await this.client.v2.userByUsername(username, {
				"user.fields": [
					"description",
					"public_metrics",
					"profile_image_url",
					"created_at",
				],
			});
			return user;
		} catch (error) {
			throw new Error(
				`Failed to get user info: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	}

	async searchTweets(query: string, maxResults = 10) {
		try {
			const result = await this.client.v2.search(query, {
				max_results: maxResults,
				"tweet.fields": ["created_at", "author_id", "public_metrics"],
			});
			return result;
		} catch (error) {
			throw new Error(
				`Failed to search tweets: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	}
}

let _instance: TwitterService | undefined;
export function getTwitterService(): TwitterService {
	if (!_instance) _instance = new TwitterService();
	return _instance;
}
