import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { GhostService, getGhostService } from "../../services/ghost-service.js";

const params = z.object({
	id: z.string().describe("Post ID to delete (from GHOST_GET_POSTS)"),
	siteUrl: z.string().optional().describe("Ghost site URL (overrides GHOST_SITE_URL env var)"),
	adminApiKey: z.string().optional().describe("Ghost Admin API key id:secret (overrides GHOST_ADMIN_API_KEY env var)"),
});

type Params = z.infer<typeof params>;

export const deletePostTool = {
	name: "GHOST_DELETE_POST",
	description: "Permanently delete a Ghost post by ID. This action cannot be undone.",
	parameters: params,
	execute: async (p: Params) => {
		try {
			const service =
				p.siteUrl && p.adminApiKey
					? new GhostService({ siteUrl: p.siteUrl, adminApiKey: p.adminApiKey })
					: getGhostService();

			await service.deletePost(p.id);
			return `Ghost post ${p.id} deleted successfully.`;
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error deleting Ghost post: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
