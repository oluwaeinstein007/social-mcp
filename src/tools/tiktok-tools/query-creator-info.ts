import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { getTikTokService } from "../../services/tiktok-service.js";

export const queryCreatorInfoTool = {
	name: "TIKTOK_QUERY_CREATOR_INFO",
	description: "Query TikTok creator info including posting permissions, privacy options, and video duration limits",
	parameters: z.object({}),
	execute: async () => {
		try {
			const result = await getTikTokService().queryCreatorInfo();
			if (result.error?.code && result.error.code !== "ok") {
				return `TikTok API error: ${result.error.message}`;
			}
			const d = result.data;
			return [
				`TikTok Creator Info:`,
				d.creator_username ? `Username: @${d.creator_username}` : null,
				d.creator_nickname ? `Nickname: ${d.creator_nickname}` : null,
				d.privacy_level_options
					? `Privacy options: ${d.privacy_level_options.join(", ")}`
					: null,
				d.max_video_post_duration_sec
					? `Max video duration: ${d.max_video_post_duration_sec}s`
					: null,
				`Comment disabled: ${d.comment_disabled ?? false}`,
				`Duet disabled: ${d.duet_disabled ?? false}`,
				`Stitch disabled: ${d.stitch_disabled ?? false}`,
			]
				.filter(Boolean)
				.join("\n");
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error querying TikTok creator info: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
