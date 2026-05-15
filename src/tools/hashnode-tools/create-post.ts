import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { HashnodeService, getHashnodeService } from "../../services/hashnode-service.js";

const params = z.object({
	title: z.string().min(1).describe("Post title"),
	contentMarkdown: z.string().min(1).describe("Post body in Markdown format"),
	tags: z
		.array(z.object({ name: z.string(), slug: z.string() }))
		.optional()
		.describe("Tags as [{name, slug}] — slug is the lowercase hyphenated version of the tag name"),
	publicationId: z.string().optional().describe("Hashnode publication ID (overrides HASHNODE_PUBLICATION_ID env var)"),
	subtitle: z.string().optional().describe("Subtitle displayed below the title"),
	coverImageUrl: z.string().url().optional().describe("Cover image URL"),
	disableComments: z.boolean().optional().default(false).describe("Disable comments on the post"),
	accessToken: z.string().optional().describe("Hashnode Personal Access Token (overrides HASHNODE_ACCESS_TOKEN env var)"),
});

type Params = z.infer<typeof params>;

export const createPostTool = {
	name: "HASHNODE_CREATE_POST",
	description: "Publish a post to a Hashnode publication.",
	parameters: params,
	execute: async (p: Params) => {
		try {
			const service = p.accessToken
				? new HashnodeService({ accessToken: p.accessToken, publicationId: p.publicationId })
				: getHashnodeService();

			const result = await service.createPost(
				p.title,
				p.contentMarkdown,
				p.tags ?? [],
				p.publicationId,
				p.subtitle,
				p.coverImageUrl,
				p.disableComments ?? false,
			);

			const post = result.data?.publishPost.post;
			if (!post) return "Post may have been created but no data was returned.";

			return [
				`Post published to Hashnode!`,
				``,
				`Title: ${post.title}`,
				`ID: ${post.id}`,
				...(post.url ? [`URL: ${post.url}`] : []),
				...(post.slug ? [`Slug: ${post.slug}`] : []),
			].join("\n");
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error publishing to Hashnode: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
