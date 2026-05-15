import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { TwitchService, getTwitchService } from "../../services/twitch-service.js";

const params = z.object({
	login: z.string().optional().describe("Twitch username to look up (omit to get the authenticated user)"),
	clientId: z.string().optional().describe("Twitch client ID (overrides TWITCH_CLIENT_ID env var)"),
	clientSecret: z.string().optional().describe("Twitch client secret (overrides TWITCH_CLIENT_SECRET env var)"),
});

type Params = z.infer<typeof params>;

export const getUserTool = {
	name: "TWITCH_GET_USER",
	description: "Get Twitch user info by username, including their bio, follower count, and broadcaster type.",
	parameters: params,
	execute: async (p: Params) => {
		try {
			const service =
				p.clientId && p.clientSecret
					? new TwitchService({ clientId: p.clientId, clientSecret: p.clientSecret })
					: getTwitchService();

			const result = await service.getUser(p.login);
			const user = result.data[0];
			if (!user) return `No Twitch user found${p.login ? ` for "${p.login}"` : ""}.`;

			return [
				`Twitch User: ${user.display_name} (@${user.login})`,
				``,
				`ID: ${user.id}`,
				...(user.broadcaster_type ? [`Type: ${user.broadcaster_type || "regular"}`] : []),
				...(user.description ? [`Bio: ${user.description}`] : []),
				...(user.view_count != null ? [`Total Views: ${user.view_count.toLocaleString()}`] : []),
				...(user.created_at ? [`Joined: ${user.created_at}`] : []),
			].join("\n");
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error fetching Twitch user: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
