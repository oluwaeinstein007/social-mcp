import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { TwitchService, getTwitchService } from "../../services/twitch-service.js";

const params = z.object({
	broadcasterId: z.string().describe("Twitch broadcaster/user ID (get it via TWITCH_GET_USER)"),
	clientId: z.string().optional().describe("Twitch client ID (overrides TWITCH_CLIENT_ID env var)"),
	clientSecret: z.string().optional().describe("Twitch client secret (overrides TWITCH_CLIENT_SECRET env var)"),
});

type Params = z.infer<typeof params>;

export const getChannelInfoTool = {
	name: "TWITCH_GET_CHANNEL_INFO",
	description: "Get detailed channel information for a Twitch broadcaster, including current game and stream title.",
	parameters: params,
	execute: async (p: Params) => {
		try {
			const service =
				p.clientId && p.clientSecret
					? new TwitchService({ clientId: p.clientId, clientSecret: p.clientSecret })
					: getTwitchService();

			const result = await service.getChannelInfo(p.broadcasterId);
			const channel = result.data[0];
			if (!channel) return `No channel found for broadcaster ID "${p.broadcasterId}".`;

			return [
				`Twitch Channel: ${channel.broadcaster_name} (@${channel.broadcaster_login})`,
				``,
				`Broadcaster ID: ${channel.broadcaster_id}`,
				...(channel.title ? [`Stream Title: ${channel.title}`] : []),
				...(channel.game_name ? [`Category: ${channel.game_name}`] : []),
				...(channel.tags?.length ? [`Tags: ${channel.tags.join(", ")}`] : []),
			].join("\n");
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error fetching Twitch channel info: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
