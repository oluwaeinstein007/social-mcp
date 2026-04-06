import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { getLinkedInService } from "../../services/linkedin-service.js";

const deletePostParams = z.object({
	ugcPostUrn: z
		.string()
		.min(1)
		.describe("The URN of the post to delete, e.g. urn:li:ugcPost:123456"),
});

type DeletePostParams = z.infer<typeof deletePostParams>;

export const deletePostTool = {
	name: "DELETE_LINKEDIN_POST",
	description: "Delete a LinkedIn UGC post",
	parameters: deletePostParams,
	execute: async (params: DeletePostParams) => {
		try {
			await getLinkedInService().deletePost(params.ugcPostUrn);
			return `Post deleted successfully: ${params.ugcPostUrn}`;
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error deleting LinkedIn post: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
