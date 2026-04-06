import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { getLinkedInService } from "../../services/linkedin-service.js";

const getPostsParams = z.object({
	authorUrn: z
		.string()
		.min(1)
		.describe(
			"The URN of the post author, e.g. urn:li:person:ABC123 or urn:li:organization:123456",
		),
	count: z
		.number()
		.int()
		.min(1)
		.max(100)
		.default(10)
		.describe("Number of posts to retrieve"),
});

type GetPostsParams = z.infer<typeof getPostsParams>;

export const getPostsTool = {
	name: "GET_LINKEDIN_POSTS",
	description: "Get recent LinkedIn UGC posts by a member or organization",
	parameters: getPostsParams,
	execute: async (params: GetPostsParams) => {
		try {
			const result = await getLinkedInService().getPosts(
				params.authorUrn,
				params.count,
			);
			if (result.elements.length === 0) {
				return "No posts found for the specified author.";
			}
			const lines = result.elements.map((el, i) => {
				const text =
					el.specificContent?.["com.linkedin.ugc.ShareContent"]
						?.shareCommentary?.text ?? "(no text)";
				const ts = el.created?.time
					? new Date(el.created.time).toISOString()
					: "unknown time";
				return `${i + 1}. [${ts}] ${el.id}\n   ${text}`;
			});
			return `LinkedIn posts for ${params.authorUrn}:\n\n${lines.join("\n\n")}`;
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error fetching LinkedIn posts: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
