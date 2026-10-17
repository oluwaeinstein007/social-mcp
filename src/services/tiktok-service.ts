import { z } from "zod";
import { config } from "../lib/config.js";
import { CredentialsError } from "../lib/errors.js";
import { fetchJson } from "../lib/http.js";
import { createProxyDispatcher } from "../lib/proxy.js";

const tiktokCreatorInfoSchema = z.object({
	data: z.object({
		creator_avatar_url: z.string().optional(),
		creator_username: z.string().optional(),
		creator_nickname: z.string().optional(),
		privacy_level_options: z.array(z.string()).optional(),
		comment_disabled: z.boolean().optional(),
		duet_disabled: z.boolean().optional(),
		stitch_disabled: z.boolean().optional(),
		max_video_post_duration_sec: z.number().optional(),
	}),
	error: z
		.object({
			code: z.string(),
			message: z.string(),
			log_id: z.string().optional(),
		})
		.optional(),
});

const tiktokPostInitSchema = z.object({
	data: z.object({
		publish_id: z.string().optional(),
		upload_url: z.string().optional(),
	}),
	error: z
		.object({
			code: z.string(),
			message: z.string(),
			log_id: z.string().optional(),
		})
		.optional(),
});

const tiktokUserInfoSchema = z.object({
	data: z.object({
		user: z.object({
			open_id: z.string().optional(),
			union_id: z.string().optional(),
			avatar_url: z.string().optional(),
			display_name: z.string().optional(),
			bio_description: z.string().optional(),
			profile_deep_link: z.string().optional(),
			is_verified: z.boolean().optional(),
			follower_count: z.number().optional(),
			following_count: z.number().optional(),
			likes_count: z.number().optional(),
			video_count: z.number().optional(),
		}),
	}),
	error: z
		.object({
			code: z.string(),
			message: z.string(),
			log_id: z.string().optional(),
		})
		.optional(),
});

const tiktokStatusSchema = z.object({
	data: z.object({
		status: z.string().optional(),
		publicaly_available_post_id: z.array(z.string()).optional(),
		fail_reason: z.string().optional(),
	}),
	error: z
		.object({
			code: z.string(),
			message: z.string(),
			log_id: z.string().optional(),
		})
		.optional(),
});

export interface TikTokCredentials {
	accessToken: string;
	proxyUrl?: string;
}

export class TikTokService {
	private baseUrl = config.tiktok.baseUrl;
	private headers: Record<string, string>;
	private dispatcher?: ReturnType<typeof createProxyDispatcher>;

	constructor(credentials?: TikTokCredentials) {
		const accessToken = credentials?.accessToken ?? config.tiktok.accessToken;
		if (!accessToken) {
			throw new CredentialsError("TikTok", ["TIKTOK_ACCESS_TOKEN"]);
		}
		this.headers = {
			"Content-Type": "application/json; charset=UTF-8",
			Authorization: `Bearer ${accessToken}`,
		};
		this.dispatcher = createProxyDispatcher(credentials?.proxyUrl);
	}

	async queryCreatorInfo() {
		return fetchJson(
			`${this.baseUrl}/post/publish/creator_info/query/`,
			{
				method: "POST",
				headers: this.headers,
				body: JSON.stringify({}),
				dispatcher: this.dispatcher,
			},
			tiktokCreatorInfoSchema,
		);
	}

	/**
	 * Post a video by URL.
	 *
	 * `brandContentToggle` / `brandOrganicToggle` are TikTok's commercial-content disclosure
	 * flags and are required for compliance with their Content Posting API terms whenever a
	 * post promotes anything:
	 *   - brandOrganicToggle — the creator is promoting their own business ("Your brand")
	 *   - brandContentToggle — the post is a paid partnership promoting someone else
	 *     ("Branded content")
	 * Both default to false (not commercial content), which is the previous behaviour, so
	 * existing callers are unaffected.
	 *
	 * TikTok rejects branded content posted to a private audience, so the SELF_ONLY
	 * combination is refused here with a clear message rather than being sent and coming back
	 * as an opaque provider error.
	 *
	 * New parameters are appended positionally and optional on purpose: this method is called
	 * directly (not only through the MCP tool) by consumers that import the built service, so
	 * reordering into an options object would be a breaking change for them.
	 */
	async directPostVideo(
		videoUrl: string,
		title: string,
		privacyLevel: string,
		disableDuet = false,
		disableComment = false,
		disableStitch = false,
		brandContentToggle = false,
		brandOrganicToggle = false,
	) {
		if (brandContentToggle && privacyLevel === "SELF_ONLY") {
			throw new Error(
				"TikTok does not allow branded content to be posted with privacy_level SELF_ONLY. Choose a non-private audience, or turn off the paid-partnership disclosure.",
			);
		}
		const body = {
			post_info: {
				title,
				privacy_level: privacyLevel,
				disable_duet: disableDuet,
				disable_comment: disableComment,
				disable_stitch: disableStitch,
				brand_content_toggle: brandContentToggle,
				brand_organic_toggle: brandOrganicToggle,
			},
			source_info: {
				source: "PULL_FROM_URL",
				video_url: videoUrl,
			},
		};
		return fetchJson(
			`${this.baseUrl}/post/publish/video/init/`,
			{
				method: "POST",
				headers: this.headers,
				body: JSON.stringify(body),
				dispatcher: this.dispatcher,
			},
			tiktokPostInitSchema,
		);
	}

	async photoPost(
		photoUrls: string[],
		title: string,
		description: string,
		privacyLevel: string,
	) {
		const body = {
			post_info: {
				title,
				description,
				privacy_level: privacyLevel,
				disable_comment: false,
			},
			source_info: {
				source: "PULL_FROM_URL",
				photo_cover_index: 0,
				photo_images: photoUrls,
			},
			post_mode: "DIRECT_POST",
			media_type: "PHOTO",
		};
		return fetchJson(
			`${this.baseUrl}/post/publish/content/init/`,
			{
				method: "POST",
				headers: this.headers,
				body: JSON.stringify(body),
				dispatcher: this.dispatcher,
			},
			tiktokPostInitSchema,
		);
	}

	async getUserInfo() {
		const fields =
			"open_id,union_id,avatar_url,display_name,bio_description,profile_deep_link,is_verified,follower_count,following_count,likes_count,video_count";
		return fetchJson(
			`${this.baseUrl}/user/info/?fields=${fields}`,
			{ method: "GET", headers: this.headers, dispatcher: this.dispatcher },
			tiktokUserInfoSchema,
		);
	}

	async getPostStatus(publishId: string) {
		return fetchJson(
			`${this.baseUrl}/post/publish/status/fetch/`,
			{
				method: "POST",
				headers: this.headers,
				body: JSON.stringify({ publish_id: publishId }),
				dispatcher: this.dispatcher,
			},
			tiktokStatusSchema,
		);
	}
}

let _instance: TikTokService | undefined;
export function getTikTokService(): TikTokService {
	if (!_instance) _instance = new TikTokService();
	return _instance;
}
