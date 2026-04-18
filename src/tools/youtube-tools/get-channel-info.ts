import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { getYouTubeService } from "../../services/youtube-service.js";

const params = z.object({
	channelId: z.string().optional().describe("Channel ID to look up. Omit to get the authenticated user's own channel."),
});

type Params = z.infer<typeof params>;

export const getChannelInfoTool = {
	name: "YOUTUBE_GET_CHANNEL_INFO",
	description: "Get YouTube channel information including subscriber count, view count, and video count",
	parameters: params,
	execute: async (p: Params) => {
		try {
			const result = await getYouTubeService().getChannelInfo(p.channelId);
			const channel = result.items?.[0];
			if (!channel) return "No channel found.";
			const s = channel.snippet;
			const st = channel.statistics;
			return [
				`YouTube Channel Info:`,
				s?.title ? `Name: ${s.title}` : null,
				s?.customUrl ? `Handle: ${s.customUrl}` : null,
				s?.description ? `Description: ${s.description}` : null,
				s?.country ? `Country: ${s.country}` : null,
				s?.publishedAt ? `Created: ${s.publishedAt}` : null,
				st?.subscriberCount ? `Subscribers: ${st.subscriberCount}` : null,
				st?.viewCount ? `Total views: ${st.viewCount}` : null,
				st?.videoCount ? `Videos: ${st.videoCount}` : null,
				channel.id ? `Channel ID: ${channel.id}` : null,
			]
				.filter(Boolean)
				.join("\n");
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error fetching YouTube channel info: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
