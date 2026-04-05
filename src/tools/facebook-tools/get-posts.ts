import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { getFacebookService } from "../../services/facebook-service.js";

const getPostsParams = z.object({
	pageId: z.string().describe("The ID of the Facebook page"),
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
	name: "GET_FACEBOOK_POSTS",
	description: "Retrieve recent posts from a Facebook page",
	parameters: getPostsParams,
	execute: async (params: GetPostsParams) => {
		try {
			const response = await getFacebookService().getPosts(
				params.pageId,
				params.limit,
			);
			if (response.data.length === 0) {
				return "No posts found on this page.";
			}
			const list = response.data
				.map(
					(p) =>
						`ID: ${p.id}\nCreated: ${p.created_time}\nMessage: ${p.message ?? "(no text)"}`,
				)
				.join("\n\n");
			return `Retrieved ${response.data.length} post(s) from page ${params.pageId}:\n\n${list}`;
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error retrieving posts: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
