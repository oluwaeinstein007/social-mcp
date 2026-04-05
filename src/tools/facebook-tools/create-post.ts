import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { getFacebookService } from "../../services/facebook-service.js";

const createPostParams = z.object({
	pageId: z.string().describe("The ID of the Facebook page"),
	message: z.string().min(1).describe("The text of the post"),
});

type CreatePostParams = z.infer<typeof createPostParams>;

export const createPostTool = {
	name: "CREATE_FACEBOOK_POST",
	description: "Create a post on a Facebook page",
	parameters: createPostParams,
	execute: async (params: CreatePostParams) => {
		try {
			const post = await getFacebookService().createPost(
				params.pageId,
				params.message,
			);
			return `Post created successfully on Facebook!\n\nPost ID: ${post.post_id ?? post.id}\nPage Post ID: ${post.id}`;
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error creating post: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
