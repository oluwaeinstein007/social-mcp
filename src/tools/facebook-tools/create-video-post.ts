import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { getFacebookService } from "../../services/facebook-service.js";

const createVideoPostParams = z.object({
	pageId: z.string().describe("The ID of the Facebook page"),
	description: z.string().describe("The caption/description for the video"),
	video: z
		.string()
		.describe("A public video URL, or base64-encoded video bytes"),
	filename: z
		.string()
		.optional()
		.describe("Filename to use when `video` is base64-encoded bytes."),
});

type CreateVideoPostParams = z.infer<typeof createVideoPostParams>;

export const createVideoPostTool = {
	name: "CREATE_FACEBOOK_VIDEO_POST",
	description: "Upload and publish a video on a Facebook page",
	parameters: createVideoPostParams,
	execute: async (params: CreateVideoPostParams) => {
		try {
			const post = await getFacebookService().createVideoPost(
				params.pageId,
				params.description,
				{ video: params.video, filename: params.filename },
			);
			return `Video posted successfully on Facebook!\n\nPost ID: ${post.post_id ?? post.id}`;
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error posting video: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
