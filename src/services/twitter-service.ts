import { TwitterApi } from "twitter-api-v2";
import { CredentialsError } from "../lib/errors.js";

export interface TwitterCredentials {
	appKey: string;
	appSecret: string;
	accessToken: string;
	accessSecret: string;
}

type TwitterBackend = "twitter" | "xquik";
const DEFAULT_XQUIK_TIMEOUT_MS = 10_000;

interface XquikSearchTweet {
	id: string;
	text: string;
	createdAt?: string;
	likeCount?: number;
	retweetCount?: number;
	replyCount?: number;
	quoteCount?: number;
	author?: {
		id?: string;
		username?: string;
		name?: string;
	};
}

interface XquikUserProfile {
	id?: string;
	username?: string;
	name?: string;
	description?: string;
	followers?: number;
	following?: number;
	statusesCount?: number;
	verified?: boolean;
	profilePicture?: string;
	createdAt?: string;
}

interface XquikTweetSearchResponse {
	tweets?: XquikSearchTweet[];
	next_cursor?: string;
}

interface XquikUserSearchResponse {
	users?: XquikUserProfile[];
}

export class TwitterService {
	private readonly backend: TwitterBackend;
	private readonly credentials?: TwitterCredentials;
	private client?: TwitterApi;

	constructor(credentials?: TwitterCredentials) {
		this.backend = getTwitterBackend();
		this.credentials = credentials;

		if (this.backend === "xquik") {
			getXquikApiKey();
			return;
		}

		this.client = createTwitterClient(credentials);
	}

	private getNativeClient() {
		if (!this.client) {
			this.client = createTwitterClient(this.credentials);
		}
		return this.client;
	}

	private async requestXquik<T>(
		path: string,
		params: Record<string, string>,
	): Promise<T> {
		const baseUrl = (
			process.env.XQUIK_BASE_URL ?? "https://xquik.com/api/v1"
		).replace(/\/+$/, "");
		const url = new URL(`${baseUrl}${path}`);
		for (const [key, value] of Object.entries(params)) {
			url.searchParams.set(key, value);
		}

		const timeoutMs = getXquikTimeoutMs();
		const signal = AbortSignal.timeout(timeoutMs);
		let text: string;
		let response: Response;

		try {
			response = await fetch(url, {
				headers: {
					"x-api-key": getXquikApiKey(),
				},
				signal,
			});
			text = await response.text();
		} catch (error) {
			if (isAbortError(error)) {
				throw new Error(`Xquik API timeout after ${timeoutMs}ms`);
			}
			throw error;
		}
		const data = parseJson(text);

		if (!response.ok) {
			throw new Error(
				`Xquik API error (HTTP ${response.status}): ${errorMessage(data, text)}`,
			);
		}

		return data as T;
	}

	private async getUserInfoFromXquik(username: string) {
		const data = await this.requestXquik<XquikUserSearchResponse>(
			"/x/users/search",
			{ q: username },
		);
		const users = data.users ?? [];
		const normalizedUsername = username.toLowerCase();
		const user = users.find((item) => {
			if (typeof item.username !== "string") {
				return false;
			}
			return item.username.toLowerCase() === normalizedUsername;
		});

		if (
			!user ||
			typeof user.id !== "string" ||
			typeof user.username !== "string"
		) {
			throw new Error(`No Twitter/X user found for ${username}`);
		}

		const name = typeof user.name === "string" ? user.name : user.username;

		return {
			id: user.id,
			name,
			username: user.username,
			description: user.description,
			verified: user.verified,
			profile_image_url: user.profilePicture,
			created_at: user.createdAt,
			public_metrics: {
				followers_count: user.followers,
				following_count: user.following,
				tweet_count: user.statusesCount,
			},
		};
	}

	private async searchTweetsFromXquik(query: string, maxResults: number) {
		const data = await this.requestXquik<XquikTweetSearchResponse>(
			"/x/tweets/search",
			{
				q: query,
				queryType: "Latest",
				limit: String(maxResults),
			},
		);
		const tweets = (data.tweets ?? []).map((tweet) => ({
			id: tweet.id,
			text: tweet.text,
			author_id: tweet.author?.id,
			created_at: tweet.createdAt,
			public_metrics: {
				like_count: tweet.likeCount,
				retweet_count: tweet.retweetCount,
				reply_count: tweet.replyCount,
				quote_count: tweet.quoteCount,
			},
		}));

		return {
			tweets,
			meta: {
				result_count: tweets.length,
				next_token: data.next_cursor,
			},
		};
	}

	async sendTweet(text: string) {
		try {
			const { data: createdTweet } =
				await this.getNativeClient().v2.tweet(text);
			return createdTweet;
		} catch (error) {
			throw new Error(
				`Failed to send tweet: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	}

	async replyToTweet(tweetId: string, text: string) {
		try {
			const { data: reply } = await this.getNativeClient().v2.reply(
				text,
				tweetId,
			);
			return reply;
		} catch (error) {
			throw new Error(
				`Failed to reply to tweet: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	}

	async likeTweet(tweetId: string) {
		try {
			const me = await this.getNativeClient().v2.me();
			const result = await this.getNativeClient().v2.like(me.data.id, tweetId);
			return result.data;
		} catch (error) {
			throw new Error(
				`Failed to like tweet: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	}

	async deleteTweet(tweetId: string) {
		try {
			const result = await this.getNativeClient().v2.deleteTweet(tweetId);
			return result.data;
		} catch (error) {
			throw new Error(
				`Failed to delete tweet: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	}

	async getUserInfo(username: string) {
		if (this.backend === "xquik") {
			try {
				return await this.getUserInfoFromXquik(username);
			} catch (error) {
				throw new Error(
					`Failed to get user info: ${error instanceof Error ? error.message : "Unknown error"}`,
				);
			}
		}

		try {
			const { data: user } = await this.getNativeClient().v2.userByUsername(
				username,
				{
					"user.fields": [
						"description",
						"public_metrics",
						"profile_image_url",
						"created_at",
					],
				},
			);
			return user;
		} catch (error) {
			throw new Error(
				`Failed to get user info: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	}

	async searchTweets(query: string, maxResults = 10) {
		if (this.backend === "xquik") {
			try {
				return await this.searchTweetsFromXquik(query, maxResults);
			} catch (error) {
				throw new Error(
					`Failed to search tweets: ${error instanceof Error ? error.message : "Unknown error"}`,
				);
			}
		}

		try {
			const result = await this.getNativeClient().v2.search(query, {
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

function createTwitterClient(credentials?: TwitterCredentials): TwitterApi {
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

	return new TwitterApi({
		appKey: appKey as string,
		appSecret: appSecret as string,
		accessToken: accessToken as string,
		accessSecret: accessSecret as string,
	});
}

function getTwitterBackend(): TwitterBackend {
	return process.env.TWITTER_BACKEND?.toLowerCase() === "xquik"
		? "xquik"
		: "twitter";
}

function getXquikApiKey(): string {
	const apiKey = process.env.XQUIK_API_KEY;
	if (!apiKey) {
		throw new CredentialsError("Xquik", ["XQUIK_API_KEY"]);
	}
	return apiKey;
}

function getXquikTimeoutMs(): number {
	const rawTimeout = process.env.XQUIK_TIMEOUT_MS;
	if (!rawTimeout) {
		return DEFAULT_XQUIK_TIMEOUT_MS;
	}

	const timeout = Number(rawTimeout);
	if (!Number.isFinite(timeout) || timeout <= 0) {
		return DEFAULT_XQUIK_TIMEOUT_MS;
	}

	return timeout;
}

function parseJson(text: string): unknown {
	if (!text) {
		return {};
	}
	try {
		return JSON.parse(text);
	} catch {
		return {};
	}
}

function errorMessage(data: unknown, fallback: string): string {
	if (isRecord(data)) {
		const error = stringFromUnknown(data.error);
		if (error) return error;

		const message = stringFromUnknown(data.message);
		if (message) return message;
	}
	return fallback || "Unknown error";
}

function stringFromUnknown(value: unknown): string | undefined {
	if (typeof value === "string") return value;
	if (!isRecord(value)) return undefined;

	const error = stringFromUnknown(value.error);
	if (error) return error;

	const message = stringFromUnknown(value.message);
	if (message) return message;

	return undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function isAbortError(error: unknown): boolean {
	return (
		error instanceof DOMException &&
		(error.name === "AbortError" || error.name === "TimeoutError")
	);
}

let _instance: TwitterService | undefined;
export function getTwitterService(): TwitterService {
	if (!_instance) _instance = new TwitterService();
	return _instance;
}
