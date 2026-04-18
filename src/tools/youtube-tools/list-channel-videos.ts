import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { getYouTubeService } from "../../services/youtube-service.js";

const params = z.object({
	channelId: z.string().describe("YouTube channel ID"),
	maxResults: z.number().int().min(1).max(50).default(10).describe("Number of videos to return (1-50)"),
	pageToken: z.string().optional().describe("Page token for pagination"),
});

type Params = z.infer<typeof params>;

export const listChannelVideosTool = {
	name: "YOUTUBE_LIST_CHANNEL_VIDEOS",
	description: "List the most recent videos uploaded to a YouTube channel",
	parameters: params,
	execute: async (p: Params) => {
		try {
			const result = await getYouTubeService().listChannelVideos(p.channelId, p.maxResults, p.pageToken);
			const items = result.items;
			if (!items?.length) return "No videos found for this channel.";
			const lines = items.map((item, i) => {
				const title = item.snippet?.title ?? "Untitled";
				const published = item.snippet?.publishedAt ?? "";
				const videoId = item.id?.videoId;
				const url = videoId ? `https://www.youtube.com/watch?v=${videoId}` : "N/A";
				return `${i + 1}. ${title}\n   Published: ${published}\n   URL: ${url}`;
			});
			const next = result.nextPageToken ? `\nNext page token: ${result.nextPageToken}` : "";
			return [`Recent videos for channel ${p.channelId}:`, "", ...lines, next].join("\n").trim();
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error listing YouTube channel videos: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
