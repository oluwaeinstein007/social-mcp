import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { GhostService, getGhostService } from "../../services/ghost-service.js";

const params = z.object({
	title: z.string().min(1).describe("Post title"),
	html: z.string().optional().describe("Post body as HTML"),
	status: z
		.enum(["draft", "published", "scheduled"])
		.optional()
		.default("draft")
		.describe("Post status (default: draft)"),
	tags: z
		.array(z.string())
		.optional()
		.describe("Tag names to assign to the post"),
	excerpt: z.string().optional().describe("Custom excerpt shown in listings"),
	publishedAt: z
		.string()
		.optional()
		.describe("ISO 8601 date for scheduling, e.g. '2024-12-25T09:00:00.000Z'"),
	featureImage: z
		.string()
		.optional()
		.describe(
			"Feature image: a public URL, or base64-encoded image bytes to upload.",
		),
	featureImageFilename: z
		.string()
		.optional()
		.describe("Filename to use when `featureImage` is base64-encoded bytes."),
	siteUrl: z
		.string()
		.optional()
		.describe("Ghost site URL (overrides GHOST_SITE_URL env var)"),
	adminApiKey: z
		.string()
		.optional()
		.describe(
			"Ghost Admin API key id:secret (overrides GHOST_ADMIN_API_KEY env var)",
		),
});

type Params = z.infer<typeof params>;

export const createPostTool = {
	name: "GHOST_CREATE_POST",
	description:
		"Create a post on a Ghost blog via the Admin API. Supports draft, published, and scheduled statuses.",
	parameters: params,
	execute: async (p: Params) => {
		try {
			const service =
				p.siteUrl && p.adminApiKey
					? new GhostService({ siteUrl: p.siteUrl, adminApiKey: p.adminApiKey })
					: getGhostService();

			const featureImage = p.featureImage
				? p.featureImage.startsWith("http://") ||
					p.featureImage.startsWith("https://")
					? p.featureImage
					: await service.uploadImage(p.featureImage, p.featureImageFilename)
				: undefined;

			const result = await service.createPost(
				p.title,
				p.html,
				undefined,
				p.status ?? "draft",
				p.tags ?? [],
				p.excerpt,
				p.publishedAt,
				featureImage,
			);

			const post = result.posts[0];
			if (!post) return "Post may have been created but no data was returned.";

			return [
				`Ghost post ${post.status === "draft" ? "saved as draft" : post.status === "scheduled" ? "scheduled" : "published"}!`,
				``,
				`Title: ${post.title}`,
				`ID: ${post.id}`,
				`Status: ${post.status}`,
				...(post.url ? [`URL: ${post.url}`] : []),
				...(post.slug ? [`Slug: ${post.slug}`] : []),
			].join("\n");
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error creating Ghost post: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
