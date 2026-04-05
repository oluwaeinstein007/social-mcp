import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { getInstagramService } from "../../services/instagram-service.js";

const createPostParams = z.object({
	userId: z.string().describe("The Instagram user ID"),
	imageUrl: z.string().url().describe("The URL of the image to post"),
	caption: z.string().min(1).describe("The caption for the Instagram post"),
});

type CreatePostParams = z.infer<typeof createPostParams>;

export const createPostTool = {
	name: "CREATE_INSTAGRAM_POST",
	description: "Publish an image post on Instagram",
	parameters: createPostParams,
	execute: async (params: CreatePostParams) => {
		try {
			const post = await getInstagramService().createPost(
				params.userId,
				params.imageUrl,
				params.caption,
			);
			return `Post created successfully on Instagram!\n\nPost ID: ${post.id}`;
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error creating Instagram post: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
