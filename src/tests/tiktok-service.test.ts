import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TikTokService } from "../services/tiktok-service.js";

/**
 * Commercial-content disclosure (`brand_content_toggle` / `brand_organic_toggle`) is a TikTok
 * Content Posting API requirement, not a nice-to-have: a post that promotes anything has to
 * declare it. Before these flags existed here there was no way to send them at all, so the
 * assertion that actually matters is that they reach the request body — a parameter that is
 * accepted and silently dropped is worse than one that is missing, because the UI above it
 * looks compliant.
 */
describe("TikTokService.directPostVideo commercial content disclosure", () => {
	let fetchMock: ReturnType<typeof vi.fn>;

	const okResponse = () =>
		new Response(
			// `error.message` is required by tiktokPostInitSchema even on success — omitting it
			// fails response validation before any assertion runs.
			JSON.stringify({
				data: { publish_id: "p1" },
				error: { code: "ok", message: "" },
			}),
			{ status: 200 },
		);

	beforeEach(() => {
		fetchMock = vi.fn().mockResolvedValue(okResponse());
		vi.stubGlobal("fetch", fetchMock);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	const bodyOf = () => JSON.parse(fetchMock.mock.calls[0][1].body).post_info;

	it("defaults both disclosure flags to false, so existing callers are unchanged", async () => {
		const service = new TikTokService({ accessToken: "t" });
		await service.directPostVideo(
			"https://example.com/v.mp4",
			"title",
			"PUBLIC_TO_EVERYONE",
		);

		expect(bodyOf().brand_content_toggle).toBe(false);
		expect(bodyOf().brand_organic_toggle).toBe(false);
	});

	it("sends brand_organic_toggle when the creator promotes their own business", async () => {
		const service = new TikTokService({ accessToken: "t" });
		await service.directPostVideo(
			"https://example.com/v.mp4",
			"title",
			"PUBLIC_TO_EVERYONE",
			false,
			false,
			false,
			false,
			true,
		);

		expect(bodyOf().brand_organic_toggle).toBe(true);
		expect(bodyOf().brand_content_toggle).toBe(false);
	});

	it("sends brand_content_toggle for a paid partnership", async () => {
		const service = new TikTokService({ accessToken: "t" });
		await service.directPostVideo(
			"https://example.com/v.mp4",
			"title",
			"PUBLIC_TO_EVERYONE",
			false,
			false,
			false,
			true,
			false,
		);

		expect(bodyOf().brand_content_toggle).toBe(true);
	});

	it("refuses branded content on a private audience instead of letting TikTok reject it", async () => {
		// TikTok will not accept branded content at SELF_ONLY. Failing here produces a message a
		// user can act on; failing at the provider produces an opaque error code three layers away.
		const service = new TikTokService({ accessToken: "t" });
		await expect(
			service.directPostVideo(
				"https://example.com/v.mp4",
				"title",
				"SELF_ONLY",
				false,
				false,
				false,
				true,
			),
		).rejects.toThrow(/SELF_ONLY/);

		expect(fetchMock).not.toHaveBeenCalled();
	});

	it("still allows a private post that is not branded content", async () => {
		const service = new TikTokService({ accessToken: "t" });
		await service.directPostVideo(
			"https://example.com/v.mp4",
			"title",
			"SELF_ONLY",
		);

		expect(fetchMock).toHaveBeenCalledTimes(1);
		expect(bodyOf().privacy_level).toBe("SELF_ONLY");
	});
});
