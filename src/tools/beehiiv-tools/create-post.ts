import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { BeehiivService, getBeehiivService } from "../../services/beehiiv-service.js";

const params = z.object({
	title: z.string().min(1).describe("Newsletter subject line / title"),
	bodyHtml: z.string().min(1).describe("Post body as HTML"),
	subtitle: z.string().optional().describe("Preview text shown in email clients below the subject line"),
	status: z
		.enum(["draft", "confirmed"])
		.optional()
		.default("draft")
		.describe("'draft' saves the post, 'confirmed' schedules/sends it"),
	audience: z
		.enum(["free", "premium", "all"])
		.optional()
		.default("free")
		.describe("Who receives this post (default: free subscribers)"),
	publicationId: z.string().optional().describe("Beehiiv publication ID (overrides BEEHIIV_PUBLICATION_ID env var)"),
	apiKey: z.string().optional().describe("Beehiiv API key (overrides BEEHIIV_API_KEY env var)"),
});

type Params = z.infer<typeof params>;

export const createPostTool = {
	name: "BEEHIIV_CREATE_POST",
	description: "Create a newsletter post on Beehiiv. Set status to 'confirmed' to schedule it for sending.",
	parameters: params,
	execute: async (p: Params) => {
		try {
			const service = p.apiKey
				? new BeehiivService({ apiKey: p.apiKey, publicationId: p.publicationId })
				: getBeehiivService();

			const result = await service.createPost(
				p.publicationId,
				p.title,
				p.bodyHtml,
				p.subtitle,
				p.status ?? "draft",
				p.audience ?? "free",
			);

			const post = result.data;
			return [
				`Beehiiv post ${post.status === "draft" ? "saved as draft" : "confirmed"}!`,
				``,
				`Title: ${post.title ?? post.id}`,
				`ID: ${post.id}`,
				`Status: ${post.status}`,
				...(post.web_url ? [`URL: ${post.web_url}`] : []),
				...(post.audience ? [`Audience: ${post.audience}`] : []),
			].join("\n");
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error creating Beehiiv post: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
