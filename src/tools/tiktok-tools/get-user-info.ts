import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { getTikTokService } from "../../services/tiktok-service.js";

export const getUserInfoTool = {
	name: "TIKTOK_GET_USER_INFO",
	description: "Get TikTok account profile information including follower count and engagement stats",
	parameters: z.object({}),
	execute: async () => {
		try {
			const result = await getTikTokService().getUserInfo();
			if (result.error?.code && result.error.code !== "ok") {
				return `TikTok API error: ${result.error.message}`;
			}
			const u = result.data.user;
			return [
				`TikTok User Info:`,
				u.display_name ? `Name: ${u.display_name}` : null,
				u.bio_description ? `Bio: ${u.bio_description}` : null,
				u.is_verified !== undefined ? `Verified: ${u.is_verified ? "Yes" : "No"}` : null,
				u.follower_count !== undefined ? `Followers: ${u.follower_count}` : null,
				u.following_count !== undefined ? `Following: ${u.following_count}` : null,
				u.likes_count !== undefined ? `Total likes: ${u.likes_count}` : null,
				u.video_count !== undefined ? `Videos: ${u.video_count}` : null,
				u.profile_deep_link ? `Profile: ${u.profile_deep_link}` : null,
			]
				.filter(Boolean)
				.join("\n");
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error fetching TikTok user info: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
