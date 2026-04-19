import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { CredentialsError } from "../lib/errors.js";

// Save and restore env around each test
const savedEnv: Record<string, string | undefined> = {};
const TWITTER_KEYS = [
	"TWITTER_APP_KEY",
	"TWITTER_APP_SECRET",
	"TWITTER_ACCESS_TOKEN",
	"TWITTER_ACCESS_SECRET",
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
	beforeEach(() => saveEnv(TWITTER_KEYS));
	afterEach(() => restoreEnv(TWITTER_KEYS));

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
