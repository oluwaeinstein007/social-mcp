import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { getMediumService, MediumService } from "../../services/medium-service.js";

const createPostParams = z.object({
	authorId: z
		.string()
		.min(1)
		.describe(
			"Your Medium user ID — retrieve it with MEDIUM_GET_USER if you don't know it",
		),
	title: z.string().min(1).max(255).describe("Article title"),
	content: z
		.string()
		.min(1)
		.describe("Article body in Markdown format"),
	tags: z
		.array(z.string())
		.max(5)
		.optional()
		.describe("Up to 5 topic tags (e.g. ['programming', 'javascript'])"),
	publishStatus: z
		.enum(["public", "draft", "unlisted"])
		.optional()
		.default("public")
		.describe("Publication visibility (default: public)"),
	canonicalUrl: z
		.string()
		.url()
		.optional()
		.describe("Canonical URL if this is a cross-post from another site"),
	accessToken: z
		.string()
		.optional()
		.describe("Medium integration token (overrides MEDIUM_ACCESS_TOKEN env var)"),
});

type CreatePostParams = z.infer<typeof createPostParams>;

export const createPostTool = {
	name: "MEDIUM_CREATE_POST",
	description:
		"Publish a Markdown article to Medium. Up to 5 tags. First line of content is used as the article title in the API call.",
	parameters: createPostParams,
	execute: async (params: CreatePostParams) => {
		try {
			const service = params.accessToken
				? new MediumService({ accessToken: params.accessToken })
				: getMediumService();

			const result = await service.createPost(
				params.authorId,
				params.title,
				params.content,
				params.tags ?? [],
				params.publishStatus ?? "public",
				params.canonicalUrl,
			);

			const post = result.data;
			return [
				`Article published to Medium!`,
				``,
				`Title: ${post.title}`,
				`Status: ${post.publishStatus}`,
				`URL: ${post.url}`,
				...(post.tags?.length ? [`Tags: ${post.tags.join(", ")}`] : []),
			].join("\n");
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error publishing to Medium: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
