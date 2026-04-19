import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { getThreadsService } from "../../services/threads-service.js";

const createPostParams = z.object({
	text: z
		.string()
		.min(1)
		.max(500)
		.describe("The text content of the Threads post"),
});

type CreatePostParams = z.infer<typeof createPostParams>;

export const createPostTool = {
	name: "THREADS_CREATE_POST",
	description: "Create a new text post on Threads",
	parameters: createPostParams,
	execute: async (params: CreatePostParams) => {
		try {
			const result = await getThreadsService().createPost(params.text);
			return `Post created successfully on Threads!\n\nPost ID: ${result.id}`;
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error creating Threads post: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
