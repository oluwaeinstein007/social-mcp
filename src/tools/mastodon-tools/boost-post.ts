import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { getMastodonService } from "../../services/mastodon-service.js";

const boostPostParams = z.object({
	statusId: z.string().describe("The ID of the post to boost (reblog)"),
});

type BoostPostParams = z.infer<typeof boostPostParams>;

export const boostPostTool = {
	name: "MASTODON_BOOST_POST",
	description: "Boost (reblog) a post on Mastodon",
	parameters: boostPostParams,
	execute: async (params: BoostPostParams) => {
		try {
			const result = await getMastodonService().boostPost(params.statusId);
			return `Post boosted successfully on Mastodon!\n\nBoost Post ID: ${result.id}`;
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error boosting Mastodon post: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
