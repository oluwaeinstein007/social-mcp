import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { getRedditService } from "../../services/reddit-service.js";

const getUserInfoParams = z.object({
	username: z.string().min(1).describe("Reddit username (without u/ prefix)"),
});

type GetUserInfoParams = z.infer<typeof getUserInfoParams>;

export const getUserInfoTool = {
	name: "REDDIT_GET_USER_INFO",
	description: "Get public information about a Reddit user",
	parameters: getUserInfoParams,
	execute: async (params: GetUserInfoParams) => {
		try {
			const result = await getRedditService().getUserInfo(params.username);
			const d = result.data;
			const created = d.created_utc
				? new Date(d.created_utc * 1000).toISOString()
				: "unknown";
			return [
				`Reddit user: u/${d.name}`,
				`ID: ${d.id}`,
				`Link karma: ${d.link_karma ?? 0}`,
				`Comment karma: ${d.comment_karma ?? 0}`,
				`Account created: ${created}`,
				`Gold: ${d.is_gold ? "Yes" : "No"}`,
				d.subreddit?.public_description
					? `Bio: ${d.subreddit.public_description}`
					: null,
			]
				.filter(Boolean)
				.join("\n");
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error fetching Reddit user info: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
