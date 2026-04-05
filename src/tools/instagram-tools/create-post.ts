import dedent from "dedent";
import { z } from "zod";
import { InstagramService } from "../../services/instagram-service.js";

const createPostParams = z.object({
  userId: z.string().describe("The Instagram user ID"),
  imageUrl: z.string().url().describe("The URL of the image to post"),
  message: z.string().min(1).describe("The text content of the Instagram post"),
});

type CreatePostParams = z.infer<typeof createPostParams>;

export const createPostTool = {
  name: "CREATE_INSTAGRAM_POST",
  description: "Create an Instagram post with an image and text",
  parameters: createPostParams,
  execute: async (params: CreatePostParams) => {
    const instagramService = new InstagramService();

    try {
      const post = await instagramService.createPost(params.userId, params.imageUrl, params.message);

      return dedent`
        Post created successfully on Instagram!

        Post ID: ${post.id}
      `;
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("INSTAGRAM_ACCESS_TOKEN")) {
          return "Error: Instagram access token is not configured. Please set the INSTAGRAM_ACCESS_TOKEN environment variable.";
        }
        return `Error creating Instagram post: ${error.message}`;
      }
      return "An unknown error occurred while creating the Instagram post";
    }
  },
} as const;
