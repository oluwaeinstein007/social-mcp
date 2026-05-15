import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { DevToService, getDevToService } from "../../services/devto-service.js";

const params = z.object({
	title: z.string().min(1).max(255).describe("Article title"),
	bodyMarkdown: z.string().min(1).describe("Article body in Markdown format"),
	tags: z
		.array(z.string())
		.max(4)
		.optional()
		.describe("Up to 4 tags (e.g. ['javascript', 'webdev'])"),
	published: z
		.boolean()
		.optional()
		.default(false)
		.describe("Whether to publish immediately (default: false = draft)"),
	description: z.string().max(160).optional().describe("Short description/subtitle shown in listings"),
	canonicalUrl: z.string().url().optional().describe("Canonical URL if cross-posting from another site"),
	series: z.string().optional().describe("Series name to group related articles"),
	mainImage: z.string().url().optional().describe("Cover image URL"),
	apiKey: z.string().optional().describe("Dev.to API key (overrides DEVTO_API_KEY env var)"),
});

type Params = z.infer<typeof params>;

export const createArticleTool = {
	name: "DEVTO_CREATE_ARTICLE",
	description: "Create or draft an article on Dev.to. Set published=true to publish immediately, or false (default) to save as draft.",
	parameters: params,
	execute: async (p: Params) => {
		try {
			const service = p.apiKey ? new DevToService({ apiKey: p.apiKey }) : getDevToService();
			const article = await service.createArticle(
				p.title,
				p.bodyMarkdown,
				p.tags ?? [],
				p.published ?? false,
				p.description,
				p.canonicalUrl,
				p.series,
				p.mainImage,
			);
			return [
				`Article ${article.published ? "published" : "saved as draft"} on Dev.to!`,
				``,
				`Title: ${article.title}`,
				`ID: ${article.id}`,
				...(article.url ? [`URL: ${article.url}`] : []),
				...(article.slug ? [`Slug: ${article.slug}`] : []),
			].join("\n");
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error creating Dev.to article: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
