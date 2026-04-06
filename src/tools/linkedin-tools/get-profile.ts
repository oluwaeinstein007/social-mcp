import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { getLinkedInService } from "../../services/linkedin-service.js";

const getProfileParams = z.object({});

type GetProfileParams = z.infer<typeof getProfileParams>;

export const getProfileTool = {
	name: "GET_LINKEDIN_PROFILE",
	description: "Get the authenticated user's LinkedIn profile information",
	parameters: getProfileParams,
	execute: async (_params: GetProfileParams) => {
		try {
			const profile = await getLinkedInService().getProfile();
			const name = [profile.localizedFirstName, profile.localizedLastName]
				.filter(Boolean)
				.join(" ");
			return `LinkedIn Profile:\n\nID: ${profile.id}\nName: ${name || "N/A"}\nHeadline: ${profile.localizedHeadline ?? "N/A"}`;
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error fetching LinkedIn profile: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
