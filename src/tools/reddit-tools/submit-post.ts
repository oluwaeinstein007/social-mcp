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
		.enum(["self", "link"])
		.default("self")
		.describe("Post type: 'self' for text post, 'link' for link post"),
	text: z.string().optional().describe("Text content for self posts"),
	url: z.string().url().optional().describe("URL for link posts"),
});

type SubmitPostParams = z.infer<typeof submitPostParams>;

export const submitPostTool = {
	name: "REDDIT_SUBMIT_POST",
	description: "Submit a post to a Reddit subreddit (text or link)",
	parameters: submitPostParams,
	execute: async (params: SubmitPostParams) => {
		try {
			const result = await getRedditService().submitPost(
				params.subreddit,
				params.title,
				params.kind,
				params.text,
				params.url,
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
