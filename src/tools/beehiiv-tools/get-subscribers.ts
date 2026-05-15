import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { BeehiivService, getBeehiivService } from "../../services/beehiiv-service.js";

const params = z.object({
	page: z.number().int().positive().optional().default(1).describe("Page number (default: 1)"),
	limit: z.number().int().min(1).max(100).optional().default(10).describe("Subscribers per page (default: 10, max: 100)"),
	publicationId: z.string().optional().describe("Beehiiv publication ID (overrides BEEHIIV_PUBLICATION_ID env var)"),
	apiKey: z.string().optional().describe("Beehiiv API key (overrides BEEHIIV_API_KEY env var)"),
});

type Params = z.infer<typeof params>;

export const getSubscribersTool = {
	name: "BEEHIIV_GET_SUBSCRIBERS",
	description: "List subscribers for a Beehiiv publication.",
	parameters: params,
	execute: async (p: Params) => {
		try {
			const service = p.apiKey
				? new BeehiivService({ apiKey: p.apiKey, publicationId: p.publicationId })
				: getBeehiivService();

			const result = await service.getSubscribers(p.publicationId, p.page ?? 1, p.limit ?? 10);
			if (!result.data.length) return "No subscribers found.";

			const total = result.total_results != null ? ` (${result.total_results} total)` : "";
			return [
				`Beehiiv Subscribers${total}:`,
				``,
				...result.data.map((sub, i) => {
					const date = sub.created
						? new Date(sub.created * 1000).toISOString().split("T")[0]
						: null;
					return [
						`${i + 1}. ${sub.email ?? sub.id}`,
						`   Status: ${sub.status}`,
						...(date ? [`   Subscribed: ${date}`] : []),
						...(sub.subscription_premium_tier_names?.length
							? [`   Tiers: ${sub.subscription_premium_tier_names.join(", ")}`]
							: []),
					].join("\n");
				}),
			].join("\n");
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error fetching Beehiiv subscribers: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
