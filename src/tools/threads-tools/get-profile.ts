import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { getThreadsService } from "../../services/threads-service.js";

export const getProfileTool = {
	name: "THREADS_GET_PROFILE",
	description: "Get your Threads profile information",
	parameters: z.object({}),
	execute: async () => {
		try {
			const profile = await getThreadsService().getProfile();
			return [
				`Threads Profile:`,
				`ID: ${profile.id}`,
				profile.username ? `Username: @${profile.username}` : null,
				profile.name ? `Name: ${profile.name}` : null,
				profile.biography ? `Bio: ${profile.biography}` : null,
				profile.followers_count !== undefined
					? `Followers: ${profile.followers_count}`
					: null,
			]
				.filter(Boolean)
				.join("\n");
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error fetching Threads profile: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
