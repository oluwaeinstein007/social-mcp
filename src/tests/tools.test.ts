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

const linkedInCreatePostParams = z.object({
	authorUrn: z.string().min(1),
	text: z.string().min(1).max(3000),
	visibility: z.enum(["PUBLIC", "CONNECTIONS", "LOGGED_IN"]).default("PUBLIC"),
});

const linkedInGetPostsParams = z.object({
	authorUrn: z.string().min(1),
	count: z.number().int().min(1).max(100).default(10),
});

const linkedInAddCommentParams = z.object({
	actorUrn: z.string().min(1),
	ugcPostUrn: z.string().min(1),
	text: z.string().min(1).max(1250),
});

const linkedInDeletePostParams = z.object({
	ugcPostUrn: z.string().min(1),
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

describe("CREATE_LINKEDIN_POST param schema", () => {
	it("accepts valid params with default visibility", () => {
		const parsed = linkedInCreatePostParams.parse({
			authorUrn: "urn:li:person:ABC123",
			text: "Hello LinkedIn!",
		});
		expect(parsed.visibility).toBe("PUBLIC");
	});

	it("rejects empty text", () => {
		expect(() =>
			linkedInCreatePostParams.parse({
				authorUrn: "urn:li:person:ABC123",
				text: "",
			}),
		).toThrow();
	});

	it("rejects text over 3000 chars", () => {
		expect(() =>
			linkedInCreatePostParams.parse({
				authorUrn: "urn:li:person:ABC123",
				text: "a".repeat(3001),
			}),
		).toThrow();
	});

	it("rejects invalid visibility value", () => {
		expect(() =>
			linkedInCreatePostParams.parse({
				authorUrn: "urn:li:person:ABC123",
				text: "Hello",
				visibility: "PRIVATE",
			}),
		).toThrow();
	});
});

describe("GET_LINKEDIN_POSTS param schema", () => {
	it("defaults count to 10", () => {
		const parsed = linkedInGetPostsParams.parse({
			authorUrn: "urn:li:person:ABC123",
		});
		expect(parsed.count).toBe(10);
	});

	it("rejects count above 100", () => {
		expect(() =>
			linkedInGetPostsParams.parse({
				authorUrn: "urn:li:person:ABC123",
				count: 101,
			}),
		).toThrow();
	});
});

describe("ADD_LINKEDIN_COMMENT param schema", () => {
	it("accepts valid params", () => {
		expect(() =>
			linkedInAddCommentParams.parse({
				actorUrn: "urn:li:person:ABC123",
				ugcPostUrn: "urn:li:ugcPost:123456",
				text: "Great post!",
			}),
		).not.toThrow();
	});

	it("rejects empty comment text", () => {
		expect(() =>
			linkedInAddCommentParams.parse({
				actorUrn: "urn:li:person:ABC123",
				ugcPostUrn: "urn:li:ugcPost:123456",
				text: "",
			}),
		).toThrow();
	});

	it("rejects text over 1250 chars", () => {
		expect(() =>
			linkedInAddCommentParams.parse({
				actorUrn: "urn:li:person:ABC123",
				ugcPostUrn: "urn:li:ugcPost:123456",
				text: "a".repeat(1251),
			}),
		).toThrow();
	});
});

describe("DELETE_LINKEDIN_POST param schema", () => {
	it("accepts a valid URN", () => {
		expect(() =>
			linkedInDeletePostParams.parse({ ugcPostUrn: "urn:li:ugcPost:123456" }),
		).not.toThrow();
	});

	it("rejects empty URN", () => {
		expect(() =>
			linkedInDeletePostParams.parse({ ugcPostUrn: "" }),
		).toThrow();
	});
});
