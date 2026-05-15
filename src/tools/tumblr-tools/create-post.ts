import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { TumblrService, getTumblrService } from "../../services/tumblr-service.js";

const params = z.object({
	text: z.string().min(1).describe("Post text content (Markdown supported)"),
	title: z.string().optional().describe("Optional heading/title for the post"),
	tags: z.array(z.string()).optional().describe("Tags for the post"),
	state: z
		.enum(["published", "draft", "queue", "private"])
		.optional()
		.default("published")
		.describe("Post state (default: published)"),
	blogIdentifier: z.string().optional().describe("Blog name or URL (overrides TUMBLR_BLOG_IDENTIFIER env var)"),
	accessToken: z.string().optional().describe("Tumblr OAuth token (overrides TUMBLR_ACCESS_TOKEN env var)"),
});

type Params = z.infer<typeof params>;

export const createPostTool = {
	name: "TUMBLR_CREATE_POST",
	description: "Create a text post on Tumblr using the Neue Post Format (NPF).",
	parameters: params,
	execute: async (p: Params) => {
		try {
			const service = p.accessToken
				? new TumblrService({ accessToken: p.accessToken, blogIdentifier: p.blogIdentifier })
				: getTumblrService();

			const content: Array<{ type: string; text: string; subtype?: string }> = [
				{ type: "text", text: p.text },
			];

			const result = await service.createPost(
				p.blogIdentifier,
				content,
				p.tags ?? [],
				p.state ?? "published",
				p.title,
			);

			const post = result.response;
			return [
				`Tumblr post ${p.state === "draft" ? "saved as draft" : p.state === "queue" ? "added to queue" : "published"}!`,
				``,
				`ID: ${post.id_string ?? post.id}`,
				...(post.state ? [`State: ${post.state}`] : []),
				...(post.post_url ? [`URL: ${post.post_url}`] : []),
			].join("\n");
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error creating Tumblr post: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
