import { TwitterApi } from "twitter-api-v2";
import { CredentialsError } from "../lib/errors.js";

export interface TwitterCredentials {
	appKey: string;
	appSecret: string;
	accessToken: string;
	accessSecret: string;
}

export class TwitterService {
	private client: TwitterApi;

	constructor(credentials?: TwitterCredentials) {
		const appKey = credentials?.appKey ?? process.env.TWITTER_APP_KEY;
		const appSecret = credentials?.appSecret ?? process.env.TWITTER_APP_SECRET;
		const accessToken =
			credentials?.accessToken ?? process.env.TWITTER_ACCESS_TOKEN;
		const accessSecret =
			credentials?.accessSecret ?? process.env.TWITTER_ACCESS_SECRET;

		const missing: string[] = [];
		if (!appKey) missing.push("TWITTER_APP_KEY");
		if (!appSecret) missing.push("TWITTER_APP_SECRET");
		if (!accessToken) missing.push("TWITTER_ACCESS_TOKEN");
		if (!accessSecret) missing.push("TWITTER_ACCESS_SECRET");

		if (missing.length > 0) {
			throw new CredentialsError("Twitter", missing);
		}

		this.client = new TwitterApi({
			appKey: appKey as string,
			appSecret: appSecret as string,
			accessToken: accessToken as string,
			accessSecret: accessSecret as string,
		});
	}

	async sendTweet(text: string) {
		try {
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
