import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { HashnodeService, getHashnodeService } from "../../services/hashnode-service.js";

const params = z.object({
	first: z.number().int().min(1).max(50).optional().default(10).describe("Number of posts to fetch (default: 10, max: 50)"),
	publicationId: z.string().optional().describe("Hashnode publication ID (overrides HASHNODE_PUBLICATION_ID env var)"),
	accessToken: z.string().optional().describe("Hashnode Personal Access Token (overrides HASHNODE_ACCESS_TOKEN env var)"),
});

type Params = z.infer<typeof params>;

export const getPostsTool = {
	name: "HASHNODE_GET_POSTS",
	description: "Get recent posts from a Hashnode publication.",
	parameters: params,
	execute: async (p: Params) => {
		try {
			const service = p.accessToken
				? new HashnodeService({ accessToken: p.accessToken, publicationId: p.publicationId })
				: getHashnodeService();

			const pub = await service.getPosts(p.publicationId, p.first ?? 10);
			if (!pub) return "Publication not found.";

			const posts = pub.posts?.edges ?? [];
			if (!posts.length) return `No posts found in publication "${pub.title ?? pub.id}".`;

			return [
				`Publication: ${pub.title ?? pub.id}`,
				...(pub.url ? [`URL: ${pub.url}`] : []),
				``,
				...posts.map(({ node: post }, i) => {
					const tags = post.tags?.map((t) => t.name).join(", ") ?? "";
					return [
						`${i + 1}. ${post.title}`,
						`   ID: ${post.id}`,
						...(post.url ? [`   URL: ${post.url}`] : []),
						...(post.publishedAt ? [`   Published: ${post.publishedAt}`] : []),
						...(tags ? [`   Tags: ${tags}`] : []),
						...(post.reactionCount != null ? [`   Reactions: ${post.reactionCount}`] : []),
					].join("\n");
				}),
			].join("\n");
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error fetching Hashnode posts: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
