import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { getYouTubeService } from "../../services/youtube-service.js";

const params = z.object({
	query: z.string().min(1).describe("Search query"),
	maxResults: z
		.number()
		.int()
		.min(1)
		.max(50)
		.default(10)
		.describe("Number of results to return (1-50)"),
	pageToken: z.string().optional().describe("Page token for pagination"),
});

type Params = z.infer<typeof params>;

export const searchVideosTool = {
	name: "YOUTUBE_SEARCH_VIDEOS",
	description: "Search YouTube for videos by keyword",
	parameters: params,
	execute: async (p: Params) => {
		try {
			const result = await getYouTubeService().searchVideos(
				p.query,
				p.maxResults,
				p.pageToken,
			);
			const items = result.items;
			if (!items?.length) return "No videos found for that query.";
			const lines = items.map((item, i) => {
				const title = item.snippet?.title ?? "Untitled";
				const channel = item.snippet?.channelTitle ?? "Unknown";
				const videoId = item.id?.videoId;
				const url = videoId
					? `https://www.youtube.com/watch?v=${videoId}`
					: "N/A";
				return `${i + 1}. ${title}\n   Channel: ${channel}\n   URL: ${url}`;
			});
			const total = result.pageInfo?.totalResults;
			const next = result.nextPageToken
				? `\nNext page token: ${result.nextPageToken}`
				: "";
			return [
				`Search results for "${p.query}"${total ? ` (${total} total)` : ""}:`,
				"",
				...lines,
				next,
			]
				.join("\n")
				.trim();
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error searching YouTube: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
