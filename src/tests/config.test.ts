import { describe, expect, it } from "vitest";
import { META_API_VERSION, config } from "../lib/config.js";

describe("config", () => {
	it("META_API_VERSION is a valid Graph API version string", () => {
		expect(META_API_VERSION).toMatch(/^v\d+\.\d+$/);
	});

	it("all Meta services share the same base URL", () => {
		expect(config.whatsapp.baseUrl).toBe(config.facebook.baseUrl);
		expect(config.facebook.baseUrl).toBe(config.instagram.baseUrl);
	});

	it("Meta base URLs contain META_API_VERSION", () => {
		expect(config.facebook.baseUrl).toContain(META_API_VERSION);
	});

	it("discord baseUrl points to api v10", () => {
		expect(config.discord.baseUrl).toContain("discord.com/api/v10");
	});

	it("config exposes whatsapp phoneNumberId field", () => {
		expect(config.whatsapp).toHaveProperty("phoneNumberId");
	});
});
