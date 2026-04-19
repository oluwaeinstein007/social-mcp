import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { getBlueskyService } from "../../services/bluesky-service.js";

const replyToPostParams = z.object({
	text: z.string().min(1).max(300).describe("The text content of the reply"),
	parentUri: z
		.string()
		.describe(
			"The AT URI of the post to reply to (e.g. at://did:plc:.../app.bsky.feed.post/...)",
		),
	parentCid: z.string().describe("The CID of the post to reply to"),
	rootUri: z
		.string()
		.describe(
			"The AT URI of the root post in the thread (same as parentUri if replying to the top-level post)",
		),
	rootCid: z
		.string()
		.describe(
			"The CID of the root post in the thread (same as parentCid if replying to the top-level post)",
		),
});

type ReplyToPostParams = z.infer<typeof replyToPostParams>;

export const replyToPostTool = {
	name: "BLUESKY_REPLY_TO_POST",
	description: "Reply to a post on Bluesky",
	parameters: replyToPostParams,
	execute: async (params: ReplyToPostParams) => {
		try {
			const result = await getBlueskyService().replyToPost(
				params.text,
				params.parentUri,
				params.parentCid,
				params.rootUri,
				params.rootCid,
			);
			return `Reply posted successfully on Bluesky!\n\nPost URI: ${result.uri}\nCID: ${result.cid}`;
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error replying to Bluesky post: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
