import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { TumblrService, getTumblrService } from "../../services/tumblr-service.js";

const params = z.object({
	blogIdentifier: z.string().optional().describe("Blog name or URL (overrides TUMBLR_BLOG_IDENTIFIER env var)"),
	accessToken: z.string().optional().describe("Tumblr OAuth token (overrides TUMBLR_ACCESS_TOKEN env var)"),
});

type Params = z.infer<typeof params>;

export const getBlogInfoTool = {
	name: "TUMBLR_GET_BLOG_INFO",
	description: "Get info about a Tumblr blog including title, description, post count, and follower count.",
	parameters: params,
	execute: async (p: Params) => {
		try {
			const service = p.accessToken
				? new TumblrService({ accessToken: p.accessToken, blogIdentifier: p.blogIdentifier })
				: getTumblrService();

			const result = await service.getBlogInfo(p.blogIdentifier);
			const blog = result.response.blog;
			const updated = blog.updated ? new Date(blog.updated * 1000).toISOString().split("T")[0] : null;

			return [
				`Tumblr Blog: ${blog.name}`,
				``,
				...(blog.title ? [`Title: ${blog.title}`] : []),
				...(blog.description ? [`Description: ${blog.description}`] : []),
				...(blog.url ? [`URL: ${blog.url}`] : []),
				...(blog.posts != null ? [`Posts: ${blog.posts}`] : []),
				...(blog.followers != null ? [`Followers: ${blog.followers}`] : []),
				...(updated ? [`Last Updated: ${updated}`] : []),
			].join("\n");
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error fetching Tumblr blog info: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
