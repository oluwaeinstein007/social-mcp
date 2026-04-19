import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { getThreadsService } from "../../services/threads-service.js";

const replyParams = z.object({
	replyToId: z
		.string()
		.min(1)
		.describe("The ID of the Threads post to reply to"),
	text: z.string().min(1).max(500).describe("The reply text content"),
});

type ReplyParams = z.infer<typeof replyParams>;

export const replyTool = {
	name: "THREADS_REPLY",
	description: "Reply to a Threads post",
	parameters: replyParams,
	execute: async (params: ReplyParams) => {
		try {
			const result = await getThreadsService().createPost(
				params.text,
				params.replyToId,
			);
			return `Reply posted successfully on Threads!\n\nReply ID: ${result.id}`;
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error replying on Threads: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
