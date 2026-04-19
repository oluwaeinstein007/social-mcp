import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { getRedditService } from "../../services/reddit-service.js";

const searchParams = z.object({
	query: z.string().min(1).describe("Search query"),
	subreddit: z
		.string()
		.optional()
		.describe(
			"Limit search to a specific subreddit (without r/ prefix). Omit to search all of Reddit",
		),
	sort: z
		.enum(["relevance", "new", "top"])
		.default("relevance")
		.describe("Sort order for search results"),
	limit: z
		.number()
		.int()
		.min(1)
		.max(100)
		.default(10)
		.describe("Number of results to return"),
});

type SearchParams = z.infer<typeof searchParams>;

export const searchTool = {
	name: "REDDIT_SEARCH",
	description:
		"Search Reddit posts across all subreddits or within a specific subreddit",
	parameters: searchParams,
	execute: async (params: SearchParams) => {
		try {
			const result = await getRedditService().search(
				params.query,
				params.subreddit,
				params.sort,
				params.limit,
			);
			const posts = result.data.children;
			if (posts.length === 0) return `No results found for "${params.query}".`;
			const scope = params.subreddit ? `r/${params.subreddit}` : "Reddit";
			const lines = posts.map((p, i) => {
				const d = p.data;
				return `${i + 1}. [r/${d.subreddit ?? "unknown"}] ${d.title ?? d.body ?? "(no text)"}\n   Score: ${d.score ?? 0} | Author: u/${d.author ?? "unknown"}\n   https://reddit.com${d.permalink ?? ""}`;
			});
			return `Search results for "${params.query}" on ${scope}:\n\n${lines.join("\n\n")}`;
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error searching Reddit: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
