import { TwitterApi } from "twitter-api-v2";

export class TwitterService {
	private client: TwitterApi;

	constructor() {
		const appKey = process.env.TWITTER_APP_KEY;
		const appSecret = process.env.TWITTER_APP_SECRET;
		const accessToken = process.env.TWITTER_ACCESS_TOKEN;
		const accessSecret = process.env.TWITTER_ACCESS_SECRET;

		if (!appKey || !appSecret || !accessToken || !accessSecret) {
			throw new Error(
				"Twitter API credentials are not fully configured in environment variables",
			);
		}

		this.client = new TwitterApi({
			appKey,
			appSecret,
			accessToken,
			accessSecret,
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
			// Return the full paginator so callers have access to both .data and .meta
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
