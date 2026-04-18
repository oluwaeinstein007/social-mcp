import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { getRedditService } from "../../services/reddit-service.js";

const getPostsParams = z.object({
	subreddit: z.string().min(1).describe("The subreddit to fetch posts from (without r/ prefix)"),
	sort: z
		.enum(["hot", "new", "top", "rising"])
		.default("hot")
		.describe("Sort order for posts"),
	limit: z.number().int().min(1).max(100).default(10).describe("Number of posts to retrieve"),
});

type GetPostsParams = z.infer<typeof getPostsParams>;

export const getPostsTool = {
	name: "REDDIT_GET_POSTS",
	description: "Get posts from a Reddit subreddit",
	parameters: getPostsParams,
	execute: async (params: GetPostsParams) => {
		try {
			const result = await getRedditService().getPosts(
				params.subreddit,
				params.sort,
				params.limit,
			);
			const posts = result.data.children;
			if (posts.length === 0) return `No posts found in r/${params.subreddit}.`;
			const lines = posts.map((p, i) => {
				const d = p.data;
				const created = d.created_utc ? new Date(d.created_utc * 1000).toISOString() : "unknown";
				return `${i + 1}. [${created}] ${d.title ?? "(no title)"}\n   Score: ${d.score ?? 0} | Comments: ${d.num_comments ?? 0} | Author: u/${d.author ?? "unknown"}\n   https://reddit.com${d.permalink ?? ""}`;
			});
			return `Posts from r/${params.subreddit} (${params.sort}):\n\n${lines.join("\n\n")}`;
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error fetching Reddit posts: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
