import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { getRedditService } from "../../services/reddit-service.js";

const submitPostParams = z.object({
	subreddit: z
		.string()
		.min(1)
		.describe("The subreddit to post to (without r/ prefix)"),
	title: z.string().min(1).max(300).describe("Title of the post"),
	kind: z
		.enum(["self", "link", "image"])
		.default("self")
		.describe(
			"Post type: 'self' for text, 'link' for a URL, 'image' for a photo",
		),
	text: z.string().optional().describe("Text content for self posts"),
	url: z.string().url().optional().describe("URL for link posts"),
	image: z
		.string()
		.optional()
		.describe("Base64-encoded image/video bytes, for kind='image'."),
	imageFilename: z.string().optional().describe("Filename for the image."),
	imageMimeType: z
		.string()
		.optional()
		.describe("MIME type for the image, e.g. image/png."),
});

type SubmitPostParams = z.infer<typeof submitPostParams>;

export const submitPostTool = {
	name: "REDDIT_SUBMIT_POST",
	description: "Submit a post to a Reddit subreddit (text, link, or image)",
	parameters: submitPostParams,
	execute: async (params: SubmitPostParams) => {
		try {
			const result = await getRedditService().submitPost(
				params.subreddit,
				params.title,
				params.kind,
				params.text,
				params.url,
				params.image
					? {
							content: params.image,
							filename: params.imageFilename ?? "image.jpg",
							mimeType: params.imageMimeType ?? "image/jpeg",
						}
					: undefined,
			);
			if (result.json.errors.length > 0) {
				return `Reddit post errors: ${JSON.stringify(result.json.errors)}`;
			}
			const data = result.json.data;
			return `Post submitted successfully to r/${params.subreddit}!\n\nPost ID: ${data?.name ?? "unknown"}\nURL: ${data?.url ?? "unknown"}`;
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error submitting Reddit post: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
