import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { getBlueskyService } from "../../services/bluesky-service.js";

const searchPostsParams = z.object({
	query: z.string().min(1).describe("The search query"),
	limit: z
		.number()
		.int()
		.min(1)
		.max(100)
		.default(10)
		.describe("Maximum number of results to return (1-100)"),
});

type SearchPostsParams = z.infer<typeof searchPostsParams>;

export const searchPostsTool = {
	name: "BLUESKY_SEARCH_POSTS",
	description: "Search for posts on Bluesky",
	parameters: searchPostsParams,
	execute: async (params: SearchPostsParams) => {
		try {
			const result = await getBlueskyService().searchPosts(
				params.query,
				params.limit,
			);
			if (!result.posts || result.posts.length === 0) {
				return "No posts found for the given query.";
			}
			const list = result.posts
				.map(
					(p) =>
						`URI: ${p.uri}\nAuthor: @${(p.author as { handle?: string }).handle ?? "unknown"}\nText: ${(p.record as { text?: string }).text ?? ""}`,
				)
				.join("\n\n");
			return `Found ${result.posts.length} post(s):\n\n${list}`;
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error searching Bluesky posts: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
