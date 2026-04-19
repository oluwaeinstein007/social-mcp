import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { getMastodonService } from "../../services/mastodon-service.js";

const deletePostParams = z.object({
	statusId: z.string().describe("The ID of the post to delete"),
});

type DeletePostParams = z.infer<typeof deletePostParams>;

export const deletePostTool = {
	name: "MASTODON_DELETE_POST",
	description: "Delete a post on Mastodon",
	parameters: deletePostParams,
	execute: async (params: DeletePostParams) => {
		try {
			await getMastodonService().deletePost(params.statusId);
			return `Post deleted successfully on Mastodon!\n\nDeleted Post ID: ${params.statusId}`;
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error deleting Mastodon post: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
