import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { getThreadsService } from "../../services/threads-service.js";

const deletePostParams = z.object({
	mediaId: z.string().min(1).describe("The ID of the Threads post to delete"),
});

type DeletePostParams = z.infer<typeof deletePostParams>;

export const deletePostTool = {
	name: "THREADS_DELETE_POST",
	description: "Delete a Threads post by its ID",
	parameters: deletePostParams,
	execute: async (params: DeletePostParams) => {
		try {
			await getThreadsService().deletePost(params.mediaId);
			return `Threads post ${params.mediaId} deleted successfully.`;
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error deleting Threads post: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
