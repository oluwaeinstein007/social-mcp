import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { getBlueskyService } from "../../services/bluesky-service.js";

const getProfileParams = z.object({
	handle: z
		.string()
		.describe("The Bluesky handle to look up (e.g. user.bsky.social)"),
});

type GetProfileParams = z.infer<typeof getProfileParams>;

export const getProfileTool = {
	name: "BLUESKY_GET_PROFILE",
	description: "Get a Bluesky user profile by handle",
	parameters: getProfileParams,
	execute: async (params: GetProfileParams) => {
		try {
			const profile = await getBlueskyService().getProfile(params.handle);
			const lines = [
				`Profile retrieved successfully!`,
				``,
				`Handle: @${profile.handle}`,
				`Display Name: ${profile.displayName ?? "N/A"}`,
				`DID: ${profile.did}`,
				`Bio: ${profile.description ?? "N/A"}`,
				`Followers: ${profile.followersCount ?? 0}`,
				`Following: ${profile.followsCount ?? 0}`,
				`Posts: ${profile.postsCount ?? 0}`,
			];
			return lines.join("\n");
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error getting Bluesky profile: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
