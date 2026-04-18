import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { getRedditService } from "../../services/reddit-service.js";

const voteParams = z.object({
	id: z
		.string()
		.min(1)
		.describe("The fullname of the post or comment to vote on (e.g. t3_abc123 or t1_def456)"),
	direction: z
		.enum(["upvote", "downvote", "remove"])
		.describe("Vote direction: upvote, downvote, or remove existing vote"),
});

type VoteParams = z.infer<typeof voteParams>;

const dirMap = { upvote: 1, downvote: -1, remove: 0 } as const;

export const voteTool = {
	name: "REDDIT_VOTE",
	description: "Upvote, downvote, or remove a vote on a Reddit post or comment",
	parameters: voteParams,
	execute: async (params: VoteParams) => {
		try {
			await getRedditService().vote(params.id, dirMap[params.direction]);
			return `Vote recorded: ${params.direction} on ${params.id}`;
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error voting on Reddit: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
