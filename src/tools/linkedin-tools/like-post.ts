import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { getLinkedInService } from "../../services/linkedin-service.js";

const likePostParams = z.object({
	actorUrn: z
		.string()
		.min(1)
		.describe(
			"The URN of the person liking the post, e.g. urn:li:person:ABC123",
		),
	ugcPostUrn: z
		.string()
		.min(1)
		.describe("The URN of the post to like, e.g. urn:li:ugcPost:123456"),
});

type LikePostParams = z.infer<typeof likePostParams>;

export const likePostTool = {
	name: "LIKE_LINKEDIN_POST",
	description: "Like a LinkedIn post on behalf of a member",
	parameters: likePostParams,
	execute: async (params: LikePostParams) => {
		try {
			await getLinkedInService().likePost(params.actorUrn, params.ugcPostUrn);
			return `Successfully liked LinkedIn post: ${params.ugcPostUrn}`;
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error liking LinkedIn post: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
