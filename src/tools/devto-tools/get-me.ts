import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { DevToService, getDevToService } from "../../services/devto-service.js";

const params = z.object({
	apiKey: z
		.string()
		.optional()
		.describe("Dev.to API key (overrides DEVTO_API_KEY env var)"),
});

type Params = z.infer<typeof params>;

export const getMeTool = {
	name: "DEVTO_GET_ME",
	description:
		"Get the authenticated Dev.to user's profile (also useful to validate an API key).",
	parameters: params,
	execute: async (p: Params) => {
		try {
			const service = p.apiKey
				? new DevToService({ apiKey: p.apiKey })
				: getDevToService();
			const me = await service.getMe();
			return [
				`Username: @${me.username}`,
				`ID: ${me.id}`,
				...(me.name ? [`Name: ${me.name}`] : []),
				...(me.summary ? [`Summary: ${me.summary}`] : []),
			].join("\n");
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error fetching Dev.to profile: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
