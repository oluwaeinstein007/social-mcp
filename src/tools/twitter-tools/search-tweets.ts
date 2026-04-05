import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { getTwitterService } from "../../services/twitter-service.js";

const searchTweetsParams = z.object({
	query: z.string().min(1).describe("The search query"),
	maxResults: z
		.number()
		.int()
		.min(10)
		.max(100)
		.default(10)
		.describe("Maximum number of tweets to return (10-100)"),
});

type SearchTweetsParams = z.infer<typeof searchTweetsParams>;

export const searchTweetsTool = {
	name: "SEARCH_TWEETS",
	description: "Search for recent tweets matching a query",
	parameters: searchTweetsParams,
	execute: async (params: SearchTweetsParams) => {
		try {
			const paginator = await getTwitterService().searchTweets(
				params.query,
				params.maxResults,
			);
			const tweets = paginator.tweets;
			const meta = paginator.meta;
			if (!tweets || tweets.length === 0) {
				return "No tweets found for the given query.";
			}
			const list = tweets
				.map((t) => `Tweet ID: ${t.id}\nText: ${t.text}`)
				.join("\n\n");
			return `Tweets retrieved successfully! (${meta?.result_count ?? tweets.length} results)\n\n${list}`;
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error searching tweets: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
