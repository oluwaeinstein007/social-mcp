import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DiscordService } from "../services/discord-service.js";

describe("DiscordService sendMessage attachments", () => {
	let fetchMock: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		fetchMock = vi.fn();
		vi.stubGlobal("fetch", fetchMock);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("sends a plain JSON body when there are no attachments", async () => {
		fetchMock.mockResolvedValue(
			new Response(
				JSON.stringify({ id: "1", channel_id: "c1", content: "hi", timestamp: "now" }),
				{ status: 200 },
			),
		);
		const service = new DiscordService({ botToken: "token" });
		await service.sendMessage("c1", "hi");

		const [, init] = fetchMock.mock.calls[0];
		expect(init.headers["Content-Type"]).toBe("application/json");
		expect(JSON.parse(init.body)).toEqual({ content: "hi" });
	});

	it("sends multipart form data with payload_json when attachments are present", async () => {
		fetchMock.mockResolvedValue(
			new Response(
				JSON.stringify({
					id: "1",
					channel_id: "c1",
					content: "hi",
					timestamp: "now",
					attachments: [{ id: "9", filename: "note.txt", url: "https://cdn.example/note.txt" }],
				}),
				{ status: 200 },
			),
		);
		const service = new DiscordService({ botToken: "token" });
		const result = await service.sendMessage("c1", "hi", [
			{ filename: "note.txt", content: Buffer.from("hello").toString("base64"), contentType: "text/plain" },
		]);

		const [, init] = fetchMock.mock.calls[0];
		expect(init.body).toBeInstanceOf(FormData);
		expect(init.headers.Authorization).toBe("Bot token");
		expect(init.headers["Content-Type"]).toBeUndefined();
		expect(result.attachments?.[0]?.filename).toBe("note.txt");
	});
});
