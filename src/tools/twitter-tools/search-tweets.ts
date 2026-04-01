import dedent from "dedent";
import { z } from "zod";
import { TwitterService } from "../../services/twitter-service.js";

const searchTweetsParams = z.object({
	query: z.string().min(1).describe("The search query to use"),
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
	description: "Searches for recent tweets matching a query",
	parameters: searchTweetsParams,
	execute: async (params: SearchTweetsParams) => {
		const twitterService = new TwitterService();

		try {
			const paginator = await twitterService.searchTweets(
				params.query,
				params.maxResults,
			);

			// .tweets returns TweetV2[], .meta returns the search metadata
			const tweets = paginator.tweets;
			const meta = paginator.meta;

			if (!tweets || tweets.length === 0) {
				return "No tweets found for the given query.";
			}

			const tweetList = tweets
				.map(
					(tweet) => dedent`
				Tweet ID: ${tweet.id}
				Text: ${tweet.text}
			`,
				)
				.join("\n\n");

			return dedent`
				Tweets retrieved successfully! (${meta?.result_count ?? tweets.length} results)

				${tweetList}
			`;
		} catch (error) {
			if (error instanceof Error) {
				if (error.message.includes("Twitter API credentials")) {
					return "Error: Twitter API credentials are not configured. Please set the TWITTER_APP_KEY, TWITTER_APP_SECRET, TWITTER_ACCESS_TOKEN, and TWITTER_ACCESS_SECRET environment variables.";
				}
				return `Error searching tweets: ${error.message}`;
			}
			return "An unknown error occurred while searching tweets";
		}
	},
} as const;
