import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { getSlackService } from "../../services/slack-service.js";

const listChannelsParams = z.object({
	limit: z
		.number()
		.int()
		.min(1)
		.max(1000)
		.default(100)
		.describe("Maximum number of channels to return (1-1000)"),
});

type ListChannelsParams = z.infer<typeof listChannelsParams>;

export const listChannelsTool = {
	name: "LIST_SLACK_CHANNELS",
	description: "List public channels in the Slack workspace",
	parameters: listChannelsParams,
	execute: async (params: ListChannelsParams) => {
		try {
			const channels = await getSlackService().listChannels(params.limit);
			if (channels.length === 0) {
				return "No channels found.";
			}
			const list = channels
				.map(
					(ch) =>
						`#${ch.name ?? "unknown"} (ID: ${ch.id ?? "N/A"}) — ${ch.memberCount ?? 0} members${ch.isPrivate ? " [private]" : ""}`,
				)
				.join("\n");
			return `Found ${channels.length} channel(s):\n\n${list}`;
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error listing channels: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
