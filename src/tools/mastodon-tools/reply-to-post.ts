import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { getMastodonService } from "../../services/mastodon-service.js";

const replyToPostParams = z.object({
	status: z.string().min(1).max(500).describe("The text content of the reply"),
	inReplyToId: z.string().describe("The ID of the post to reply to"),
	visibility: z
		.enum(["public", "unlisted", "private", "direct"])
		.default("public")
		.describe("Visibility of the reply"),
});

type ReplyToPostParams = z.infer<typeof replyToPostParams>;

export const replyToPostTool = {
	name: "MASTODON_REPLY_TO_POST",
	description: "Reply to a post on Mastodon",
	parameters: replyToPostParams,
	execute: async (params: ReplyToPostParams) => {
		try {
			const result = await getMastodonService().replyToPost(
				params.status,
				params.inReplyToId,
				params.visibility,
			);
			return `Reply posted successfully on Mastodon!\n\nPost ID: ${result.id}\nURL: ${result.url ?? "N/A"}`;
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error replying to Mastodon post: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
