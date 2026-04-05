import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { getTelegramService } from "../../services/telegram-service.js";

const getChannelInfoParams = z.object({
	channelId: z
		.union([z.string(), z.number()])
		.describe(
			"The channel ID or username (e.g., @channelname or -1001234567890)",
		),
});

type GetChannelInfoParams = z.infer<typeof getChannelInfoParams>;

export const getChannelInfoTool = {
	name: "TELEGRAM_GET_CHANNEL_INFO",
	description: "Get information about a Telegram channel or chat",
	parameters: getChannelInfoParams,
	execute: async (params: GetChannelInfoParams) => {
		try {
			const info = await getTelegramService().getChannelInfo(params.channelId);
			return `Channel Information:\n\nTitle: ${info.title}\nID: ${info.id}\nType: ${info.type}\nUsername: ${info.username ?? "N/A"}\nDescription: ${info.description ?? "N/A"}\nMember Count: ${info.memberCount ?? "N/A"}`;
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error getting channel info: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
