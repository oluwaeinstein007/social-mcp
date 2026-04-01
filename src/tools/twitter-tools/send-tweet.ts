import dedent from "dedent";
import { z } from "zod";
import { TwitterService } from "../../services/twitter-service.js";

const sendTweetParams = z.object({
  text: z.string().min(1).max(280).describe("The text of the tweet to send"),
});

type SendTweetParams = z.infer<typeof sendTweetParams>;

export const sendTweetTool = {
  name: "SEND_TWEET",
  description: "Sends a tweet",
  parameters: sendTweetParams,
  execute: async (params: SendTweetParams) => {
    const twitterService = new TwitterService();

    try {
      const tweet = await twitterService.sendTweet(params.text);

      return dedent`
        Tweet sent successfully!

        Tweet ID: ${tweet.id}
        Text: ${tweet.text}
      `;
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("Twitter API credentials")) {
          return "Error: Twitter API credentials are not configured. Please set the TWITTER_APP_KEY, TWITTER_APP_SECRET, TWITTER_ACCESS_TOKEN, and TWITTER_ACCESS_SECRET environment variables.";
        }
        return `Error sending tweet: ${error.message}`;
      }
      return "An unknown error occurred while sending the tweet";
    }
  },
} as const;
