import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { getMastodonService } from "../../services/mastodon-service.js";

const createPostParams = z.object({
	status: z
		.string()
		.min(1)
		.max(500)
		.describe("The text content of the post (toot)"),
	visibility: z
		.enum(["public", "unlisted", "private", "direct"])
		.default("public")
		.describe("Visibility of the post: public, unlisted, private, or direct"),
	media: z
		.array(
			z.object({
				content: z.string().describe("Base64-encoded file bytes."),
				filename: z.string().optional(),
				description: z
					.string()
					.optional()
					.describe("Alt text for accessibility."),
			}),
		)
		.max(4)
		.optional()
		.describe("Media attachments (up to 4)."),
});

type CreatePostParams = z.infer<typeof createPostParams>;

export const createPostTool = {
	name: "MASTODON_CREATE_POST",
	description:
		"Create a new post (toot) on Mastodon, optionally with media attachments",
	parameters: createPostParams,
	execute: async (params: CreatePostParams) => {
		try {
			const service = getMastodonService();
			const mediaIds = params.media?.length
				? await Promise.all(params.media.map((m) => service.uploadMedia(m)))
				: undefined;
			const result = await service.createPost(
				params.status,
				params.visibility,
				mediaIds,
			);
			return `Post created successfully on Mastodon!\n\nPost ID: ${result.id}\nURL: ${result.url ?? "N/A"}`;
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error creating Mastodon post: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
