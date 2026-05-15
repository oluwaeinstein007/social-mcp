import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { GhostService, getGhostService } from "../../services/ghost-service.js";

const params = z.object({
	page: z.number().int().positive().optional().default(1).describe("Page number (default: 1)"),
	limit: z.number().int().min(1).max(100).optional().default(10).describe("Posts per page (default: 10)"),
	status: z
		.enum(["all", "published", "draft"])
		.optional()
		.default("all")
		.describe("Filter by post status (default: all)"),
	siteUrl: z.string().optional().describe("Ghost site URL (overrides GHOST_SITE_URL env var)"),
	adminApiKey: z.string().optional().describe("Ghost Admin API key id:secret (overrides GHOST_ADMIN_API_KEY env var)"),
});

type Params = z.infer<typeof params>;

export const getPostsTool = {
	name: "GHOST_GET_POSTS",
	description: "List posts from a Ghost blog via the Admin API.",
	parameters: params,
	execute: async (p: Params) => {
		try {
			const service =
				p.siteUrl && p.adminApiKey
					? new GhostService({ siteUrl: p.siteUrl, adminApiKey: p.adminApiKey })
					: getGhostService();

			const result = await service.getPosts(p.page ?? 1, p.limit ?? 10, p.status ?? "all");
			if (!result.posts.length) return "No posts found.";

			const total = result.meta?.pagination?.total != null ? ` (${result.meta.pagination.total} total)` : "";
			return [
				`Ghost Posts${total}:`,
				``,
				...result.posts.map((post, i) => {
					const tags = post.tags?.map((t) => t.name).join(", ") ?? "";
					return [
						`${i + 1}. ${post.title ?? post.id}`,
						`   ID: ${post.id} | Status: ${post.status}`,
						...(post.url ? [`   URL: ${post.url}`] : []),
						...(post.published_at ? [`   Published: ${post.published_at}`] : []),
						...(tags ? [`   Tags: ${tags}`] : []),
						...(post.excerpt ? [`   Excerpt: ${post.excerpt}`] : []),
					].join("\n");
				}),
			].join("\n");
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error fetching Ghost posts: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
