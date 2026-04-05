import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { getTwitterService } from "../../services/twitter-service.js";

const getUserInfoParams = z.object({
	username: z
		.string()
		.min(1)
		.describe("The Twitter username to get information for (without @)"),
});

type GetUserInfoParams = z.infer<typeof getUserInfoParams>;

export const getUserInfoTool = {
	name: "GET_TWITTER_USER_INFO",
	description: "Get profile information and metrics for a Twitter/X user",
	parameters: getUserInfoParams,
	execute: async (params: GetUserInfoParams) => {
		try {
			const user = await getTwitterService().getUserInfo(params.username);
			return `User information retrieved successfully!\n\nID: ${user.id}\nName: ${user.name}\nUsername: @${user.username}\nDescription: ${user.description ?? "N/A"}\nFollowers: ${user.public_metrics?.followers_count ?? "N/A"}\nFollowing: ${user.public_metrics?.following_count ?? "N/A"}\nTweets: ${user.public_metrics?.tweet_count ?? "N/A"}`;
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error getting user info: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
