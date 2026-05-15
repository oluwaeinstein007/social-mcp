import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { TwitchService, getTwitchService } from "../../services/twitch-service.js";

const params = z.object({
	query: z.string().min(1).describe("Search term (channel name or partial match)"),
	liveOnly: z.boolean().optional().default(false).describe("Only return channels that are currently live"),
	first: z.number().int().min(1).max(100).optional().default(10).describe("Number of results (default: 10, max: 100)"),
	clientId: z.string().optional().describe("Twitch client ID (overrides TWITCH_CLIENT_ID env var)"),
	clientSecret: z.string().optional().describe("Twitch client secret (overrides TWITCH_CLIENT_SECRET env var)"),
});

type Params = z.infer<typeof params>;

export const searchChannelsTool = {
	name: "TWITCH_SEARCH_CHANNELS",
	description: "Search Twitch channels by name. Optionally filter to live-only channels.",
	parameters: params,
	execute: async (p: Params) => {
		try {
			const service =
				p.clientId && p.clientSecret
					? new TwitchService({ clientId: p.clientId, clientSecret: p.clientSecret })
					: getTwitchService();

			const result = await service.searchChannels(p.query, p.liveOnly ?? false, p.first ?? 10);
			if (!result.data.length) return `No channels found for "${p.query}".`;

			return [
				`Twitch Channel Search: "${p.query}" (${result.data.length} results)`,
				``,
				...result.data.map((c, i) => [
					`${i + 1}. ${c.display_name} (@${c.broadcaster_login}) ${c.is_live ? "[LIVE]" : ""}`,
					...(c.title ? [`   Title: ${c.title}`] : []),
					...(c.game_name ? [`   Category: ${c.game_name}`] : []),
					...(c.tags?.length ? [`   Tags: ${c.tags.join(", ")}`] : []),
				].join("\n")),
			].join("\n");
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error searching Twitch channels: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
