import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { getLinkedInService } from "../../services/linkedin-service.js";

const createPostParams = z.object({
	authorUrn: z
		.string()
		.min(1)
		.describe(
			"The URN of the post author, e.g. urn:li:person:ABC123 or urn:li:organization:123456",
		),
	text: z.string().min(1).max(3000).describe("The text content of the post"),
	visibility: z
		.enum(["PUBLIC", "CONNECTIONS", "LOGGED_IN"])
		.default("PUBLIC")
		.describe("Who can see the post"),
});

type CreatePostParams = z.infer<typeof createPostParams>;

export const createPostTool = {
	name: "CREATE_LINKEDIN_POST",
	description:
		"Create a LinkedIn UGC post on behalf of a member or organization",
	parameters: createPostParams,
	execute: async (params: CreatePostParams) => {
		try {
			const post = await getLinkedInService().createPost(
				params.authorUrn,
				params.text,
				params.visibility,
			);
			return `Post created successfully on LinkedIn!\n\nPost ID: ${post.id}`;
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error creating LinkedIn post: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
