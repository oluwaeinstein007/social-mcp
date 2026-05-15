import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { getMediumService, MediumService } from "../../services/medium-service.js";

const getUserParams = z.object({
	accessToken: z
		.string()
		.optional()
		.describe("Medium integration token (overrides MEDIUM_ACCESS_TOKEN env var)"),
});

type GetUserParams = z.infer<typeof getUserParams>;

export const getUserTool = {
	name: "MEDIUM_GET_USER",
	description:
		"Get the authenticated Medium user's profile, including their user ID needed for publishing articles.",
	parameters: getUserParams,
	execute: async (params: GetUserParams) => {
		try {
			const service = params.accessToken
				? new MediumService({ accessToken: params.accessToken })
				: getMediumService();

			const result = await service.getUser();
			const user = result.data;

			return [
				`Medium User Profile`,
				``,
				`ID: ${user.id}`,
				`Username: @${user.username}`,
				`Name: ${user.name}`,
				...(user.url ? [`Profile URL: ${user.url}`] : []),
			].join("\n");
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error fetching Medium user: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
