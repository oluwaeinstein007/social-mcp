import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { BeehiivService, getBeehiivService } from "../../services/beehiiv-service.js";

const params = z.object({
	page: z.number().int().positive().optional().default(1).describe("Page number (default: 1)"),
	limit: z.number().int().min(1).max(100).optional().default(10).describe("Posts per page (default: 10, max: 100)"),
	publicationId: z.string().optional().describe("Beehiiv publication ID (overrides BEEHIIV_PUBLICATION_ID env var)"),
	apiKey: z.string().optional().describe("Beehiiv API key (overrides BEEHIIV_API_KEY env var)"),
});

type Params = z.infer<typeof params>;

export const getPostsTool = {
	name: "BEEHIIV_GET_POSTS",
	description: "List posts for a Beehiiv publication, including send stats.",
	parameters: params,
	execute: async (p: Params) => {
		try {
			const service = p.apiKey
				? new BeehiivService({ apiKey: p.apiKey, publicationId: p.publicationId })
				: getBeehiivService();

			const result = await service.getPosts(p.publicationId, p.page ?? 1, p.limit ?? 10);
			if (!result.data.length) return "No posts found.";

			const total = result.total_results != null ? ` (${result.total_results} total)` : "";
			return [
				`Beehiiv Posts${total}:`,
				``,
				...result.data.map((post, i) => {
					const date = post.publish_date
						? new Date(post.publish_date * 1000).toISOString().split("T")[0]
						: null;
					const openRate = post.stats?.email?.open_rate != null
						? `${(post.stats.email.open_rate * 100).toFixed(1)}%`
						: null;
					return [
						`${i + 1}. ${post.title ?? post.id}`,
						`   ID: ${post.id} | Status: ${post.status}`,
						...(date ? [`   Published: ${date}`] : []),
						...(post.audience ? [`   Audience: ${post.audience}`] : []),
						...(openRate ? [`   Open Rate: ${openRate}`] : []),
						...(post.web_url ? [`   URL: ${post.web_url}`] : []),
					].join("\n");
				}),
			].join("\n");
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error fetching Beehiiv posts: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
