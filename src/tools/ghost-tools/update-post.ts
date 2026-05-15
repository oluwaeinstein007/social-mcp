import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { GhostService, getGhostService } from "../../services/ghost-service.js";

const params = z.object({
	id: z.string().describe("Post ID (from GHOST_GET_POSTS)"),
	updatedAt: z
		.string()
		.describe("Current updated_at timestamp of the post (required by Ghost for optimistic locking)"),
	title: z.string().optional().describe("New title"),
	html: z.string().optional().describe("New body HTML"),
	status: z.enum(["draft", "published"]).optional().describe("New status"),
	tags: z.array(z.string()).optional().describe("New tag names (replaces existing tags)"),
	excerpt: z.string().optional().describe("New custom excerpt"),
	siteUrl: z.string().optional().describe("Ghost site URL (overrides GHOST_SITE_URL env var)"),
	adminApiKey: z.string().optional().describe("Ghost Admin API key id:secret (overrides GHOST_ADMIN_API_KEY env var)"),
});

type Params = z.infer<typeof params>;

export const updatePostTool = {
	name: "GHOST_UPDATE_POST",
	description: "Update an existing Ghost post. Requires the post's current updated_at timestamp for optimistic locking.",
	parameters: params,
	execute: async (p: Params) => {
		try {
			const service =
				p.siteUrl && p.adminApiKey
					? new GhostService({ siteUrl: p.siteUrl, adminApiKey: p.adminApiKey })
					: getGhostService();

			const updates: Record<string, unknown> = {};
			if (p.title !== undefined) updates.title = p.title;
			if (p.html !== undefined) updates.html = p.html;
			if (p.status !== undefined) updates.status = p.status;
			if (p.tags !== undefined) updates.tags = p.tags;
			if (p.excerpt !== undefined) updates.custom_excerpt = p.excerpt;

			const result = await service.updatePost(p.id, p.updatedAt, updates);
			const post = result.posts[0];
			if (!post) return "Update may have succeeded but no data was returned.";

			return [
				`Ghost post updated!`,
				``,
				`Title: ${post.title}`,
				`ID: ${post.id}`,
				`Status: ${post.status}`,
				...(post.url ? [`URL: ${post.url}`] : []),
				...(post.updated_at ? [`Updated At: ${post.updated_at}`] : []),
			].join("\n");
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error updating Ghost post: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
