import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CredentialsError } from "../lib/errors.js";

// Save and restore env around each test
const savedEnv: Record<string, string | undefined> = {};
const TWITTER_KEYS = [
	"TWITTER_APP_KEY",
	"TWITTER_APP_SECRET",
	"TWITTER_ACCESS_TOKEN",
	"TWITTER_ACCESS_SECRET",
	"TWITTER_BACKEND",
	"XQUIK_API_KEY",
	"XQUIK_BASE_URL",
	"XQUIK_TIMEOUT_MS",
];

function saveEnv(keys: string[]) {
	for (const k of keys) savedEnv[k] = process.env[k];
}
function clearEnv(keys: string[]) {
	for (const k of keys) delete process.env[k];
}
function restoreEnv(keys: string[]) {
	for (const k of keys) {
		if (savedEnv[k] === undefined) {
			delete process.env[k];
		} else {
			process.env[k] = savedEnv[k];
		}
	}
}

describe("TwitterService credential validation", () => {
	beforeEach(() => {
		saveEnv(TWITTER_KEYS);
	});
	afterEach(() => {
		restoreEnv(TWITTER_KEYS);
		vi.unstubAllGlobals();
	});

	it("throws CredentialsError when all keys are missing", async () => {
		clearEnv(TWITTER_KEYS);
		// Re-import fresh module to bypass singleton
		const { TwitterService } = await import("../services/twitter-service.js");
		expect(() => new TwitterService()).toThrow(CredentialsError);
	});

	it("CredentialsError message lists missing vars", async () => {
		clearEnv(TWITTER_KEYS);
		const { TwitterService } = await import("../services/twitter-service.js");
		let msg = "";
		try {
			new TwitterService();
		} catch (e) {
			if (e instanceof CredentialsError) msg = e.message;
		}
		expect(msg).toContain("TWITTER_APP_KEY");
	});

	it("requires only XQUIK_API_KEY for Xquik backend startup", async () => {
		clearEnv(TWITTER_KEYS);
		process.env.TWITTER_BACKEND = "xquik";
		const { TwitterService } = await import("../services/twitter-service.js");
		expect(() => new TwitterService()).toThrow(CredentialsError);

		process.env.XQUIK_API_KEY = "test-key";
		expect(() => new TwitterService()).not.toThrow();
	});

	it("maps Xquik user search into Twitter profile fields", async () => {
		clearEnv(TWITTER_KEYS);
		process.env.TWITTER_BACKEND = "xquik";
		process.env.XQUIK_API_KEY = "test-key";
		process.env.XQUIK_BASE_URL = "https://xquik.test/api/v1";
		vi.stubGlobal(
			"fetch",
			vi.fn(async () => {
				return new Response(
					JSON.stringify({
						users: [
							{
								id: "42",
								username: "xquikcom",
								name: "Xquik",
								description: "X automation platform",
								followers: 100,
								following: 5,
								statusesCount: 250,
								profilePicture: "https://example.com/avatar.png",
							},
						],
					}),
					{ status: 200 },
				);
			}),
		);

		const { TwitterService } = await import("../services/twitter-service.js");
		const user = await new TwitterService().getUserInfo("xquikcom");

		expect(user.id).toBe("42");
		expect(user.public_metrics?.followers_count).toBe(100);
		expect(fetch).toHaveBeenCalledWith(
			new URL("https://xquik.test/api/v1/x/users/search?q=xquikcom"),
			expect.objectContaining({
				headers: { "x-api-key": "test-key" },
				signal: expect.any(AbortSignal),
			}),
		);
	});

	it("rejects Xquik user search when no exact username matches", async () => {
		clearEnv(TWITTER_KEYS);
		process.env.TWITTER_BACKEND = "xquik";
		process.env.XQUIK_API_KEY = "test-key";
		process.env.XQUIK_BASE_URL = "https://xquik.test/api/v1";
		vi.stubGlobal(
			"fetch",
			vi.fn(async () => {
				return new Response(
					JSON.stringify({
						users: [
							{
								id: "43",
								username: "differentuser",
								name: "Different User",
							},
						],
					}),
					{ status: 200 },
				);
			}),
		);

		const { TwitterService } = await import("../services/twitter-service.js");

		await expect(
			new TwitterService().getUserInfo("expectedUsername"),
		).rejects.toThrow("Failed to get user info: No Twitter/X user found");
		expect(fetch).toHaveBeenCalledWith(
			new URL("https://xquik.test/api/v1/x/users/search?q=expectedUsername"),
			expect.objectContaining({
				headers: { "x-api-key": "test-key" },
				signal: expect.any(AbortSignal),
			}),
		);
	});

	it("wraps aborted Xquik requests as timeout errors", async () => {
		clearEnv(TWITTER_KEYS);
		process.env.TWITTER_BACKEND = "xquik";
		process.env.XQUIK_API_KEY = "test-key";
		process.env.XQUIK_TIMEOUT_MS = "500";
		vi.stubGlobal(
			"fetch",
			vi.fn(async () => {
				throw new DOMException("The operation was aborted.", "AbortError");
			}),
		);

		const { TwitterService } = await import("../services/twitter-service.js");

		await expect(new TwitterService().getUserInfo("xquikcom")).rejects.toThrow(
			"Failed to get user info: Xquik API timeout after 500ms",
		);
	});

	it("maps Xquik tweet search into the existing paginator shape", async () => {
		clearEnv(TWITTER_KEYS);
		process.env.TWITTER_BACKEND = "xquik";
		process.env.XQUIK_API_KEY = "test-key";
		vi.stubGlobal(
			"fetch",
			vi.fn(async () => {
				return new Response(
					JSON.stringify({
						tweets: [
							{
								id: "123",
								text: "MCP works with Xquik",
								likeCount: 9,
								author: { id: "42", username: "xquikcom" },
							},
						],
						next_cursor: "next",
					}),
					{ status: 200 },
				);
			}),
		);

		const { TwitterService } = await import("../services/twitter-service.js");
		const result = await new TwitterService().searchTweets("MCP", 10);

		expect(result.tweets[0]?.id).toBe("123");
		expect(result.tweets[0]?.public_metrics.like_count).toBe(9);
		expect(result.meta.result_count).toBe(1);
		expect(result.meta.next_token).toBe("next");
	});
});

describe("TelegramService credential validation", () => {
	beforeEach(() => saveEnv(["TELEGRAM_BOT_TOKEN"]));
	afterEach(() => restoreEnv(["TELEGRAM_BOT_TOKEN"]));

	it("throws CredentialsError when token is missing", async () => {
		delete process.env.TELEGRAM_BOT_TOKEN;
		const { TelegramService } = await import("../services/telegram-service.js");
		expect(() => new TelegramService()).toThrow(CredentialsError);
	});
});

describe("SlackService credential validation", () => {
	beforeEach(() => saveEnv(["SLACK_BOT_TOKEN"]));
	afterEach(() => restoreEnv(["SLACK_BOT_TOKEN"]));

	it("throws CredentialsError when token is missing", async () => {
		delete process.env.SLACK_BOT_TOKEN;
		const { SlackService } = await import("../services/slack-service.js");
		expect(() => new SlackService()).toThrow(CredentialsError);
	});
});

describe("DiscordService credential validation", () => {
	beforeEach(() => saveEnv(["DISCORD_BOT_TOKEN"]));
	afterEach(() => restoreEnv(["DISCORD_BOT_TOKEN"]));

	it("throws CredentialsError when token is missing", async () => {
		delete process.env.DISCORD_BOT_TOKEN;
		// Reset module-level config by re-importing
		const { DiscordService } = await import("../services/discord-service.js");
		expect(() => new DiscordService()).toThrow(CredentialsError);
	});
});

describe("LinkedInService credential validation", () => {
	beforeEach(() => saveEnv(["LINKEDIN_ACCESS_TOKEN"]));
	afterEach(() => restoreEnv(["LINKEDIN_ACCESS_TOKEN"]));

	it("throws CredentialsError when token is missing", async () => {
		delete process.env.LINKEDIN_ACCESS_TOKEN;
		const { LinkedInService } = await import("../services/linkedin-service.js");
		expect(() => new LinkedInService()).toThrow(CredentialsError);
	});

	it("CredentialsError message lists missing var", async () => {
		delete process.env.LINKEDIN_ACCESS_TOKEN;
		const { LinkedInService } = await import("../services/linkedin-service.js");
		let msg = "";
		try {
			new LinkedInService();
		} catch (e) {
			if (e instanceof CredentialsError) msg = e.message;
		}
		expect(msg).toContain("LINKEDIN_ACCESS_TOKEN");
	});
});
