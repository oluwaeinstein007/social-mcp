import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { getTwitterService } from "../../services/twitter-service.js";

const deleteTweetParams = z.object({
	tweetId: z.string().min(1).describe("The ID of the tweet to delete"),
});

type DeleteTweetParams = z.infer<typeof deleteTweetParams>;

export const deleteTweetTool = {
	name: "DELETE_TWEET",
	description: "Delete a tweet from Twitter/X",
	parameters: deleteTweetParams,
	execute: async (params: DeleteTweetParams) => {
		try {
			const result = await getTwitterService().deleteTweet(params.tweetId);
			return `Tweet deleted successfully!\n\nDeleted: ${result.deleted}`;
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error deleting tweet: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
