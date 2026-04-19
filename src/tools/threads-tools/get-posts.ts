import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { getThreadsService } from "../../services/threads-service.js";

const getPostsParams = z.object({
	limit: z
		.number()
		.int()
		.min(1)
		.max(100)
		.default(10)
		.describe("Number of posts to retrieve"),
});

type GetPostsParams = z.infer<typeof getPostsParams>;

export const getPostsTool = {
	name: "THREADS_GET_POSTS",
	description: "Get recent posts from your Threads account",
	parameters: getPostsParams,
	execute: async (params: GetPostsParams) => {
		try {
			const result = await getThreadsService().getPosts(params.limit);
			if (result.data.length === 0)
				return "No posts found on your Threads account.";
			const lines = result.data.map((post, i) => {
				const ts = post.timestamp ?? "unknown time";
				const likes = post.like_count ?? 0;
				const replies = post.replies_count ?? 0;
				return `${i + 1}. [${ts}] ${post.id}\n   ${post.text ?? "(no text)"}\n   Likes: ${likes} | Replies: ${replies}${post.permalink ? `\n   ${post.permalink}` : ""}`;
			});
			return `Your Threads posts:\n\n${lines.join("\n\n")}`;
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error fetching Threads posts: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
