import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { getTwitterService } from "../../services/twitter-service.js";

const likeTweetParams = z.object({
	tweetId: z.string().min(1).describe("The ID of the tweet to like"),
});

type LikeTweetParams = z.infer<typeof likeTweetParams>;

export const likeTweetTool = {
	name: "LIKE_TWEET",
	description: "Like a tweet on Twitter/X",
	parameters: likeTweetParams,
	execute: async (params: LikeTweetParams) => {
		try {
			const result = await getTwitterService().likeTweet(params.tweetId);
			return `Tweet liked successfully!\n\nLiked: ${result.liked}`;
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error liking tweet: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
