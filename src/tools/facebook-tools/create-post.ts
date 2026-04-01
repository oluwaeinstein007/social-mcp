import dedent from "dedent";
import { z } from "zod";
import { FacebookService } from "../../services/facebook-service.js";

const createPostParams = z.object({
  pageId: z.string().describe("The ID of the Facebook page"),
  message: z.string().min(1).describe("The text of the post"),
});

type CreatePostParams = z.infer<typeof createPostParams>;

export const createPostTool = {
  name: "CREATE_FACEBOOK_POST",
  description: "Create a post on a Facebook page",
  parameters: createPostParams,
  execute: async (params: CreatePostParams) => {
    const facebookService = new FacebookService();

    try {
      const post = await facebookService.createPost(
        params.pageId,
        params.message,
      );

      return dedent`
        Post created successfully on Facebook!

        Post ID: ${post.post_id}
        Page ID: ${post.id}
      `;
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("FACEBOOK_ACCESS_TOKEN")) {
          return "Error: Facebook access token is not configured. Please set the FACEBOOK_ACCESS_TOKEN environment variable.";
        }
        return `Error creating post: ${error.message}`;
      }
      return "An unknown error occurred while creating the post";
    }
  },
} as const;
