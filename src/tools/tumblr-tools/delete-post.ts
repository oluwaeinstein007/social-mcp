import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { TumblrService, getTumblrService } from "../../services/tumblr-service.js";

const params = z.object({
	postId: z.string().describe("Post ID to delete (from TUMBLR_GET_POSTS)"),
	blogIdentifier: z.string().optional().describe("Blog name or URL (overrides TUMBLR_BLOG_IDENTIFIER env var)"),
	accessToken: z.string().optional().describe("Tumblr OAuth token (overrides TUMBLR_ACCESS_TOKEN env var)"),
});

type Params = z.infer<typeof params>;

export const deletePostTool = {
	name: "TUMBLR_DELETE_POST",
	description: "Permanently delete a Tumblr post by ID.",
	parameters: params,
	execute: async (p: Params) => {
		try {
			const service = p.accessToken
				? new TumblrService({ accessToken: p.accessToken, blogIdentifier: p.blogIdentifier })
				: getTumblrService();

			await service.deletePost(p.postId, p.blogIdentifier);
			return `Tumblr post ${p.postId} deleted successfully.`;
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error deleting Tumblr post: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
