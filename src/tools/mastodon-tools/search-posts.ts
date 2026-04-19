import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { getMastodonService } from "../../services/mastodon-service.js";

const searchPostsParams = z.object({
	query: z.string().min(1).describe("The search query"),
	limit: z
		.number()
		.int()
		.min(1)
		.max(40)
		.default(10)
		.describe("Maximum number of results to return (1-40)"),
});

type SearchPostsParams = z.infer<typeof searchPostsParams>;

export const searchPostsTool = {
	name: "MASTODON_SEARCH_POSTS",
	description: "Search for posts on Mastodon",
	parameters: searchPostsParams,
	execute: async (params: SearchPostsParams) => {
		try {
			const result = await getMastodonService().searchPosts(
				params.query,
				params.limit,
			);
			if (!result.statuses || result.statuses.length === 0) {
				return "No posts found for the given query.";
			}
			const list = result.statuses
				.map(
					(s) =>
						`ID: ${s.id}\nURL: ${s.url ?? "N/A"}\nContent: ${s.content.replace(/<[^>]+>/g, "")}`,
				)
				.join("\n\n");
			return `Found ${result.statuses.length} post(s):\n\n${list}`;
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error searching Mastodon posts: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
