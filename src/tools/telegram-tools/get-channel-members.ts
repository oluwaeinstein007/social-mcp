import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { getTelegramService } from "../../services/telegram-service.js";

const getChannelMembersParams = z.object({
	channelId: z
		.union([z.string(), z.number()])
		.describe("The channel ID or username"),
	limit: z
		.number()
		.min(1)
		.max(50)
		.default(10)
		.describe("Maximum number of administrators to retrieve (1-50)"),
});

type GetChannelMembersParams = z.infer<typeof getChannelMembersParams>;

export const getChannelMembersTool = {
	name: "TELEGRAM_GET_CHANNEL_MEMBERS",
	description: "Get a list of channel administrators",
	parameters: getChannelMembersParams,
	execute: async (params: GetChannelMembersParams) => {
		try {
			const members = await getTelegramService().getChannelMembers(
				params.channelId,
				params.limit,
			);
			if (members.length === 0) {
				return "No administrators found or insufficient permissions.";
			}
			const list = members
				.map((m, i) => {
					const name = [m.firstName, m.lastName].filter(Boolean).join(" ");
					return `${i + 1}. ${name || "No name"}\n   User ID: ${m.userId}\n   Username: ${m.username ? `@${m.username}` : "N/A"}\n   Status: ${m.status}`;
				})
				.join("\n\n");
			return `Channel Administrators (showing ${members.length}):\n\n${list}`;
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error getting channel members: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
