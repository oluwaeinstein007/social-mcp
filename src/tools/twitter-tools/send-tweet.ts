import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { getTwitterService } from "../../services/twitter-service.js";

const sendTweetParams = z.object({
	text: z.string().min(1).max(280).describe("The text of the tweet to send"),
});

type SendTweetParams = z.infer<typeof sendTweetParams>;

export const sendTweetTool = {
	name: "SEND_TWEET",
	description: "Post a tweet on Twitter/X",
	parameters: sendTweetParams,
	execute: async (params: SendTweetParams) => {
		try {
			const tweet = await getTwitterService().sendTweet(params.text);
			return `Tweet sent successfully!\n\nTweet ID: ${tweet.id}\nText: ${tweet.text}`;
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error sending tweet: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
