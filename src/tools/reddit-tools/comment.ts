import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { getRedditService } from "../../services/reddit-service.js";

const commentParams = z.object({
	parentId: z
		.string()
		.min(1)
		.describe(
			"The fullname of the thing to comment on (e.g. t3_abc123 for a post, t1_def456 for a comment)",
		),
	text: z.string().min(1).describe("The comment text (supports Markdown)"),
});

type CommentParams = z.infer<typeof commentParams>;

export const commentTool = {
	name: "REDDIT_COMMENT",
	description: "Post a comment on a Reddit post or reply to an existing comment",
	parameters: commentParams,
	execute: async (params: CommentParams) => {
		try {
			const result = await getRedditService().comment(params.parentId, params.text);
			if (result.json.errors.length > 0) {
				return `Reddit comment errors: ${JSON.stringify(result.json.errors)}`;
			}
			return `Comment posted successfully!\n\nComment ID: ${result.json.data?.name ?? "unknown"}`;
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error posting Reddit comment: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
