import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { DevToService, getDevToService } from "../../services/devto-service.js";

const params = z.object({
	id: z.number().int().positive().describe("Article ID (visible in DEVTO_GET_MY_ARTICLES output)"),
	apiKey: z.string().optional().describe("Dev.to API key (overrides DEVTO_API_KEY env var)"),
});

type Params = z.infer<typeof params>;

export const getArticleTool = {
	name: "DEVTO_GET_ARTICLE",
	description: "Get a specific Dev.to article by ID, including its full Markdown body.",
	parameters: params,
	execute: async (p: Params) => {
		try {
			const service = p.apiKey ? new DevToService({ apiKey: p.apiKey }) : getDevToService();
			const a = await service.getArticle(p.id);
			const tags = Array.isArray(a.tag_list)
				? a.tag_list.join(", ")
				: a.tag_list ?? "";

			return [
				`Title: ${a.title}`,
				`ID: ${a.id}`,
				`Published: ${a.published ? "Yes" : "Draft"}`,
				...(a.published_at ? [`Published At: ${a.published_at}`] : []),
				...(a.url ? [`URL: ${a.url}`] : []),
				...(tags ? [`Tags: ${tags}`] : []),
				...(a.description ? [`Description: ${a.description}`] : []),
				...(a.reading_time_minutes != null ? [`Reading Time: ${a.reading_time_minutes} min`] : []),
				...(a.comments_count != null ? [`Comments: ${a.comments_count}`] : []),
				...(a.positive_reactions_count != null ? [`Reactions: ${a.positive_reactions_count}`] : []),
				...(a.body_markdown ? [`\n--- Body ---\n${a.body_markdown}`] : []),
			].join("\n");
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error fetching Dev.to article: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
