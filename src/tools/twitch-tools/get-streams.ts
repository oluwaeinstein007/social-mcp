import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { TwitchService, getTwitchService } from "../../services/twitch-service.js";

const params = z.object({
	userLogins: z
		.array(z.string())
		.optional()
		.describe("Filter by specific streamer usernames (up to 100)"),
	gameId: z.string().optional().describe("Filter by Twitch game/category ID"),
	first: z.number().int().min(1).max(100).optional().default(10).describe("Number of streams (default: 10, max: 100)"),
	clientId: z.string().optional().describe("Twitch client ID (overrides TWITCH_CLIENT_ID env var)"),
	clientSecret: z.string().optional().describe("Twitch client secret (overrides TWITCH_CLIENT_SECRET env var)"),
});

type Params = z.infer<typeof params>;

export const getStreamsTool = {
	name: "TWITCH_GET_STREAMS",
	description: "Get currently live Twitch streams, optionally filtered by streamer usernames or game category.",
	parameters: params,
	execute: async (p: Params) => {
		try {
			const service =
				p.clientId && p.clientSecret
					? new TwitchService({ clientId: p.clientId, clientSecret: p.clientSecret })
					: getTwitchService();

			const result = await service.getStreams({
				userLogins: p.userLogins,
				gameId: p.gameId,
				first: p.first ?? 10,
			});

			if (!result.data.length) return "No live streams found.";

			return [
				`Live Twitch Streams (${result.data.length}):`,
				``,
				...result.data.map((s, i) => [
					`${i + 1}. ${s.user_name} (@${s.user_login})`,
					...(s.title ? [`   "${s.title}"`] : []),
					...(s.game_name ? [`   Game: ${s.game_name}`] : []),
					...(s.viewer_count != null ? [`   Viewers: ${s.viewer_count.toLocaleString()}`] : []),
					...(s.started_at ? [`   Started: ${s.started_at}`] : []),
					...(s.language ? [`   Language: ${s.language}`] : []),
				].join("\n")),
			].join("\n");
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error fetching Twitch streams: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
