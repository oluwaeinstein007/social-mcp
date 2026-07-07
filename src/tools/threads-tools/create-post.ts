import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { getThreadsService } from "../../services/threads-service.js";

const createPostParams = z.object({
	text: z
		.string()
		.min(1)
		.max(500)
		.describe("The text content of the Threads post"),
	replyToId: z.string().optional().describe("ID of the post to reply to."),
	mediaUrl: z
		.string()
		.url()
		.optional()
		.describe("Public image or video URL to attach."),
	mediaType: z
		.enum(["IMAGE", "VIDEO"])
		.optional()
		.describe("Required when `mediaUrl` is set."),
});

type CreatePostParams = z.infer<typeof createPostParams>;

export const createPostTool = {
	name: "THREADS_CREATE_POST",
	description:
		"Create a new post on Threads, optionally with an image or video",
	parameters: createPostParams,
	execute: async (params: CreatePostParams) => {
		try {
			const result = await getThreadsService().createPost(
				params.text,
				params.replyToId,
				params.mediaUrl && params.mediaType
					? { url: params.mediaUrl, type: params.mediaType }
					: undefined,
			);
			return `Post created successfully on Threads!\n\nPost ID: ${result.id}`;
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error creating Threads post: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
