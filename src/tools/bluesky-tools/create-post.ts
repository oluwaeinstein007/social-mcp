import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { getBlueskyService } from "../../services/bluesky-service.js";

const createPostParams = z.object({
	text: z
		.string()
		.min(1)
		.max(300)
		.describe("The text content of the Bluesky post (max 300 characters)"),
	images: z
		.array(
			z.object({
				content: z.string().describe("Base64-encoded image bytes."),
				mimeType: z.string().describe("MIME type, e.g. image/png."),
				alt: z.string().optional().describe("Alt text for accessibility."),
			}),
		)
		.max(4)
		.optional()
		.describe("Image attachments (up to 4)."),
});

type CreatePostParams = z.infer<typeof createPostParams>;

export const createPostTool = {
	name: "BLUESKY_CREATE_POST",
	description: "Create a new post on Bluesky, optionally with up to 4 images",
	parameters: createPostParams,
	execute: async (params: CreatePostParams) => {
		try {
			const result = await getBlueskyService().createPost(
				params.text,
				params.images,
			);
			return `Post created successfully on Bluesky!\n\nPost URI: ${result.uri}\nCID: ${result.cid}`;
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error creating Bluesky post: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
