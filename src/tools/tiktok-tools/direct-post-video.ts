import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { getTikTokService } from "../../services/tiktok-service.js";

const directPostVideoParams = z.object({
	videoUrl: z.string().url().describe("Public URL of the video to post (must be accessible by TikTok servers)"),
	title: z.string().min(1).max(150).describe("Video title/caption"),
	privacyLevel: z
		.enum(["PUBLIC_TO_EVERYONE", "MUTUAL_FOLLOW_FRIENDS", "FOLLOWER_OF_CREATOR", "SELF_ONLY"])
		.default("PUBLIC_TO_EVERYONE")
		.describe("Who can view the video"),
	disableDuet: z.boolean().default(false).describe("Disable duet for this video"),
	disableComment: z.boolean().default(false).describe("Disable comments for this video"),
	disableStitch: z.boolean().default(false).describe("Disable stitch for this video"),
});

type DirectPostVideoParams = z.infer<typeof directPostVideoParams>;

export const directPostVideoTool = {
	name: "TIKTOK_DIRECT_POST_VIDEO",
	description: "Post a video to TikTok by providing a public URL (TikTok pulls the video from the URL)",
	parameters: directPostVideoParams,
	execute: async (params: DirectPostVideoParams) => {
		try {
			const result = await getTikTokService().directPostVideo(
				params.videoUrl,
				params.title,
				params.privacyLevel,
				params.disableDuet,
				params.disableComment,
				params.disableStitch,
			);
			if (result.error?.code && result.error.code !== "ok") {
				return `TikTok API error: ${result.error.message}`;
			}
			return `Video post initiated on TikTok!\n\nPublish ID: ${result.data.publish_id ?? "unknown"}\nUpload URL: ${result.data.upload_url ?? "N/A"}\n\nUse TIKTOK_GET_POST_STATUS with this publish ID to check the post status.`;
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error posting TikTok video: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
