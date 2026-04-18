import { z } from "zod";
import { config } from "../lib/config.js";
import { CredentialsError } from "../lib/errors.js";
import { fetchJson } from "../lib/http.js";

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
		.object({ code: z.string(), message: z.string(), log_id: z.string().optional() })
		.optional(),
});

export class TikTokService {
	private baseUrl = config.tiktok.baseUrl;
	private headers: Record<string, string>;

	constructor() {
		if (!config.tiktok.accessToken) {
			throw new CredentialsError("TikTok", ["TIKTOK_ACCESS_TOKEN"]);
		}
		this.headers = {
			"Content-Type": "application/json; charset=UTF-8",
			Authorization: `Bearer ${config.tiktok.accessToken}`,
		};
	}

	async queryCreatorInfo() {
		return fetchJson(
			`${this.baseUrl}/post/publish/creator_info/query/`,
			{ method: "POST", headers: this.headers, body: JSON.stringify({}) },
			tiktokCreatorInfoSchema,
		);
	}

	async directPostVideo(
		videoUrl: string,
		title: string,
		privacyLevel: string,
		disableDuet = false,
		disableComment = false,
		disableStitch = false,
	) {
		const body = {
			post_info: {
				title,
				privacy_level: privacyLevel,
				disable_duet: disableDuet,
				disable_comment: disableComment,
				disable_stitch: disableStitch,
			},
			source_info: {
				source: "PULL_FROM_URL",
				video_url: videoUrl,
			},
		};
		return fetchJson(
			`${this.baseUrl}/post/publish/video/init/`,
			{ method: "POST", headers: this.headers, body: JSON.stringify(body) },
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
			{ method: "POST", headers: this.headers, body: JSON.stringify(body) },
			tiktokPostInitSchema,
		);
	}

	async getUserInfo() {
		const fields =
			"open_id,union_id,avatar_url,display_name,bio_description,profile_deep_link,is_verified,follower_count,following_count,likes_count,video_count";
		return fetchJson(
			`${this.baseUrl}/user/info/?fields=${fields}`,
			{ method: "GET", headers: this.headers },
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
