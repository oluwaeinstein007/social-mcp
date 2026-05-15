import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { HashnodeService, getHashnodeService } from "../../services/hashnode-service.js";

const params = z.object({
	publicationId: z.string().optional().describe("Hashnode publication ID (overrides HASHNODE_PUBLICATION_ID env var)"),
	accessToken: z.string().optional().describe("Hashnode Personal Access Token (overrides HASHNODE_ACCESS_TOKEN env var)"),
});

type Params = z.infer<typeof params>;

export const getPublicationTool = {
	name: "HASHNODE_GET_PUBLICATION",
	description: "Get information about a Hashnode publication, including its ID, title, and URL.",
	parameters: params,
	execute: async (p: Params) => {
		try {
			const service = p.accessToken
				? new HashnodeService({ accessToken: p.accessToken, publicationId: p.publicationId })
				: getHashnodeService();

			const pub = await service.getPublication(p.publicationId);
			if (!pub) return "Publication not found.";

			return [
				`Hashnode Publication`,
				``,
				`ID: ${pub.id}`,
				...(pub.title ? [`Title: ${pub.title}`] : []),
				...(pub.displayTitle ? [`Display Title: ${pub.displayTitle}`] : []),
				...(pub.url ? [`URL: ${pub.url}`] : []),
			].join("\n");
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error fetching Hashnode publication: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
