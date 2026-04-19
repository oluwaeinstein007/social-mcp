import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { getBlueskyService } from "../../services/bluesky-service.js";

const deletePostParams = z.object({
	postUri: z
		.string()
		.describe(
			"The AT URI of the post to delete (e.g. at://did:plc:.../app.bsky.feed.post/...)",
		),
});

type DeletePostParams = z.infer<typeof deletePostParams>;

export const deletePostTool = {
	name: "BLUESKY_DELETE_POST",
	description: "Delete a post on Bluesky",
	parameters: deletePostParams,
	execute: async (params: DeletePostParams) => {
		try {
			await getBlueskyService().deletePost(params.postUri);
			return `Post deleted successfully on Bluesky!\n\nDeleted URI: ${params.postUri}`;
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error deleting Bluesky post: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
