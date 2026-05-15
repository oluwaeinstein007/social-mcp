import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { TwitchService, getTwitchService } from "../../services/twitch-service.js";

const params = z.object({
	broadcasterId: z.string().describe("Channel ID to send the message to (get via TWITCH_GET_USER)"),
	senderId: z.string().describe("User ID of the bot/user sending the message (must match the access token owner)"),
	message: z.string().min(1).max(500).describe("Chat message content (max 500 characters)"),
	clientId: z.string().optional().describe("Twitch client ID (overrides TWITCH_CLIENT_ID env var)"),
	clientSecret: z.string().optional().describe("Twitch client secret (overrides TWITCH_CLIENT_SECRET env var)"),
	accessToken: z.string().optional().describe("User OAuth token with chat:edit scope (overrides TWITCH_ACCESS_TOKEN env var)"),
});

type Params = z.infer<typeof params>;

export const sendChatMessageTool = {
	name: "TWITCH_SEND_CHAT_MESSAGE",
	description:
		"Send a message to a Twitch chat channel. Requires a user OAuth token with the 'chat:edit' scope (set TWITCH_ACCESS_TOKEN).",
	parameters: params,
	execute: async (p: Params) => {
		try {
			const service =
				p.clientId && p.clientSecret
					? new TwitchService({ clientId: p.clientId, clientSecret: p.clientSecret, accessToken: p.accessToken })
					: getTwitchService();

			const result = await service.sendChatMessage(p.broadcasterId, p.senderId, p.message);
			const sent = result.data[0];

			if (!sent?.is_sent) {
				return `Message was not sent. Response: ${JSON.stringify(result)}`;
			}

			return [
				`Chat message sent to Twitch channel!`,
				`Message ID: ${sent.message_id}`,
				`Content: ${p.message}`,
			].join("\n");
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error sending Twitch chat message: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
