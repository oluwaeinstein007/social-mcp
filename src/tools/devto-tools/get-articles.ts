import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { DevToService, getDevToService } from "../../services/devto-service.js";

const params = z.object({
	page: z.number().int().positive().optional().default(1).describe("Page number (default: 1)"),
	perPage: z.number().int().min(1).max(100).optional().default(10).describe("Articles per page (default: 10, max: 100)"),
	apiKey: z.string().optional().describe("Dev.to API key (overrides DEVTO_API_KEY env var)"),
});

type Params = z.infer<typeof params>;

export const getArticlesTool = {
	name: "DEVTO_GET_MY_ARTICLES",
	description: "Get all articles published by the authenticated Dev.to user.",
	parameters: params,
	execute: async (p: Params) => {
		try {
			const service = p.apiKey ? new DevToService({ apiKey: p.apiKey }) : getDevToService();
			const articles = await service.getMyArticles(p.page ?? 1, p.perPage ?? 10);

			if (!articles.length) return "No articles found.";

			return articles
				.map((a, i) => {
					const tags = Array.isArray(a.tag_list)
						? a.tag_list.join(", ")
						: a.tag_list ?? "";
					return [
						`${i + 1}. ${a.title}`,
						`   ID: ${a.id} | Published: ${a.published ? "Yes" : "Draft"}`,
						...(a.url ? [`   URL: ${a.url}`] : []),
						...(tags ? [`   Tags: ${tags}`] : []),
						...(a.positive_reactions_count != null ? [`   Reactions: ${a.positive_reactions_count}`] : []),
					].join("\n");
				})
				.join("\n\n");
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error fetching Dev.to articles: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
