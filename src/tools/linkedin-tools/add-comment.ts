import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { getLinkedInService } from "../../services/linkedin-service.js";

const addCommentParams = z.object({
	actorUrn: z
		.string()
		.min(1)
		.describe(
			"The URN of the person posting the comment, e.g. urn:li:person:ABC123",
		),
	ugcPostUrn: z
		.string()
		.min(1)
		.describe("The URN of the post to comment on, e.g. urn:li:ugcPost:123456"),
	text: z.string().min(1).max(1250).describe("The comment text"),
});

type AddCommentParams = z.infer<typeof addCommentParams>;

export const addCommentTool = {
	name: "ADD_LINKEDIN_COMMENT",
	description: "Add a comment to a LinkedIn post",
	parameters: addCommentParams,
	execute: async (params: AddCommentParams) => {
		try {
			const result = await getLinkedInService().addComment(
				params.actorUrn,
				params.ugcPostUrn,
				params.text,
			);
			return `Comment added successfully to LinkedIn post: ${params.ugcPostUrn}\n\nComment ID: ${result.id}`;
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error adding LinkedIn comment: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
