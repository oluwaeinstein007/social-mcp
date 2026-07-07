import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { getTwitterService } from "../../services/twitter-service.js";

const sendTweetParams = z.object({
	text: z.string().min(1).max(280).describe("The text of the tweet to send"),
	media: z
		.array(
			z.object({
				content: z.string().describe("Base64-encoded image/gif/video bytes."),
				mimeType: z.string().describe("MIME type, e.g. image/png, video/mp4."),
			}),
		)
		.max(4)
		.optional()
		.describe("Media attachments (up to 4 images, or 1 gif/video)."),
});

type SendTweetParams = z.infer<typeof sendTweetParams>;

export const sendTweetTool = {
	name: "SEND_TWEET",
	description:
		"Post a tweet on Twitter/X, optionally with image/gif/video attachments",
	parameters: sendTweetParams,
	execute: async (params: SendTweetParams) => {
		try {
			const tweet = await getTwitterService().sendTweet(
				params.text,
				params.media,
			);
			return `Tweet sent successfully!\n\nTweet ID: ${tweet.id}\nText: ${tweet.text}`;
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error sending tweet: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
