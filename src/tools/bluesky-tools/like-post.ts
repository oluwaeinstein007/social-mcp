import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { getBlueskyService } from "../../services/bluesky-service.js";

const likePostParams = z.object({
	postUri: z.string().describe("The AT URI of the post to like"),
	postCid: z.string().describe("The CID of the post to like"),
});

type LikePostParams = z.infer<typeof likePostParams>;

export const likePostTool = {
	name: "BLUESKY_LIKE_POST",
	description: "Like a post on Bluesky",
	parameters: likePostParams,
	execute: async (params: LikePostParams) => {
		try {
			const result = await getBlueskyService().likePost(
				params.postUri,
				params.postCid,
			);
			return `Post liked successfully on Bluesky!\n\nLike URI: ${result.uri}`;
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error liking Bluesky post: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
