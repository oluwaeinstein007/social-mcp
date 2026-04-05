import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { getTwitterService } from "../../services/twitter-service.js";

const replyTweetParams = z.object({
	tweetId: z.string().min(1).describe("The ID of the tweet to reply to"),
	text: z
		.string()
		.min(1)
		.max(280)
		.describe("The reply text (max 280 characters)"),
});

type ReplyTweetParams = z.infer<typeof replyTweetParams>;

export const replyTweetTool = {
	name: "REPLY_TWEET",
	description: "Reply to an existing tweet on Twitter/X",
	parameters: replyTweetParams,
	execute: async (params: ReplyTweetParams) => {
		try {
			const reply = await getTwitterService().replyToTweet(
				params.tweetId,
				params.text,
			);
			return `Reply sent successfully!\n\nReply ID: ${reply.id}\nText: ${reply.text}`;
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error sending reply: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
