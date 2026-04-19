import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { getTikTokService } from "../../services/tiktok-service.js";

const photoPostParams = z.object({
	photoUrls: z
		.array(z.string().url())
		.min(1)
		.max(35)
		.describe("Array of public photo URLs (up to 35 images)"),
	title: z.string().min(1).max(90).describe("Photo post title"),
	description: z
		.string()
		.max(2200)
		.default("")
		.describe("Caption/description for the photo post"),
	privacyLevel: z
		.enum([
			"PUBLIC_TO_EVERYONE",
			"MUTUAL_FOLLOW_FRIENDS",
			"FOLLOWER_OF_CREATOR",
			"SELF_ONLY",
		])
		.default("PUBLIC_TO_EVERYONE")
		.describe("Who can view the photo post"),
});

type PhotoPostParams = z.infer<typeof photoPostParams>;

export const photoPostTool = {
	name: "TIKTOK_PHOTO_POST",
	description: "Create a photo/carousel post on TikTok using public image URLs",
	parameters: photoPostParams,
	execute: async (params: PhotoPostParams) => {
		try {
			const result = await getTikTokService().photoPost(
				params.photoUrls,
				params.title,
				params.description,
				params.privacyLevel,
			);
			if (result.error?.code && result.error.code !== "ok") {
				return `TikTok API error: ${result.error.message}`;
			}
			return `Photo post initiated on TikTok!\n\nPublish ID: ${result.data.publish_id ?? "unknown"}\n\nUse TIKTOK_GET_POST_STATUS with this publish ID to check the post status.`;
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error creating TikTok photo post: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
