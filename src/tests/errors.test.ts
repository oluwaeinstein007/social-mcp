import { describe, expect, it } from "vitest";
import { CredentialsError } from "../lib/errors.js";

describe("CredentialsError", () => {
	it("sets name to CredentialsError", () => {
		const err = new CredentialsError("Twitter", ["TWITTER_APP_KEY"]);
		expect(err.name).toBe("CredentialsError");
	});

	it("includes platform name in message", () => {
		const err = new CredentialsError("Slack", ["SLACK_BOT_TOKEN"]);
		expect(err.message).toContain("Slack");
	});

	it("includes all missing var names in message", () => {
		const missing = ["TWITTER_APP_KEY", "TWITTER_APP_SECRET"];
		const err = new CredentialsError("Twitter", missing);
		expect(err.message).toContain("TWITTER_APP_KEY");
		expect(err.message).toContain("TWITTER_APP_SECRET");
	});

	it("is an instance of Error", () => {
		const err = new CredentialsError("Discord", ["DISCORD_BOT_TOKEN"]);
		expect(err).toBeInstanceOf(Error);
	});
});
