import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { getInstagramService } from "../../services/instagram-service.js";

const getPostsParams = z.object({
	userId: z.string().describe("The Instagram user ID"),
	limit: z
		.number()
		.int()
		.min(1)
		.max(100)
		.default(10)
		.describe("Number of posts to retrieve (1-100)"),
});

type GetPostsParams = z.infer<typeof getPostsParams>;

export const getPostsTool = {
	name: "GET_INSTAGRAM_POSTS",
	description: "Retrieve recent posts from an Instagram account",
	parameters: getPostsParams,
	execute: async (params: GetPostsParams) => {
		try {
			const response = await getInstagramService().getPosts(
				params.userId,
				params.limit,
			);
			if (response.data.length === 0) {
				return "No posts found for this account.";
			}
			const list = response.data
				.map(
					(p) =>
						`ID: ${p.id}\nType: ${p.media_type}\nDate: ${p.timestamp}\nCaption: ${p.caption ?? "(no caption)"}`,
				)
				.join("\n\n");
			return `Retrieved ${response.data.length} post(s) for user ${params.userId}:\n\n${list}`;
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error retrieving posts: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
