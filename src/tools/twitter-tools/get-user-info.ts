import dedent from "dedent";
import { z } from "zod";
import { TwitterService } from "../../services/twitter-service.js";

const getUserInfoParams = z.object({
  username: z.string().min(1).describe("The Twitter username to get information for"),
});

type GetUserInfoParams = z.infer<typeof getUserInfoParams>;

export const getUserInfoTool = {
  name: "GET_USER_INFO",
  description: "Gets information about a Twitter user",
  parameters: getUserInfoParams,
  execute: async (params: GetUserInfoParams) => {
    const twitterService = new TwitterService();

    try {
      const user = await twitterService.getUserInfo(params.username);

      return dedent`
        User information retrieved successfully!

        ID: ${user.id}
        Name: ${user.name}
        Username: ${user.username}
        Description: ${user.description}
        Followers: ${user.public_metrics?.followers_count}
        Following: ${user.public_metrics?.following_count}
        Tweets: ${user.public_metrics?.tweet_count}
      `;
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("Twitter API credentials")) {
          return "Error: Twitter API credentials are not configured. Please set the TWITTER_APP_KEY, TWITTER_APP_SECRET, TWITTER_ACCESS_TOKEN, and TWITTER_ACCESS_SECRET environment variables.";
        }
        return `Error getting user info: ${error.message}`;
      }
      return "An unknown error occurred while getting user info";
    }
  },
} as const;
