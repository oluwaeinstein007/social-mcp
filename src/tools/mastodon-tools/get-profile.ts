import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { getMastodonService } from "../../services/mastodon-service.js";

export const getProfileTool = {
	name: "MASTODON_GET_PROFILE",
	description: "Get your own Mastodon profile information",
	parameters: z.object({}),
	execute: async () => {
		try {
			const profile = await getMastodonService().getProfile();
			const lines = [
				`Profile retrieved successfully!`,
				``,
				`Username: @${profile.acct}`,
				`Display Name: ${profile.display_name || "N/A"}`,
				`ID: ${profile.id}`,
				`Bio: ${profile.note ? profile.note.replace(/<[^>]+>/g, "") : "N/A"}`,
				`Followers: ${profile.followers_count ?? 0}`,
				`Following: ${profile.following_count ?? 0}`,
				`Posts: ${profile.statuses_count ?? 0}`,
				`URL: ${profile.url ?? "N/A"}`,
			];
			return lines.join("\n");
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error getting Mastodon profile: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
