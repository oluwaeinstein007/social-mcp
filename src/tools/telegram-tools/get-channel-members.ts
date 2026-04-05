import dedent from "dedent";
import { z } from "zod";
import { TelegramService } from "../../services/telegram-service.js";

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
	name: "GET_CHANNEL_MEMBERS",
	description: "Get a list of channel administrators",
	parameters: getChannelMembersParams,
	execute: async (params: GetChannelMembersParams) => {
		const telegramService = new TelegramService();

		try {
			const members = await telegramService.getChannelMembers(
				params.channelId,
				params.limit,
			);

			if (members.length === 0) {
				return "No administrators found or insufficient permissions to view administrators.";
			}

			const membersList = members
				.map((member, index) => {
					const name = [member.firstName, member.lastName]
						.filter(Boolean)
						.join(" ");
					return dedent`
					${index + 1}. ${name || "No name"}
					   User ID: ${member.userId}
					   Username: ${member.username ? `@${member.username}` : "N/A"}
					   Status: ${member.status}
				`;
				})
				.join("\n\n");

			return dedent`
				Channel Administrators (showing ${members.length}):

				${membersList}
			`;
		} catch (error) {
			if (error instanceof Error) {
				if (error.message.includes("BOT_TOKEN")) {
					return "Error: Telegram bot token is not configured. Please set the TELEGRAM_BOT_TOKEN environment variable.";
				}
				return `Error getting channel members: ${error.message}`;
			}
			return "An unknown error occurred while getting channel members";
		}
	},
} as const;
