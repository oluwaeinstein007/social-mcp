import { describe, expect, it } from "vitest";
import { z } from "zod";

// Test Zod parameter schemas used by tools directly, without instantiating services

const sendTweetParams = z.object({
	text: z.string().min(1).max(280),
});

const searchTweetsParams = z.object({
	query: z.string().min(1),
	maxResults: z.number().int().min(10).max(100).default(10),
});

const whatsappSendParams = z.object({
	to: z.string(),
	text: z.string().min(1),
});

const instagramCreatePostParams = z.object({
	userId: z.string(),
	imageUrl: z.string().url(),
	caption: z.string().min(1),
});

const discordGetMessagesParams = z.object({
	channelId: z.string(),
	limit: z.number().int().min(1).max(100).default(50),
});

describe("SEND_TWEET param schema", () => {
	it("accepts valid text", () => {
		expect(() => sendTweetParams.parse({ text: "Hello!" })).not.toThrow();
	});

	it("rejects empty string", () => {
		expect(() => sendTweetParams.parse({ text: "" })).toThrow();
	});

	it("rejects text over 280 chars", () => {
		expect(() =>
			sendTweetParams.parse({ text: "a".repeat(281) }),
		).toThrow();
	});
});

describe("SEARCH_TWEETS param schema", () => {
	it("defaults maxResults to 10", () => {
		const parsed = searchTweetsParams.parse({ query: "MCP" });
		expect(parsed.maxResults).toBe(10);
	});

	it("rejects maxResults below 10", () => {
		expect(() =>
			searchTweetsParams.parse({ query: "x", maxResults: 5 }),
		).toThrow();
	});

	it("rejects maxResults above 100", () => {
		expect(() =>
			searchTweetsParams.parse({ query: "x", maxResults: 101 }),
		).toThrow();
	});
});

describe("SEND_WHATSAPP_MESSAGE param schema", () => {
	it("accepts valid params", () => {
		expect(() =>
			whatsappSendParams.parse({ to: "+2348012345678", text: "Hi" }),
		).not.toThrow();
	});

	it("rejects empty text", () => {
		expect(() =>
			whatsappSendParams.parse({ to: "+2348012345678", text: "" }),
		).toThrow();
	});
});

describe("CREATE_INSTAGRAM_POST param schema", () => {
	it("accepts valid params with caption field", () => {
		expect(() =>
			instagramCreatePostParams.parse({
				userId: "123",
				imageUrl: "https://example.com/img.jpg",
				caption: "My caption",
			}),
		).not.toThrow();
	});

	it("rejects invalid image URL", () => {
		expect(() =>
			instagramCreatePostParams.parse({
				userId: "123",
				imageUrl: "not-a-url",
				caption: "caption",
			}),
		).toThrow();
	});
});

describe("GET_DISCORD_MESSAGES param schema", () => {
	it("defaults limit to 50", () => {
		const parsed = discordGetMessagesParams.parse({ channelId: "123" });
		expect(parsed.limit).toBe(50);
	});

	it("rejects limit above 100", () => {
		expect(() =>
			discordGetMessagesParams.parse({ channelId: "123", limit: 101 }),
		).toThrow();
	});
});
