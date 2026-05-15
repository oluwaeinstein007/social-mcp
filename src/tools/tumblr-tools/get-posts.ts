import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { TumblrService, getTumblrService } from "../../services/tumblr-service.js";

const params = z.object({
	offset: z.number().int().min(0).optional().default(0).describe("Pagination offset (default: 0)"),
	limit: z.number().int().min(1).max(50).optional().default(10).describe("Number of posts (default: 10, max: 50)"),
	type: z
		.enum(["text", "quote", "link", "answer", "video", "audio", "photo", "chat"])
		.optional()
		.describe("Filter by post type"),
	blogIdentifier: z.string().optional().describe("Blog name or URL (overrides TUMBLR_BLOG_IDENTIFIER env var)"),
	accessToken: z.string().optional().describe("Tumblr OAuth token (overrides TUMBLR_ACCESS_TOKEN env var)"),
});

type Params = z.infer<typeof params>;

export const getPostsTool = {
	name: "TUMBLR_GET_POSTS",
	description: "Get posts from a Tumblr blog.",
	parameters: params,
	execute: async (p: Params) => {
		try {
			const service = p.accessToken
				? new TumblrService({ accessToken: p.accessToken, blogIdentifier: p.blogIdentifier })
				: getTumblrService();

			const result = await service.getPosts(p.blogIdentifier, p.type, p.offset ?? 0, p.limit ?? 10);
			const posts = result.response.posts;
			if (!posts.length) return "No posts found.";

			const total = result.response.total_posts != null ? ` (${result.response.total_posts} total)` : "";
			return [
				`Tumblr Posts${total}:`,
				``,
				...posts.map((post, i) => {
					const id = post.id_string ?? String(post.id);
					const tags = post.tags?.join(", ") ?? "";
					const preview = post.summary ?? post.title ?? post.body?.slice(0, 80) ?? "";
					return [
						`${i + 1}. [${post.type ?? "post"}] ${preview || id}`,
						`   ID: ${id}`,
						...(post.post_url ? [`   URL: ${post.post_url}`] : []),
						...(post.date ? [`   Date: ${post.date}`] : []),
						...(tags ? [`   Tags: ${tags}`] : []),
						...(post.note_count != null ? [`   Notes: ${post.note_count}`] : []),
					].join("\n");
				}),
			].join("\n");
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error fetching Tumblr posts: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
